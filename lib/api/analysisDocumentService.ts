// Analysis Document Service - Unified API
// Uses consolidated endpoints for both general and compliance documents
import { FetchClient } from './fetchClient';
import {
  DocumentType,
  DocumentStatus,
  AnalysisDocumentRecord,
  InitUploadRequest,
  InitUploadResponse,
  CompleteUploadRequest,
  CompleteUploadResponse,
  ListDocumentsParams,
  ListDocumentsResponse,
  ViewDocumentResponse,
  DownloadDocumentResponse,
  ExportDocumentRequest,
  ExportDocumentResponse,
  StorageUsageResponse,
} from '@/types/analysisDocument';

// Unified API Endpoints
const ENDPOINTS = {
  INIT_UPLOAD: 'api/dms/documents/init-upload',
  COMPLETE_UPLOAD: 'api/dms/documents/complete-upload',
  LIST_DOCUMENTS: 'api/dms/documents',
  GET_DOCUMENT: (id: string) => `api/dms/documents/${id}`,
  VIEW_DOCUMENT: (id: string) => `api/dms/documents/${id}/view`,
  DOWNLOAD_DOCUMENT: (id: string) => `api/dms/documents/${id}/download`,
  DELETE_DOCUMENT: (id: string) => `api/dms/documents/${id}`,
  EXPORT_DOCUMENT: 'api/dms/documents/export',
  STORAGE_USAGE: 'api/dms/documents/storage/usage',
} as const;

