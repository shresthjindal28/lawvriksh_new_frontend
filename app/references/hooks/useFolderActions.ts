'use client';

import { useCallback } from 'react';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { useToast } from '@/lib/contexts/ToastContext';
import { Folder } from '@/store/zustand/useReferenceStore';
import { ReferenceTypeEnum } from '@/types/reference-manager-api';
import { useQueryClient } from '@tanstack/react-query';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';

export const useFolderActions = () => {
  const {
    setFoldersByCollection,
    setSelectedFolderId,
    setExpandedFolders,
    setIsLoading,
    setError,
  } = useReferenceContext();
  const { user } = useAuth();
  const userId = user?.user_id;
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Add Folder to Collection
  const addFolderToCollection = useCallback(
    async (collectionId: string, title?: string, type?: ReferenceTypeEnum): Promise<string> => {
      if (!userId) {
        addToast('User not authenticated', 'error');
        return '';
      }

      if (collectionId === 'collections') {
        addToast('Cannot add folder to root', 'error');
        return '';
      }

      try {
        setIsLoading(true);
        const response = await referenceManagerService.createFolder({
          name: title || 'New Folder',
          collection_id: collectionId,
          created_by: userId,
          type: type || 'LEGAL_CASE',
        });

        if (response?.success && response.data) {
          await queryClient.invalidateQueries({ queryKey: referenceKeys.folders(collectionId) });

          const apiFolder = response.data.folder || response.data;
          const newFolder: Folder = {
            id: apiFolder.id,
            title: apiFolder.name,
            icon: apiFolder.icon_id,
          };

          setFoldersByCollection((prev) => ({
            ...prev,
            [collectionId]: [...(prev[collectionId] || []), newFolder],
          }));

          setExpandedFolders((prev) =>
            prev.includes(collectionId) ? prev : [...prev, collectionId]
          );

          addToast('Folder created successfully', 'success');
          return newFolder.id;
        } else {
          throw new Error('Failed to create folder');
        }
      } catch (error) {
        setError('Failed to create folder');
        addToast('Failed to create folder', 'error');
        return '';
      } finally {
        setIsLoading(false);
      }
    },
    [
      userId,
      setFoldersByCollection,
      setExpandedFolders,
      setIsLoading,
      setError,
      addToast,
      queryClient,
    ]
  );

  // Rename Folder
  const renameFolder = useCallback(
    async (collectionId: string, folderId: string, newTitle: string) => {
      if (!userId) {
        addToast('User not authenticated', 'error');
        return;
      }

      try {
        setIsLoading(true);
        const response = await referenceManagerService.updateFolder({
          folder_id: folderId,
          name: newTitle,
        });

        if (response?.success) {
          await queryClient.invalidateQueries({ queryKey: referenceKeys.folders(collectionId) });

          setFoldersByCollection((prev) => ({
            ...prev,
            [collectionId]: (prev[collectionId] || []).map((f) =>
              f.id === folderId ? { ...f, title: newTitle } : f
            ),
          }));
          addToast('Folder renamed successfully', 'success');
        } else {
          throw new Error('Failed to rename folder');
        }
      } catch (error) {
        setError('Failed to rename folder');
        addToast('Failed to rename folder', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [userId, setFoldersByCollection, setIsLoading, setError, addToast, queryClient]
  );

  // Delete Folder
  const deleteFolder = useCallback(
    async (collectionId: string, folderId: string) => {
      if (!userId) {
        addToast('User not authenticated', 'error');
        return;
      }

      try {
        setIsLoading(true);
        const response = await referenceManagerService.deleteFolder(folderId, false);

        if (response?.success) {
          await queryClient.invalidateQueries({ queryKey: referenceKeys.folders(collectionId) });

          setFoldersByCollection((prev) => ({
            ...prev,
            [collectionId]: (prev[collectionId] || []).filter((f) => f.id !== folderId),
          }));
          setSelectedFolderId(null);
          addToast('Folder deleted successfully', 'success');
        } else {
          throw new Error('Failed to delete folder');
        }
      } catch (error) {
        setError('Failed to delete folder');
        addToast('Failed to delete folder', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [
      userId,
      setFoldersByCollection,
      setSelectedFolderId,
      setIsLoading,
      setError,
      addToast,
      queryClient,
    ]
  );

  return {
    addFolderToCollection,
    renameFolder,
    deleteFolder,
  };
};
