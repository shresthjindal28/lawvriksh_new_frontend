import { FetchClient } from './fetchClient';
import {
  DocumentStatusResponse,
  documentStatusResponseSchema,
  DocumentDetailsResponse,
  documentDetailsResponseSchema,
  CancelDocumentRequest,
  CancelDocumentResponse,
  cancelDocumentResponseSchema,
  DeleteDocumentResponse,
  deleteDocumentResponseSchema,
  BatchStatusResponse,
  batchStatusResponseSchema,
  RetryProcessingRequest,
  RetryProcessingResponse,
  retryProcessingResponseSchema,
  ApiResponse,
} from '@/lib/validators/document/document.schemas';

class DocumentService {
  // Get the current processing status of a document

  async getDocumentStatus(documentId: string): Promise<DocumentStatusResponse> {
    const response = await FetchClient.makeRequest<any>(`/api/documents/${documentId}/status`, {
      method: 'GET',
    });

    return documentStatusResponseSchema.parse(response);
  }

  // Get complete document details and extracted content
  async getDocumentDetails(documentId: string): Promise<DocumentDetailsResponse> {
    const response = await FetchClient.makeRequest<any>(`/api/documents/${documentId}`, {
      method: 'GET',
    });

    return documentDetailsResponseSchema.parse(response);
  }

