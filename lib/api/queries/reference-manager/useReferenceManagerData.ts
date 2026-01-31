import { useAuth } from '@/lib/contexts/AuthContext';
import { useCollectionsQuery } from './useCollectionsQuery';
import { useFoldersQueries } from './useFoldersQuery';
import { useDocumentsQueries } from './useDocumentsQuery';
import { useTagsQuery } from './useTagsQuery';
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { referenceKeys } from './keys';

export const useReferenceManagerData = () => {
  const { user } = useAuth();
  const userId = user?.user_id;
  const queryClient = useQueryClient();

  const collectionsQuery = useCollectionsQuery(userId);
  const collections = useMemo(
    () =>
      collectionsQuery.data?.map((c) => ({
        id: c.id,
        title: c.name,
        icon: c.icon_id,
      })) ?? [],
    [collectionsQuery.data]
  );

  const {
    foldersByCollection,
    isLoading: foldersLoading,
    isError: foldersError,
  } = useFoldersQueries(collectionsQuery.data);

  // Flatten folders for document queries
  const allFolders = useMemo(() => {
    const result: { folderId: string; collectionId: string }[] = [];
    Object.entries(foldersByCollection).forEach(([collectionId, folders]) => {
      folders.forEach((folder) => {
        result.push({ folderId: folder.id, collectionId });
      });
    });
    return result;
  }, [foldersByCollection]);

  const {
    activeReferences,
    trashedReferences,
    isLoading: documentsLoading,
    isError: documentsError,
  } = useDocumentsQueries(allFolders);

  const tagsQuery = useTagsQuery(userId);

  const isLoading =
    collectionsQuery.isLoading || foldersLoading || documentsLoading || tagsQuery.isLoading;
  const isError = collectionsQuery.isError || foldersError || documentsError || tagsQuery.isError;

  return {
    collections,
    foldersByCollection,
    activeReferences,
    trashedReferences,
    tags: tagsQuery.data ?? [],
    isLoading,
    isError,
    refresh: () => {
      // Invalidate all reference manager queries
      queryClient.invalidateQueries({ queryKey: referenceKeys.all });
    },
  };
};
