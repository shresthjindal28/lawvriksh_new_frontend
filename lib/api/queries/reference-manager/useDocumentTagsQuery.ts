import { useQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';

export type UiTag = {
  id: string;
  label: string;
  color?: string;
};

export function useDocumentTagsQuery(documentId?: string | null, enabled: boolean = true) {
  const normalizedDocumentId = documentId ?? undefined;

  return useQuery({
    queryKey: normalizedDocumentId
      ? referenceKeys.documentTags(normalizedDocumentId)
      : referenceKeys.all,
    enabled: Boolean(normalizedDocumentId) && enabled,
    queryFn: async () => {
      if (!normalizedDocumentId) return [] as UiTag[];
      const response = await referenceManagerService.listDocumentTags(normalizedDocumentId);
      const tags = (response as any)?.data?.tags ?? [];
      return (Array.isArray(tags) ? tags : []).map((apiTag: any) => ({
        id: apiTag.id,
        label: apiTag.name || apiTag.label || apiTag.title || '',
        color: apiTag.color || '#eee',
      })) as UiTag[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
