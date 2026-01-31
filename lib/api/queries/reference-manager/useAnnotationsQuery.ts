import { useQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';

export function useAnnotationsQuery(
  documentId?: string | null,
  includePositions: boolean = false,
  enabled: boolean = true
) {
  const normalizedDocumentId = documentId ?? undefined;

  return useQuery({
    queryKey: normalizedDocumentId
      ? referenceKeys.annotations(normalizedDocumentId, includePositions)
      : referenceKeys.all,
    enabled: Boolean(normalizedDocumentId) && enabled,
    queryFn: async () => {
      if (!normalizedDocumentId) return [] as any[];
      const response = await referenceManagerService.listAnnotations(normalizedDocumentId, {
        includePositions,
      });
      return ((response as any)?.data?.annotations ?? []) as any[];
    },
    staleTime: 1000 * 30,
  });
}
