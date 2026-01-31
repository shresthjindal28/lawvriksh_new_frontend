import { useQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';

export function useReferenceDocumentIdQuery(
  referenceId?: string | null,
  documentId?: string | null
) {
  const normalizedReferenceId = referenceId ?? undefined;
  const hasProvidedDocumentId = Boolean(documentId);

  return useQuery({
    queryKey: normalizedReferenceId
      ? referenceKeys.referenceWithDocuments(normalizedReferenceId)
      : referenceKeys.all,
    enabled: Boolean(normalizedReferenceId) && !hasProvidedDocumentId,
    queryFn: async () => {
      if (!normalizedReferenceId) return null;
      const response =
        await referenceManagerService.getReferenceWithDocuments(normalizedReferenceId);
      const candidate = (response as any)?.data?.documents?.[0]?.id;
      return typeof candidate === 'string' && candidate.length > 0 ? candidate : null;
    },
    staleTime: 1000 * 60 * 5,
  });
}
