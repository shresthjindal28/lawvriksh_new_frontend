import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import type { APIResponse } from '@/types/auth';
import { WebSocketMessageType } from '@/lib/constants/document-upload';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import {
  DeleteDocumentResponse,
  Document,
  DocumentQueryParams,
  DocumentsData,
  InitUploadRequest,
  InitUploadResponse,
  CompleteUploadRequest,
  CompleteUploadResponse,
  ViewDocumentResponse,
  DownloadDocumentResponse,
  InitUploadFileRequest,
} from '@/types/library';

interface UploadCallbacks {
  onProgress?: (progress: number, status: string) => void;
}

class LibraryDocumentService {
  private ws: WebSocket | null = null;
  private fileInfoMap: Map<string, UploadCallbacks> = new Map();

  //generate checksum
  private async generateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    const byteArray = new Uint8Array(hash);
    const base64String = btoa(String.fromCharCode(...byteArray));
    return base64String;
  }

  //init upload
  private async initUpload(request: InitUploadRequest): Promise<APIResponse<InitUploadResponse>> {
    return FetchClient.makeRequest<InitUploadResponse>(API_ENDPOINTS.INIT_UPLOAD, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  //upload to s3 with progress
  private async uploadToS3(
    file: File,
    uploadUrl: string,
    checksum: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);

      xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('x-amz-checksum-sha256', checksum);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          console.error('S3 upload failed:', xhr.status, xhr.statusText);
          resolve(false);
        }
      };

      xhr.onerror = () => {
        console.error('S3 upload network error');
        resolve(false);
      };

      xhr.send(file);
    });
  }

  //complete upload
  private async completeUpload(
    request: CompleteUploadRequest
  ): Promise<APIResponse<CompleteUploadResponse>> {
    return FetchClient.makeRequest<CompleteUploadResponse>(API_ENDPOINTS.COMPLETE_UPLOAD, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // WEBSOCKET METHODS
  private async connectWebSocket(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return resolve(); // Server-side check

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
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

      try {
        this.ws = new WebSocket(`${wsUrl}?token=${token}`);
        this.ws.onopen = () => resolve();
        this.ws.onerror = (e) => {
          console.warn('WebSocket connection failed, continuing without WS updates', e);
          resolve(); // Resolve anyway to not block upload
        };
        this.ws.onmessage = (event) => {
          try {
            const rawMessage = JSON.parse(event.data);
            this.handleWebSocketMessage(rawMessage);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
      } catch (e) {
        console.warn('Failed to create WebSocket', e);
        resolve();
      }
    });
  }

  private handleWebSocketMessage(message: any): void {
    const { type, data } = message;
    const callbacks = this.fileInfoMap.get(data?.documentId);

    if (!callbacks) return;

    if (type === WebSocketMessageType.PROCESSING_UPDATE) {
      callbacks.onProgress?.(data.progress || 0, data.stage || 'processing');
    } else if (type === WebSocketMessageType.PROCESSING_COMPLETE) {
      callbacks.onProgress?.(100, 'completed');
      this.fileInfoMap.delete(data.documentId);
    } else if (type === WebSocketMessageType.PROCESSING_ERROR) {
      this.fileInfoMap.delete(data.documentId);
    }
  }

  private subscribeToDocument(documentId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          action: 'subscribe',
          documentIds: [documentId],
        })
      );
    }
  }

  private disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  //upload document
  async uploadDocument(
    file: File,
    metadata?: Record<string, any>,
    onProgress?: (progress: number, status: string) => void
  ): Promise<APIResponse<Document>> {
    try {
      await this.connectWebSocket();

      // Generate checksum
      const checksum = await this.generateChecksum(file);

      //init upload
      const initRequest: InitUploadRequest = {
        files: [
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            checksum: checksum,
          },
        ],
      };

      const initResponse = await this.initUpload(initRequest);

      if (!initResponse.success || !initResponse.data?.upload_urls?.[0]) {
        return {
          success: false,
          message: initResponse.message || 'Failed to initialize upload',
        };
      }

      const uploadInfo = initResponse.data.upload_urls[0];
      const documentId = uploadInfo.document_id;

      if (onProgress) {
        this.fileInfoMap.set(documentId, { onProgress });
        this.subscribeToDocument(documentId);
        onProgress(0, 'uploading');
      }

      //upload to s3
      const uploadSuccess = await this.uploadToS3(
        file,
        uploadInfo.upload_url,
        checksum,
        (percent) => onProgress?.(percent, 'uploading')
      );

      if (!uploadSuccess) {
        return {
          success: false,
          message: 'Failed to upload file to S3',
        };
      }

      //complete upload
      const completeRequest: CompleteUploadRequest = {
        document_id: documentId,
        s3_key: uploadInfo.s3_key,
        metadata: {
          ...metadata,
          source: 'web',
          checksum: checksum,
          original_name: file.name,
        },
      };

      const completeResponse = await this.completeUpload(completeRequest);

      if (!completeResponse.success) {
        return {
          success: false,
          message: completeResponse.message || 'Failed to complete upload',
        };
      }

      // Keep WS open for a bit to catch processing updates if needed,
      // or let the caller handle it.
      // But since this function returns, we might close it or let it stay if we want.
      // For now, we return the document.

      //get document by id
      return this.getDocumentById(documentId);
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  //upload multiple documents
  async uploadMultipleDocuments(
    files: File[],
    metadata?: Record<string, any>
  ): Promise<APIResponse<Document[]>> {
    try {
      // Generate checksums for all files
      const fileRequests: InitUploadFileRequest[] = await Promise.all(
        files.map(async (file) => ({
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          checksum: await this.generateChecksum(file),
        }))
      );

      //init upload
      const initRequest: InitUploadRequest = { files: fileRequests };
      const initResponse = await this.initUpload(initRequest);

      if (!initResponse.success || !initResponse.data?.upload_urls) {
        return {
          success: false,
          message: initResponse.message || 'Failed to initialize uploads',
        };
      }

      //upload to s3
      const uploadPromises = initResponse.data.upload_urls.map((uploadInfo, index) =>
        this.uploadToS3(files[index], uploadInfo.upload_url, fileRequests[index].checksum)
      );

      const uploadResults = await Promise.all(uploadPromises);

      //complete upload
      const completePromises = initResponse.data.upload_urls
        .filter((_, index) => uploadResults[index])
        .map((uploadInfo, index) =>
          this.completeUpload({
            document_id: uploadInfo.document_id,
            s3_key: uploadInfo.s3_key,
            metadata: {
              ...metadata,
              source: 'web',
              checksum: fileRequests[index].checksum,
              original_name: files[index].name,
            },
          })
        );

      await Promise.all(completePromises);

      //get document by id
      const documentPromises = initResponse.data.upload_urls
        .filter((_, index) => uploadResults[index])
        .map((uploadInfo) => this.getDocumentById(uploadInfo.document_id));

      const documentResults = await Promise.all(documentPromises);
      const documents = documentResults
        .filter((result) => result.success && result.data)
        .map((result) => result.data!);

      return {
        success: true,
        data: documents,
        message: `Successfully uploaded ${documents.length} of ${files.length} files`,
      };
    } catch (error) {
      console.error('Multiple upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Multiple upload failed',
      };
    }
  }

  //get documents
  async getDocuments(params?: DocumentQueryParams): Promise<APIResponse<DocumentsData>> {
    const queryString = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params).map(([key, value]) => [key, String(value)])
        ).toString()
      : '';

    return FetchClient.makeRequest<DocumentsData>(API_ENDPOINTS.LIST_DOCUMENTS + queryString, {
      method: 'GET',
    });
  }

  //get document by id
  async getDocumentById(documentId: string): Promise<APIResponse<Document>> {
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    return FetchClient.makeRequest<Document>(API_ENDPOINTS.GET_DOCUMENT(documentId), {
      method: 'GET',
    });
  }

  //get view url
  async getViewUrl(documentId: string): Promise<APIResponse<ViewDocumentResponse>> {
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    return FetchClient.makeRequest<ViewDocumentResponse>(API_ENDPOINTS.VIEW_DOCUMENT(documentId), {
      method: 'POST',
    });
  }

  //get download url
  async getDownloadUrl(documentId: string): Promise<APIResponse<DownloadDocumentResponse>> {
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    return FetchClient.makeRequest<DownloadDocumentResponse>(
      API_ENDPOINTS.DOWNLOAD_DOCUMENT(documentId),
      {
        method: 'GET',
      }
    );
  }

  //delete document
  async deleteDocument(
    documentId: string,
    deleteFromS3: boolean = true
  ): Promise<APIResponse<DeleteDocumentResponse>> {
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    const queryString = deleteFromS3 ? '?delete_from_s3=true' : '';

    return FetchClient.makeRequest<DeleteDocumentResponse>(
      API_ENDPOINTS.DELETE_DOCUMENT(documentId) + queryString,
      {
        method: 'DELETE',
      }
    );
  }
}

export const libraryDocumentService = new LibraryDocumentService();
