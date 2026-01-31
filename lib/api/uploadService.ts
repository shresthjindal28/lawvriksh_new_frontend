import { UploadMethod, WebSocketMessageType } from '@/lib/constants/document-upload';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { FetchClient } from './fetchClient';
import {
  InitUploadRequest,
  InitUploadData,
  initUploadResponseSchema,
  uploadCompleteResponseSchema,
  wsMessageSchema,
  WsMessage,
  WsSubscribeMessage,
  WsUnsubscribeMessage,
} from '@/lib/validators/document/document.schemas';

interface UploadConfig {
  apiBaseUrl: string;
  wsUrl: string;
}

export interface FileUploadProgress {
  documentId: string;
  fileName: string;
  status: 'initializing' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage?: string;
  error?: string;
}

interface UploadCallbacks {
  onFileProgress?: (fileId: string, progress: FileUploadProgress) => void;
  onFileComplete?: (fileId: string, documentData: any) => void;
  onFileError?: (fileId: string, error: string, fileName: string, file: File) => void;
  onAllComplete?: (results: UploadResult[]) => void;
}

interface UploadResult {
  file: File;
  documentId?: string;
  success: boolean;
  error?: string;
}

class UploadService {
  private config: UploadConfig;
  private ws: WebSocket | null = null;
  private activeUploads: Map<string, AbortController> = new Map();
  private fileInfoMap: Map<string, { file: File; callbacks: UploadCallbacks }> = new Map();

  constructor(config: UploadConfig) {
    this.config = config;
  }

  // Uploads multiple files in parallel with a concurrency limit.
  public async uploadFiles(
    projectId: string,
    files: File[],
    callbacks: UploadCallbacks,
    concurrencyLimit = 3
  ): Promise<void> {
    await this.connectWebSocket();

    const results: UploadResult[] = [];
    const fileQueue = [...files];

    const worker = async () => {
      while (fileQueue.length > 0) {
        const file = fileQueue.shift();
        if (file) {
          const result = await this.uploadSingleFile(projectId, file, callbacks);
          results.push(result);
        }
      }
    };

    const workers = Array(concurrencyLimit).fill(null).map(worker);
    await Promise.all(workers);

    if (this.activeUploads.size === 0) {
      this.disconnectWebSocket();
    }

    callbacks.onAllComplete?.(results);
  }

  // Manages the complete upload lifecycle for a single file.
  private async uploadSingleFile(
    projectId: string,
    file: File,
    callbacks: UploadCallbacks
  ): Promise<UploadResult> {
    const abortController = new AbortController();
    let documentId: string | null = null;

    try {
      // Initial progress notification
      callbacks.onFileProgress?.(file.name, {
        documentId: '',
        fileName: file.name,
        status: 'initializing',
        progress: 0,
      });

      // Initialize the upload via our backend
      const initResponse = await this.initializeUpload(projectId, file);
      documentId = initResponse.documentId;

      if (!documentId) {
        throw new Error('Failed to initialize upload');
      }

      this.activeUploads.set(documentId, abortController);
      this.fileInfoMap.set(documentId, { file, callbacks });
      this.subscribeToDocument(documentId);

      // Upload the file based on the method
      if (initResponse.uploadMethod === UploadMethod.S3_PRESIGNED) {
        if (!initResponse.uploadUrl) {
          throw new Error('S3 upload URL not provided');
        }
        await this.uploadToS3(
          initResponse.uploadUrl,
          file,
          documentId,
          abortController.signal,
          callbacks
        );
        await this.notifyUploadComplete(documentId, initResponse.sessionId);
      } else if (initResponse.uploadMethod === UploadMethod.DIRECT) {
        await this.uploadDirect(
          projectId,
          file,
          documentId,
          initResponse.sessionId,
          abortController.signal,
          callbacks
        );
      } else {
        throw new Error(`Unsupported upload method: ${initResponse.uploadMethod}`);
      }

      // Mark as processing; further updates will come via WebSocket
      callbacks.onFileProgress?.(documentId, {
        documentId,
        fileName: file.name,
        status: 'processing',
        progress: 0,
        stage: 'queued',
      });

      return { file, documentId, success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (documentId) {
        callbacks.onFileProgress?.(documentId, {
          documentId,
          fileName: file.name,
          status: 'failed',
          progress: 0,
          error: errorMessage,
        });
        callbacks.onFileError?.(documentId, errorMessage, file.name, file);
      } else {
        callbacks.onFileProgress?.(file.name, {
          documentId: '',
          fileName: file.name,
          status: 'failed',
          progress: 0,
          error: errorMessage,
        });
        callbacks.onFileError?.(file.name, errorMessage, file.name, file);
      }
      return { file, documentId: documentId || undefined, success: false, error: errorMessage };
    } finally {
      if (documentId) {
        this.activeUploads.delete(documentId);
        this.unsubscribeFromDocument(documentId);
      }
    }
  }

  // API HELPER METHODS (using FetchClient with validation)
  private async initializeUpload(projectId: string, file: File): Promise<InitUploadData> {
    const requestData: InitUploadRequest = {
      projectId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    };

    const response = await FetchClient.makeRequest<any>(API_ENDPOINTS.INIT_UPLOAD, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    // Validate response with Zod schema
    const validatedResponse = initUploadResponseSchema.parse(response);

    if (!validatedResponse.success || !validatedResponse.data) {
      throw new Error(validatedResponse.error?.message || 'Failed to initialize upload');
    }

    return validatedResponse.data;
  }

  private async uploadToS3(
    url: string,
    file: File,
    documentId: string,
    signal: AbortSignal,
    callbacks: UploadCallbacks
  ): Promise<void> {
    return FetchClient.upload({
      url,
      file,
      signal,
      isS3: true,
      onProgress: (progress) => {
        callbacks.onFileProgress?.(documentId, {
          documentId,
          fileName: file.name,
          status: 'uploading',
          progress,
        });
      },
    });
  }

  private async uploadDirect(
    projectId: string,
    file: File,
    documentId: string,
    sessionId: string,
    signal: AbortSignal,
    callbacks: UploadCallbacks
  ): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId);
    formData.append('sessionId', sessionId);
    formData.append('projectId', projectId);

    return FetchClient.upload({
      url: `${this.config.apiBaseUrl}${API_ENDPOINTS.DIRECT_UPLOAD}`,
      file,
      body: formData,
      signal,
      isS3: false,
      onProgress: (progress) => {
        callbacks.onFileProgress?.(documentId, {
          documentId,
          fileName: file.name,
          status: 'uploading',
          progress,
        });
      },
    });
  }

