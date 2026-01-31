import { useQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';
import type { Note } from '@/types/reference-manager';

export function useNotesQuery(documentId?: string | null, enabled: boolean = true) {
  const normalizedDocumentId = documentId ?? undefined;

  return useQuery({
    queryKey: normalizedDocumentId ? referenceKeys.notes(normalizedDocumentId) : referenceKeys.all,
    enabled: Boolean(normalizedDocumentId) && enabled,
    queryFn: async () => {
      if (!normalizedDocumentId) return [] as Note[];
      const response = await referenceManagerService.listNotes(normalizedDocumentId);
      const notesList = (response as any)?.data?.notes ?? [];
      return (Array.isArray(notesList) ? notesList : []).map((n: any) => ({
        id: n.id,
        content: n.note_text,
        type: 'independent',
        createdBy: n.user_id,
        createdAt: n.created_at,
        modifiedAt: n.updated_at,
      })) as Note[];
    },
    staleTime: 1000 * 30,
  });
}
