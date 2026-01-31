import { useState, useCallback } from 'react';
import { DocumentStatusData } from '@/lib/validators/document/document.schemas';
import documentService from '@/lib/api/documentService';

// Additional hook for managing document status polling
export function useDocumentStatus(documentId: string | null, pollInterval: number = 3000) {
  const [status, setStatus] = useState<DocumentStatusData | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPolling = useCallback(async () => {
    if (!documentId) return;

    setIsPolling(true);
    setError(null);

    const poll = async () => {
      try {
        const response = await documentService.getDocumentStatus(documentId);

        if (response.success && response.data) {
          setStatus(response.data);

          // Stop polling if processing is complete
          if (
            response.data.status === 'completed' ||
            response.data.status === 'failed' ||
            response.data.status === 'cancelled'
          ) {
            setIsPolling(false);
            return;
          }
        } else {
          setError(response.error?.message || 'Failed to fetch status');
          setIsPolling(false);
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsPolling(false);
        return;
      }

      // Continue polling
      if (isPolling) {
        setTimeout(poll, pollInterval);
      }
    };

    poll();
  }, [documentId, pollInterval, isPolling]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    status,
    isPolling,
    error,
    startPolling,
    stopPolling,
  };
}
