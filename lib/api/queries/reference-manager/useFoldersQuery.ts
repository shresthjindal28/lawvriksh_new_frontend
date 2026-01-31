import { useQueries } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';
import { RefCollection } from '@/types/reference-manager-api';
import { Folder } from '@/store/zustand/useReferenceStore';

export const useFoldersQueries = (collections: RefCollection[] | undefined) => {
  return useQueries({
    queries: (collections ?? []).map((collection) => ({
      queryKey: referenceKeys.folders(collection.id),
      queryFn: async () => {
        const response = await referenceManagerService.listFolders(collection.id);
        if (!response.success || !response.data) {
          throw new Error(`Failed to fetch folders for collection ${collection.id}`);
        }
        return {
          collectionId: collection.id,
          folders: response.data.folders ?? [],
        };
      },
    })),
    combine: (results) => {
      const foldersByCollection: Record<string, Folder[]> = {};
      let isLoading = false;
      let isError = false;

      results.forEach((result) => {
        if (result.isLoading) isLoading = true;
        if (result.isError) isError = true;
        if (result.data) {
          foldersByCollection[result.data.collectionId] = result.data.folders.map((f) => ({
            id: f.id,
            title: f.name,
            icon: f.icon_id,
          }));
        }
      });

      return { foldersByCollection, isLoading, isError };
    },
  });
};