class AnalysisDocumentService {
  /**
   * Initialize file upload (works for both general and compliance documents)
   * @param file File info
   * @param documentType 'general' or 'compliance'
   */
  async initUpload(
    file: { file_name: string; file_size: number; file_type: string; checksum?: string },
    documentType: DocumentType = 'general'
  ): Promise<{ document_id: string; upload_url: string; s3_key: string }> {
    try {
      const request: InitUploadRequest = {
        document_type: documentType,
        files: [
          {
            file_name: file.file_name,
            file_size: file.file_size,
            file_type: file.file_type,
            checksum: file.checksum,
          },
        ],
      };

      console.log('[AnalysisDocumentService] Init upload request:', request);

      const response: any = await FetchClient.makeRequest<any>(ENDPOINTS.INIT_UPLOAD, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      console.log('[AnalysisDocumentService] Init upload response:', response);

      if (response.success && response.data) {
        const data = response.data;

        // Response uses upload_urls array
        if (data.upload_urls && data.upload_urls.length > 0) {
          const fileInfo = data.upload_urls[0];
          return {
            document_id: fileInfo.document_id,
            upload_url: fileInfo.upload_url,
            s3_key: fileInfo.s3_key || '',
          };
        }

        // Fallback: files array format
        if (data.files && data.files.length > 0) {
          const fileInfo = data.files[0];
          return {
            document_id: fileInfo.document_id,
            upload_url: fileInfo.upload_url || fileInfo.presigned_url,
            s3_key: fileInfo.s3_key || '',
          };
        }

        // Direct response
        if (data.document_id && (data.upload_url || data.presigned_url)) {
          return {
            document_id: data.document_id,
            upload_url: data.upload_url || data.presigned_url,
            s3_key: data.s3_key || '',
          };
        }
      }

      const errorMsg = response.error?.message || response.message || 'Failed to initialize upload';
      console.error('[AnalysisDocumentService] Invalid response:', response);
      throw new Error(errorMsg);
    } catch (error: any) {
      console.error('[AnalysisDocumentService] Init upload error:', error);
      throw error;
    }
  }

  /**
   * Complete file upload after uploading to S3
   */
  async completeUpload(
    documentId: string,
    s3Key: string,
    metadata?: Record<string, any>
  ): Promise<CompleteUploadResponse> {
    try {
      const request: CompleteUploadRequest = {
        document_id: documentId,
        s3_key: s3Key,
        metadata,
      };

      const response = await FetchClient.makeRequest<CompleteUploadResponse>(
        ENDPOINTS.COMPLETE_UPLOAD,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to complete upload');
    } catch (error: any) {
      console.error('[AnalysisDocumentService] Complete upload error:', error);
      throw error;
    }
  }

  /**
   * List documents with pagination and filtering
   * @param params Pagination and filter params
   */
  async listDocuments(params: ListDocumentsParams = {}): Promise<ListDocumentsResponse> {
    try {
      const { page = 1, page_size = 10, status, document_type } = params;

      let url = `${ENDPOINTS.LIST_DOCUMENTS}?page=${page}&page_size=${page_size}`;
      if (status) url += `&status=${status}`;
      if (document_type) url += `&document_type=${document_type}`;

      const response = await FetchClient.makeRequest<ListDocumentsResponse>(url, { method: 'GET' });

      if (response.success && response.data) {
        return response.data;
      }

      return { documents: [], total: 0, page, page_size, total_pages: 0 };
    } catch (error: any) {
      console.error('[AnalysisDocumentService] List documents error:', error);
      return {
        documents: [],
        total: 0,
        page: params.page || 1,
        page_size: params.page_size || 10,
        total_pages: 0,
      };
    }
  }

  /**
   * Get a specific document by ID
   */
  async getDocument(documentId: string): Promise<AnalysisDocumentRecord | null> {
    try {
      const response = await FetchClient.makeRequest<AnalysisDocumentRecord>(
        ENDPOINTS.GET_DOCUMENT(documentId),
        { method: 'GET' }
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error: any) {
      console.error('[AnalysisDocumentService] Get document error:', error);
      return null;
    }
  }

  /**
   * View document - returns presigned URL for viewing
   */
  async viewDocument(
    documentId: string,
    viewOptions?: { format?: string }
  ): Promise<ViewDocumentResponse | null> {
    try {
      const response: any = await FetchClient.makeRequest<any>(
        ENDPOINTS.VIEW_DOCUMENT(documentId),
        {
          method: 'POST',
          body: JSON.stringify({ view_options: viewOptions || {} }),
        }
      );

      console.log('[AnalysisDocumentService] View document response:', response);

      if (response.success && response.data) {
        // Handle presigned_url from response
        if (response.data.presigned_url) {
          return { url: response.data.presigned_url };
        }
        if (response.data.url) {
          return response.data;
        }
        if (response.data.downloadable_url) {
          return { url: response.data.downloadable_url };
        }
      }

      // Direct URL in response
      if (response.presigned_url || response.url || response.downloadable_url) {
        return { url: response.presigned_url || response.url || response.downloadable_url };
      }

      return null;
    } catch (error: any) {
      console.error('[AnalysisDocumentService] View document error:', error);
      return null;
    }
  }

  /**
   * Download document - returns presigned URL for downloading
   */
  async downloadDocument(documentId: string): Promise<DownloadDocumentResponse | null> {
    try {
      const response: any = await FetchClient.makeRequest<any>(
        ENDPOINTS.DOWNLOAD_DOCUMENT(documentId),
        { method: 'GET' }
      );

      console.log('[AnalysisDocumentService] Download document response:', response);

      if (response.success && response.data) {
        // Handle presigned_url from response
        if (response.data.presigned_url) {
          return {
            url: response.data.presigned_url,
            file_name: response.data.file_name || '',
          };
        }
        if (response.data.url) {
          return response.data;
        }
      }

      // Direct response format
      if (response.presigned_url || response.url) {
        return { url: response.presigned_url || response.url, file_name: '' };
      }

      return null;
    } catch (error: any) {
      console.error('[AnalysisDocumentService] Download document error:', error);
      return null;
    }
  }

  /**
   * Delete a document
   * @param documentId Document ID
   * @param deleteFromS3 Also delete from S3 storage
   */
  async deleteDocument(documentId: string, deleteFromS3: boolean = false): Promise<boolean> {
    try {
      const url = `${ENDPOINTS.DELETE_DOCUMENT(documentId)}?delete_from_s3=${deleteFromS3}`;
      const response = await FetchClient.makeRequest<{ success: boolean }>(url, {
        method: 'DELETE',
      });

      return response.success;
    } catch (error: any) {
      console.error('[AnalysisDocumentService] Delete document error:', error);
      return false;
    }
  }

  /**
   * Export document to PDF/DOCX
   * @param exportRequest Export configuration
   */
  async exportDocument(
    exportRequest: ExportDocumentRequest
  ): Promise<ExportDocumentResponse | null> {
    try {
      const response: any = await FetchClient.makeRequest<any>(ENDPOINTS.EXPORT_DOCUMENT, {
        method: 'POST',
        body: JSON.stringify(exportRequest),
      });

      console.log('[AnalysisDocumentService] Export document response:', response);

      if (response.success && response.data) {
        return response.data;
      }

      // Direct response format
      if (response.url) {
        return { url: response.url, file_name: exportRequest.title || 'export' };
      }

      return null;
    } catch (error: any) {
      console.error('[AnalysisDocumentService] Export document error:', error);
      return null;
    }
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(): Promise<StorageUsageResponse | null> {
    try {
      const response = await FetchClient.makeRequest<StorageUsageResponse>(
        ENDPOINTS.STORAGE_USAGE,
        { method: 'GET' }
      );

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error: any) {
      console.error('[AnalysisDocumentService] Get storage usage error:', error);
      return null;
    }
  }

  /**
   * Upload file directly to S3 using presigned URL
   */
  async uploadToS3(presignedUrl: string, file: File): Promise<boolean> {
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      return response.ok;
    } catch (error: any) {
      console.error('[AnalysisDocumentService] S3 upload error:', error);
      return false;
    }
  }
}

export const analysisDocumentService = new AnalysisDocumentService();
