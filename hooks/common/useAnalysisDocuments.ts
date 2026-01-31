'use client';

import { useState, useCallback, useEffect } from 'react';
import { analysisDocumentService } from '@/lib/api/analysisDocumentService';
import {
  AnalysisDocument,
  DocumentType,
  AnalysisDocumentRecord,
  ExportDocumentRequest,
} from '@/types/analysisDocument';

interface UseAnalysisDocumentsReturn {
  documents: AnalysisDocument[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  isUploading: boolean;

  uploadDocument: (
    file: File,
    documentType: DocumentType,
    metadata?: Record<string, any>
  ) => Promise<boolean>;
  refreshDocuments: (documentType?: DocumentType) => Promise<void>;
  deleteDocument: (id: string) => Promise<boolean>;
  viewDocument: (id: string) => Promise<string | null>;
  downloadDocument: (id: string) => Promise<string | null>;
  exportDocument: (request: ExportDocumentRequest) => Promise<string | null>;
}

/**
 * Transform API Document to UI AnalysisDocument
 */
function transformDocument(doc: AnalysisDocumentRecord): AnalysisDocument {
  return {
    id: doc.id,
    fileName: doc.file_name,
    fileSize: doc.file_size,
    fileType: doc.file_type,
    documentType: doc.document_type,
    status: doc.status,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    metadata: doc.metadata,
  };
}

export function useAnalysisDocuments(): UseAnalysisDocumentsReturn {
  const [documents, setDocuments] = useState<AnalysisDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Fetch documents (optionally filtered by type)
   */
  const refreshDocuments = useCallback(async (documentType?: DocumentType) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await analysisDocumentService.listDocuments({
        page: 1,
        page_size: 100,
        document_type: documentType,
      });

      // Transform and sort by creation date (newest first)
      const transformedDocs =
        response.documents
          ?.map(transformDocument)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

      setDocuments(transformedDocs);
    } catch (err: any) {
      console.error('[useAnalysisDocuments] Refresh error:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Upload a document
   */
  const uploadDocument = useCallback(
    async (
      file: File,
      documentType: DocumentType,
      metadata?: Record<string, any>
    ): Promise<boolean> => {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      try {
        setUploadProgress(10);

        // 1. Initialize upload with document type
        const initResponse = await analysisDocumentService.initUpload(
          {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
          },
          documentType
        );

        if (!initResponse.upload_url) {
          throw new Error('Failed to initialize upload - no upload URL');
        }

        setUploadProgress(30);

        // 2. Upload to S3
        const s3Success = await analysisDocumentService.uploadToS3(initResponse.upload_url, file);
        if (!s3Success) {
          throw new Error('Failed to upload file to storage');
        }

        setUploadProgress(70);

        // 3. Complete upload
        await analysisDocumentService.completeUpload(
          initResponse.document_id,
          initResponse.s3_key,
          metadata
        );

        setUploadProgress(100);

        // Refresh document list
        await refreshDocuments();

        return true;
      } catch (err: any) {
        console.error('[useAnalysisDocuments] Upload error:', err);
        setError(err.message || 'Failed to upload document');
        return false;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [refreshDocuments]
  );

  /**
   * Delete a document
   */
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    try {
      const success = await analysisDocumentService.deleteDocument(id, true);

      if (success) {
        // Remove from local state
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      }

      return success;
    } catch (err: any) {
      console.error('[useAnalysisDocuments] Delete error:', err);
      setError(err.message || 'Failed to delete document');
      return false;
    }
  }, []);

  /**
   * Get document view URL
   */
  const viewDocument = useCallback(async (id: string): Promise<string | null> => {
    try {
      const result = await analysisDocumentService.viewDocument(id);
      return result?.url || null;
    } catch (err: any) {
      console.error('[useAnalysisDocuments] View error:', err);
      return null;
    }
  }, []);

  /**
   * Get document download URL
   */
  const downloadDocument = useCallback(async (id: string): Promise<string | null> => {
    try {
      const result = await analysisDocumentService.downloadDocument(id);
      return result?.url || null;
    } catch (err: any) {
      console.error('[useAnalysisDocuments] Download error:', err);
      return null;
    }
  }, []);

  /**
   * Export document to PDF/DOCX
   */
  const exportDocument = useCallback(
    async (request: ExportDocumentRequest): Promise<string | null> => {
      try {
        const result = await analysisDocumentService.exportDocument(request);
        return result?.url || null;
      } catch (err: any) {
        console.error('[useAnalysisDocuments] Export error:', err);
        setError(err.message || 'Failed to export document');
        return null;
      }
    },
    []
  );

  // Load documents on mount
  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  return {
    documents,
    isLoading,
    error,
    uploadProgress,
    isUploading,
    uploadDocument,
    refreshDocuments,
    deleteDocument,
    viewDocument,
    downloadDocument,
    exportDocument,
  };
}