  // Cancel ongoing document processing
  async cancelDocumentProcessing(
    documentId: string,
    reason?: string
  ): Promise<CancelDocumentResponse> {
    const requestData: CancelDocumentRequest = reason ? { reason } : {};

    const response = await FetchClient.makeRequest<any>(`/api/documents/${documentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return cancelDocumentResponseSchema.parse(response);
  }

  // Delete a document and its associated data
  async deleteDocument(
    documentId: string,
    deleteFromS3: boolean = true
  ): Promise<DeleteDocumentResponse> {
    const queryParams = new URLSearchParams({ deleteFromS3: deleteFromS3.toString() });

    const response = await FetchClient.makeRequest<any>(
      `/api/documents/${documentId}?${queryParams}`,
      {
        method: 'DELETE',
      }
    );

    return deleteDocumentResponseSchema.parse(response);
  }

  // Get status of all documents in a project
  async getBatchStatus(projectId: string, statusFilter?: string): Promise<BatchStatusResponse> {
    const queryParams = statusFilter
      ? new URLSearchParams({ status: statusFilter })
      : new URLSearchParams();

    const response = await FetchClient.makeRequest<any>(
      `/api/projects/${projectId}/documents/status?${queryParams}`,
      {
        method: 'GET',
      }
    );

    // Validate with Zod schema
    return batchStatusResponseSchema.parse(response);
  }

  // Retry processing for a failed document
  async retryProcessing(documentId: string, fromStage?: string): Promise<RetryProcessingResponse> {
    const requestData: RetryProcessingRequest = fromStage ? { fromStage } : {};

    const response = await FetchClient.makeRequest<any>(`/api/documents/${documentId}/retry`, {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    // Validate with Zod schema
    return retryProcessingResponseSchema.parse(response);
  }

  // Poll document status until processing is complete
  async pollDocumentStatus(
    documentId: string,
    onStatusUpdate?: (status: DocumentStatusResponse) => void,
    intervalMs: number = 2000,
    timeoutMs: number = 300000 // 5 minutes default
  ): Promise<DocumentStatusResponse> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getDocumentStatus(documentId);

          if (onStatusUpdate) {
            onStatusUpdate(status);
          }

          if (!status.success) {
            reject(new Error(status.error?.message || 'Failed to get document status'));
            return;
          }

          const docStatus = status.data?.status;

          // Check if processing is complete
          if (docStatus === 'completed' || docStatus === 'failed' || docStatus === 'cancelled') {
            resolve(status);
            return;
          }

          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error('Polling timeout exceeded'));
            return;
          }

          // Continue polling
          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Batch delete multiple documents
  async batchDeleteDocuments(
    documentIds: string[],
    deleteFromS3: boolean = true
  ): Promise<ApiResponse<{ deleted: string[]; failed: string[] }>> {
    const results = await Promise.allSettled(
      documentIds.map((id) => this.deleteDocument(id, deleteFromS3))
    );

    const deleted: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        deleted.push(documentIds[index]);
      } else {
        failed.push(documentIds[index]);
      }
    });

    return {
      success: failed.length === 0,
      data: { deleted, failed },
      message:
        failed.length === 0
          ? 'All documents deleted successfully'
          : `${deleted.length} deleted, ${failed.length} failed`,
    };
  }

  // Get documents by status for a project
  async getDocumentsByStatus(
    projectId: string,
    status: 'uploading' | 'processing' | 'completed' | 'failed'
  ): Promise<BatchStatusResponse> {
    return this.getBatchStatus(projectId, status);
  }

  // Check if a document is ready (completed processing)
  async isDocumentReady(documentId: string): Promise<boolean> {
    try {
      const status = await this.getDocumentStatus(documentId);
      return status.success && status.data?.status === 'completed';
    } catch (error) {
      console.error('Error checking document readiness:', error);
      return false;
    }
  }

  // Export document request interface matching backend API schema
  // Export document to PDF or DOCX format
  async exportDocument(request: {
    title?: string;
    content?: string;
    doc_type?: 'RESEARCH' | 'ARTICLE' | 'ASSIGNMENT' | 'EMPTY';
    export_format?: 'PDF' | 'DOCX';
    page_size?: 'A4' | 'LETTER' | 'A3';
    color_scheme?: 'ACADEMIC' | 'PROFESSIONAL' | 'FORMAL' | 'NEUTRAL';
    include_cover?: boolean;
    include_page_numbers?: boolean;
    include_toc?: boolean;
    font_family?: string;
    line_height?: number;
    margins?: number;
    metadata?: Record<string, string>;
    autoDownload?: boolean;
  }): Promise<{ blob: Blob; url: string; filename: string } | void> {
    const requestData = {
      title: request.title || 'Untitled Document',
      content: request.content || '',
      doc_type: request.doc_type || 'EMPTY',
      export_format: request.export_format || 'DOCX',
      page_size: request.page_size || 'A4',
      color_scheme: request.color_scheme || 'ACADEMIC',
      include_cover: request.include_cover ?? true,
      include_page_numbers: request.include_page_numbers ?? true,
      include_toc: request.include_toc ?? false,
      font_family: request.font_family || 'Times New Roman',
      line_height: request.line_height || 1.5,
      margins: request.margins || 20,
      metadata: request.metadata || {},
    };

    // API returns JSON with base64-encoded file_data
    const response = await FetchClient.makeRequest<{
      file_data: string;
      file_name: string;
      format: string;
    }>('api/dms/documents/export', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    if (!response.success || !response.data) {
      console.error('Export API error:', response.message);
      throw new Error(response.message || 'Export failed');
    }

    // Decode base64 file_data
    const { file_data, file_name, format } = response.data;

    // Convert base64 to binary
    const binaryString = atob(file_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Determine MIME type
    const mimeType =
      format === 'PDF'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Create blob and trigger download
    const blob = new Blob([bytes], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const fileName = file_name || `${requestData.title}.${format.toLowerCase()}`;

    if (request.autoDownload === false) {
      return { blob, url, filename: fileName };
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Wait for multiple documents to complete processing
  async waitForDocuments(
    documentIds: string[],
    onProgress?: (completedCount: number, total: number) => void,
    timeoutMs: number = 300000
  ): Promise<{ completed: string[]; failed: string[]; timedOut: string[] }> {
    const completed: string[] = [];
    const failed: string[] = [];
    const timedOut: string[] = [];

    const promises = documentIds.map(async (documentId) => {
      try {
        const result = await this.pollDocumentStatus(
          documentId,
          (status) => {
            if (onProgress) {
              const currentCompleted = completed.length + failed.length + 1;
              onProgress(currentCompleted, documentIds.length);
            }
          },
          2000,
          timeoutMs
        );

        if (result.data?.status === 'completed') {
          completed.push(documentId);
        } else {
          failed.push(documentId);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          timedOut.push(documentId);
        } else {
          failed.push(documentId);
        }
      }
    });

    await Promise.allSettled(promises);

    return { completed, failed, timedOut };
  }
}

const documentService = new DocumentService();
export default documentService;
