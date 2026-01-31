import { useState, useEffect, useCallback } from 'react';
import { Document, DocumentQueryParams, DocumentsData } from '@/types/library';
import { libraryDocumentService } from '@/lib/api/libraryDocumentService';
import {
  DocumentSchema,
  DocumentsDataSchema,
  DownloadDocumentResponseSchema,
  UploadDocumentResponseSchema,
  UploadMultipleDocumentsResponseSchema,
  ViewDocumentResponseSchema,
} from '@/lib/validators/library-documents/response';

interface UseDocumentsOptions {
  autoFetch?: boolean;
  initialParams?: DocumentQueryParams;
}

interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    page_size: number;
    total: number;
  } | null;
  fetchDocuments: (params?: DocumentQueryParams) => Promise<void>;
  uploadDocument: (file: File, metadata?: Record<string, any>) => Promise<Document | null>;
  uploadMultipleDocuments: (
    files: File[],
    metadata?: Record<string, any>
  ) => Promise<Document[] | null>;
  deleteDocument: (id: string, deleteFromS3?: boolean) => Promise<boolean>;
  getViewUrl: (id: string) => Promise<string | null>;
  getDownloadUrl: (id: string) => Promise<string | null>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useLibraryDocuments(options: UseDocumentsOptions = {}): UseDocumentsReturn {
  const { autoFetch = true, initialParams } = options;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    page_size: number;
    total: number;
  } | null>(null);
  const [queryParams, setQueryParams] = useState<DocumentQueryParams | undefined>(initialParams);

  const fetchDocuments = useCallback(
    async (params?: DocumentQueryParams) => {
      setLoading(true);
      setError(null);

      const paramsToUse = params || queryParams;

      try {
        const response = await libraryDocumentService.getDocuments(paramsToUse);

        if (response.success && response.data) {
          // Validate response data with Zod
          const validationResult = DocumentsDataSchema.safeParse(response.data);

          if (!validationResult.success) {
            setError('Invalid data format received from server');
            return;
          }

          const { documents, page, page_size, total } = validationResult.data;

          setDocuments(documents);
          setPagination({ page, page_size, total });
          setQueryParams(paramsToUse);
        } else {
          const errorMessage = response?.message || 'Failed to fetch documents';
          setError(errorMessage);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [queryParams]
  );

  const uploadDocument = useCallback(
    async (
      file: File,
      metadata?: Record<string, any>,
      onProgress?: (progress: number, status: string) => void
    ): Promise<Document | null> => {
      setError(null);

      try {
        const response = await libraryDocumentService.uploadDocument(file, metadata, onProgress);

        if (response.success && response.data) {
          // Validate the full response structure
          const validationResult = UploadDocumentResponseSchema.safeParse(response.data);

          if (!validationResult.success) {
            setError('Invalid document format received from server');
            return null;
          }

          // Extract the document from the validated response
          const validatedDocument = validationResult.data.document;

          // Add the new document to the beginning of the list
          setDocuments((prev) => [validatedDocument, ...prev]);

          // Update pagination if exists
          if (pagination) {
            setPagination((prev) =>
              prev
                ? {
                    ...prev,
                    total: prev.total + 1,
                  }
                : null
            );
          }

          return validatedDocument;
        } else {
          const errorMessage = response?.message || 'Failed to upload document';
          setError(errorMessage);
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
        setError(errorMessage);
        return null;
      }
    },
    [pagination]
  );

  const uploadMultipleDocuments = useCallback(
    async (files: File[], metadata?: Record<string, any>): Promise<Document[] | null> => {
      setError(null);

      try {
        const response = await libraryDocumentService.uploadMultipleDocuments(files, metadata);

        if (response.success && response.data) {
          // Validate the full response structure
          const validationResult = UploadMultipleDocumentsResponseSchema.safeParse(response.data);

          if (!validationResult.success) {
            console.error('Validation error:', validationResult.error);
            setError('Invalid document format received from server');
            return null;
          }

          const validatedDocuments = validationResult.data.documents;

          // Add the new documents to the beginning of the list
          setDocuments((prev) => [...validatedDocuments, ...prev]);

          // Update pagination if exists
          if (pagination) {
            setPagination((prev) =>
              prev
                ? {
                    ...prev,
                    total: prev.total + validatedDocuments.length,
                  }
                : null
            );
          }

          return validatedDocuments;
        } else {
          const errorMessage = response?.message || 'Failed to upload documents';
          setError(errorMessage);
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to upload documents';
        setError(errorMessage);
        return null;
      }
    },
    [pagination]
  );

  const deleteDocument = useCallback(
    async (id: string, deleteFromS3: boolean = true): Promise<boolean> => {
      setError(null);

      try {
        const response = await libraryDocumentService.deleteDocument(id, deleteFromS3);

        if (response.success) {
          // Remove document from list
          setDocuments((prev) => prev.filter((doc) => doc.id !== id));

          // Update pagination if exists
          if (pagination) {
            setPagination((prev) =>
              prev
                ? {
                    ...prev,
                    total: prev.total - 1,
                  }
                : null
            );
          }

          return true;
        } else {
          const errorMessage = response?.message || 'Failed to delete document';
          setError(errorMessage);
          return false;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete document';
        setError(errorMessage);
        return false;
      }
    },
    [pagination]
  );

  const getViewUrl = useCallback(async (id: string): Promise<string | null> => {
    setError(null);

    try {
      const response = await libraryDocumentService.getViewUrl(id);

      if (response.success && response.data) {
        // Validate view response with Zod
        const validationResult = ViewDocumentResponseSchema.safeParse(response.data);

        if (!validationResult.success) {
          setError('Invalid view URL format received from server');
          return null;
        }

        return validationResult.data.presigned_url;
      } else {
        const errorMessage = response?.message || 'Failed to get view URL';
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get view URL';
      setError(errorMessage);
      return null;
    }
  }, []);

  const getDownloadUrl = useCallback(async (id: string): Promise<string | null> => {
    setError(null);

    try {
      const response = await libraryDocumentService.getDownloadUrl(id);

      if (response.success && response.data) {
        // Validate download response with Zod
        const validationResult = DownloadDocumentResponseSchema.safeParse(response.data);

        if (!validationResult.success) {
          setError('Invalid download URL format received from server');
          return null;
        }

        return validationResult.data.url;
      } else {
        const errorMessage = response?.message || 'Failed to get download URL';
        setError(errorMessage);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get download URL';
      setError(errorMessage);
      return null;
    }
  }, []);

  const refetch = useCallback(() => {
    return fetchDocuments(queryParams);
  }, [fetchDocuments, queryParams]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]);

  return {
    documents,
    loading,
    error,
    pagination,
    fetchDocuments,
    uploadDocument,
    uploadMultipleDocuments,
    deleteDocument,
    getViewUrl,
    getDownloadUrl,
    refetch,
    clearError,
  };
}
