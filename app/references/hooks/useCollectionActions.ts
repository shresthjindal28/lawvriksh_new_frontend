'use client';

import { useCallback } from 'react';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { useToast } from '@/lib/contexts/ToastContext';
import { Collection } from '@/store/zustand/useReferenceStore';
import { useQueryClient } from '@tanstack/react-query';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';

export const useCollectionActions = () => {
  const {
    setCollections,
    setExpandedFolders,
    setSelectedCollectionId,
    setSelectedFolderId,
    setIsLoading,
    setError,
  } = useReferenceContext();
  const { user } = useAuth();
  const userId = user?.user_id;
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Add Collection
  const addCollection = useCallback(async () => {
    if (!userId) {
      addToast('User not authenticated', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const response = await referenceManagerService.createCollection({
        name: 'New Collection',
        owner_id: userId,
      });

      if (response?.success && response.data) {
        await queryClient.invalidateQueries({ queryKey: referenceKeys.collections(userId) });

        const apiCollection = response.data.collection || response.data;
        const newCollection: Collection = {
          id: apiCollection.id,
          title: apiCollection.name,
          icon: apiCollection.icon_id,
        };

        setCollections((prev) => {
          const idx = prev.findIndex((c) => c.id === 'collections');
          if (idx === -1) return [...prev, newCollection];
          const copy = [...prev];
          copy.splice(idx + 1, 0, newCollection);
          return copy;
        });

        setExpandedFolders((prev) =>
          prev.includes('collections') ? prev : [...prev, 'collections']
        );
        setSelectedCollectionId(newCollection.id);
        setSelectedFolderId(null);

        addToast('Collection created successfully', 'success');
        return newCollection.id;
      } else {
        throw new Error('Failed to create collection');
      }
    } catch (error) {
      setError('Failed to create collection');
      addToast('Failed to create collection', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [
    userId,
    setCollections,
    setExpandedFolders,
    setSelectedCollectionId,
    setSelectedFolderId,
    setIsLoading,
    setError,
    addToast,
    queryClient,
  ]);

  // Rename Collection
  const renameCollection = useCallback(
    async (id: string, newTitle: string) => {
      if (!userId) {
        addToast('User not authenticated', 'error');
        return;
      }

      if (id === 'collections') return;

      try {
        setIsLoading(true);
        const response = await referenceManagerService.updateCollection({
          collection_id: id,
          owner_id: userId,
          name: newTitle,
        });

        if (response?.success) {
          await queryClient.invalidateQueries({ queryKey: referenceKeys.collections(userId) });
          setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
          addToast('Collection renamed successfully', 'success');
        } else {
          throw new Error('Failed to rename collection');
        }
      } catch (error) {
        setError('Failed to rename collection');
        addToast('Failed to rename collection', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [userId, setCollections, setIsLoading, setError, addToast, queryClient]
  );

  // Delete Collection
  const deleteCollection = useCallback(
    async (id: string) => {
      if (!userId) {
        addToast('User not authenticated', 'error');
        return;
      }

      if (id === 'collections') return;

      try {
        setIsLoading(true);
        const response = await referenceManagerService.deleteCollection(id, userId, false);

        if (response?.success) {
          await queryClient.invalidateQueries({ queryKey: referenceKeys.collections(userId) });
          setCollections((prev) => prev.filter((c) => c.id !== id));
          setSelectedCollectionId(null);
          setSelectedFolderId(null);
          addToast('Collection deleted successfully', 'success');
        } else {
          throw new Error('Failed to delete collection');
        }
      } catch (error) {
        setError('Failed to delete collection');
        addToast('Failed to delete collection', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [
      userId,
      setCollections,
      setSelectedCollectionId,
      setSelectedFolderId,
      setIsLoading,
      setError,
      addToast,
      queryClient,
    ]
  );

  return {
    addCollection,
    renameCollection,
    deleteCollection,
  };
};
