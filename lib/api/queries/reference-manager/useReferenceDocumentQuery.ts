import { useQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { convertDocumentToUI } from '@/app/references/utils/referenceUtils';
import { referenceKeys } from './keys';

export const useReferenceDocumentQuery = (documentId: string | null | undefined) => {
  return useQuery({
    queryKey: documentId ? referenceKeys.document(documentId) : ['reference-document', 'null'],
    queryFn: async () => {
      if (!documentId) return null;
      const response = await referenceManagerService.getDocument(documentId);
      if (response.success && response.data?.document) {
        return convertDocumentToUI(response.data.document);
      }
      return null;
    },
    enabled: !!documentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
