import { useQueries } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';
import { ReferenceItem } from '@/types/reference-manager';
import { buildReferenceListsFromFolderData } from '@/lib/utils/referenceInitialization';

export const useDocumentsQueries = (folders: { collectionId: string; folderId: string }[]) => {
  const folderQueries = folders.map(({ folderId, collectionId }) => ({
    queryKey: referenceKeys.documents(folderId),
    queryFn: async () => {
      const response = await referenceManagerService.getFolderDocuments(folderId, true);
      if (!response.success || !response.data) {
        throw new Error(`Failed to fetch documents for folder ${folderId}`);
      }
      return {
        collectionId,
        folderId,
        data: response.data,
      };
    },
  }));

  const unsignedQuery = {
    queryKey: referenceKeys.unsigned(),
    queryFn: async () => {
      const response = await referenceManagerService.getUnsignedReferences();
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch unsigned references');
      }
      return {
        collectionId: '',
        folderId: undefined,
        data: response.data,
      };
    },
  };

  return useQueries({
    queries: [...folderQueries, unsignedQuery],
    combine: (results) => {
      const activeMap = new Map<string, ReferenceItem>();
      const trashedMap = new Map<string, ReferenceItem>();
      let isLoading = false;
      let isError = false;

      results.forEach((result) => {
        if (result.isLoading) isLoading = true;
        if (result.isError) isError = true;

        if (result.data) {
          const { data, collectionId, folderId } = result.data;
          const refsData = (data as any).references || [];

          const { active, trashed } = buildReferenceListsFromFolderData({
            refsData,
            fallbackFolderId: folderId as string,
            collectionId,
          });

          active.forEach((r) => activeMap.set(r.id, r));
          trashed.forEach((r) => trashedMap.set(r.id, r));
        }
      });

      return {
        activeReferences: Array.from(activeMap.values()),
        trashedReferences: Array.from(trashedMap.values()),
        isLoading,
        isError,
      };
    },
  });
};