  public async retryUpload(
    projectId: string,
    file: File,
    callbacks: UploadCallbacks
  ): Promise<void> {
    await this.connectWebSocket();
    await this.uploadSingleFile(projectId, file, callbacks);
    if (this.activeUploads.size === 0 && this.fileInfoMap.size === 0) {
      this.disconnectWebSocket();
    }
  }

  private async notifyUploadComplete(documentId: string, sessionId: string): Promise<void> {
    const response = await FetchClient.makeRequest<any>(
      `/api/documents/${documentId}/upload-complete`,
      {
        method: 'POST',
        body: JSON.stringify({ sessionId }),
      }
    );

    // Validate response
    const validatedResponse = uploadCompleteResponseSchema.parse(response);

    if (!validatedResponse.success) {
      throw new Error(
        validatedResponse.error?.message || 'Failed to notify server of upload completion'
      );
    }
  }

  // WEBSOCKET METHODS
  private async connectWebSocket(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }
    return new Promise((resolve, reject) => {
      let token = '';
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, ...rest] = cookie.trim().split('=');
          if (name === STORAGE_KEYS.ACCESS_TOKEN) {
            token = decodeURIComponent(rest.join('='));
            break;
          }
        }
      }
      this.ws = new WebSocket(`${this.config.wsUrl}?token=${token}`);
      this.ws.onopen = () => resolve();
      this.ws.onerror = () => reject(new Error('WebSocket connection failed'));
      this.ws.onmessage = (event) => {
        try {
          const rawMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(rawMessage);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    });
  }

  private handleWebSocketMessage(rawMessage: any): void {
    try {
      // Validate message with Zod schema
      const message: WsMessage = wsMessageSchema.parse(rawMessage);
      const { type, data } = message;

      const fileInfo = this.fileInfoMap.get(data.documentId);
      if (!fileInfo) return; // Ignore messages for files we're not tracking

      const { file, callbacks } = fileInfo;
      let progressUpdate: FileUploadProgress;

      switch (type) {
        case WebSocketMessageType.PROCESSING_UPDATE:
          progressUpdate = {
            documentId: data.documentId,
            fileName: file.name,
            status: 'processing',
            progress: data.progress || 0,
            stage: data.stage,
          };
          callbacks.onFileProgress?.(data.documentId, progressUpdate);
          break;

        case WebSocketMessageType.PROCESSING_COMPLETE:
          progressUpdate = {
            documentId: data.documentId,
            fileName: file.name,
            status: 'completed',
            progress: 100,
          };
          callbacks.onFileProgress?.(data.documentId, progressUpdate);
          callbacks.onFileComplete?.(data.documentId, data);
          this.fileInfoMap.delete(data.documentId);
          break;

        case WebSocketMessageType.PROCESSING_ERROR:
          progressUpdate = {
            documentId: data.documentId,
            fileName: file.name,
            status: 'failed',
            progress: 0,
            error: data.error.message,
          };
          callbacks.onFileProgress?.(data.documentId, progressUpdate);
          callbacks.onFileError?.(data.documentId, data.error.message, file.name, file);
          this.fileInfoMap.delete(data.documentId);
          break;
      }
    } catch (error) {
      console.error('Invalid WebSocket message format:', error);
    }
  }

  private subscribeToDocument(documentId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WsSubscribeMessage = {
        action: 'subscribe',
        documentIds: [documentId],
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  private unsubscribeFromDocument(documentId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message: WsUnsubscribeMessage = {
        action: 'unsubscribe',
        documentIds: [documentId],
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // CANCELLATION METHODS
  public cancelUpload(documentId: string): void {
    this.activeUploads.get(documentId)?.abort();
  }

  public cancelAllUploads(): void {
    this.activeUploads.forEach((controller) => controller.abort());
    this.activeUploads.clear();
    this.disconnectWebSocket();
  }
}

export default UploadService;
