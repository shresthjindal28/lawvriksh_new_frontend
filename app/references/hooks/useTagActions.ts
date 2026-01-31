'use client';

import { useCallback } from 'react';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { useToast } from '@/lib/contexts/ToastContext';
import { Tag } from '@/types/reference-manager';
import { useQueryClient } from '@tanstack/react-query';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';

export const useTagActions = () => {
  const { setTags, setIsLoading, setError, references, setReferences, getReferenceById } =
    useReferenceContext();
  const { user } = useAuth();
  const userId = user?.user_id;
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const generateDefaultTagName = () => {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `New Tag ${suffix}`;
  };

  // Create Tag
  const createTag = useCallback(
    async (label?: string, color?: string) => {
      if (!userId) {
        addToast('User not authenticated', 'error');
        return;
      }

      try {
        setIsLoading(true);
        const name = label || generateDefaultTagName();
        const response = await referenceManagerService.createTag({
          name,
          color: color || generateRandomColor(),
          created_by: userId,
        });

        if (response?.success && response.data?.tag) {
          await queryClient.invalidateQueries({ queryKey: referenceKeys.tags(userId) });

          const newTag: Tag = {
            id: response.data.tag.id,
            label: response.data.tag.name,
            color: response.data.tag.color || color || '#000000',
          };

          setTags((prev) => {
            if (prev.some((t) => t.id === newTag.id)) return prev;
            return [...prev, newTag];
          });
          addToast('Tag created successfully', 'success');
          return newTag;
        }
      } catch (error) {
        setError('Failed to create tag');
        addToast('Failed to create tag', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [userId, setTags, setIsLoading, setError, addToast, queryClient]
  );

  // Update Tag
  const updateTag = useCallback(
    async (tagId: string, updates: Partial<Tag>) => {
      if (!userId) return;

      try {
        const response = await referenceManagerService.updateTag({
          tag_id: tagId,
          name: updates.label,
          color: updates.color,
        });

        if (response?.success) {
          await queryClient.invalidateQueries({ queryKey: referenceKeys.tags(userId) });

          setTags((prev) =>
            prev.map((t) =>
              t.id === tagId
                ? { ...t, label: updates.label || t.label, color: updates.color || t.color }
                : t
            )
          );

          setReferences((prev) =>
            prev.map((r) => ({
              ...r,
              tags: r.tags?.map((t) =>
                t.id === tagId
                  ? { ...t, label: updates.label || t.label, color: updates.color || t.color }
                  : t
              ),
            }))
          );
          addToast('Tag updated successfully', 'success');
        }
      } catch (error) {
        addToast('Failed to update tag', 'error');
      }
    },
    [userId, setTags, setReferences, addToast, queryClient]
  );

  // Delete Tag
  const deleteTag = useCallback(
    async (tagId: string) => {
      if (!userId) return;

      try {
        const response = await referenceManagerService.deleteTag(tagId);

        if (response?.success) {
          await queryClient.invalidateQueries({ queryKey: referenceKeys.tags(userId) });
          setTags((prev) => prev.filter((t) => t.id !== tagId));
          setReferences((prev) =>
            prev.map((r) => ({
              ...r,
              tags: r.tags?.filter((t) => t.id !== tagId),
            }))
          );
          addToast('Tag deleted successfully', 'success');
        }
      } catch (error) {
        addToast('Failed to delete tag', 'error');
      }
    },
    [userId, setTags, setReferences, addToast, queryClient]
  );

  // Add Tag to Document
  const addTagToDocument = useCallback(
    async (documentId: string, tagId: string) => {
      if (!userId) return;

      try {
        const ref = getReferenceById(documentId); // O(1) lookup
        const targetId = ref?.documentId || documentId;
        const response = await referenceManagerService.addTagToDocument(targetId, tagId, userId);

        if (response?.success) {
          // Invalidate the specific document's tags query if it exists
          await queryClient.invalidateQueries({ queryKey: referenceKeys.documentTags(targetId) });
          // Also invalidate the documents list because tags are shown there
          if (ref?.folderId) {
            await queryClient.invalidateQueries({
              queryKey: referenceKeys.documents(ref.folderId),
            });
          } else {
            // For unsigned references (no folderId), invalidate the unsigned query
            await queryClient.invalidateQueries({ queryKey: referenceKeys.unsigned() });
          }

          addToast('Tag added to document', 'success');
        }
      } catch (error) {
        addToast('Failed to add tag to document', 'error');
      }
    },
    [userId, addToast, queryClient, getReferenceById]
  );

  // Remove Tag from Document
  const removeTagFromDocument = useCallback(
    async (documentId: string, tagId: string) => {
      if (!userId) return;

      try {
        const ref = getReferenceById(documentId); // O(1) lookup
        const targetId = ref?.documentId || documentId;
        const response = await referenceManagerService.removeTagFromDocument(targetId, tagId);

        if (response?.success) {
          await queryClient.invalidateQueries({ queryKey: referenceKeys.documentTags(targetId) });
          if (ref?.folderId) {
            await queryClient.invalidateQueries({
              queryKey: referenceKeys.documents(ref.folderId),
            });
          } else {
            // For unsigned references (no folderId), invalidate the unsigned query
            await queryClient.invalidateQueries({ queryKey: referenceKeys.unsigned() });
          }
          addToast('Tag removed from document', 'success');
        }
      } catch (error) {
        addToast('Failed to remove tag from document', 'error');
      }
    },
    [userId, addToast, queryClient, getReferenceById]
  );

  // Bulk Add Tags to Documents
  const bulkAddTags = useCallback(
    async (documentIds: string[], tagIds: string[]) => {
      if (!userId) return;

      try {
        // Process all documents in parallel
        const promises = documentIds.map((docId) => {
          const ref = getReferenceById(docId); // O(1) lookup
          const targetId = ref?.documentId || docId;
          return referenceManagerService.bulkAddTagsToDocument({
            document_id: targetId,
            tag_ids: tagIds,
            added_by: userId,
          });
        });

        const responses = await Promise.all(promises);
        const allSuccess = responses.every((r) => r.success);

        if (allSuccess) {
          // Invalidate queries for all affected documents
          const affectedFolderIds = new Set<string>();
          let hasUnsignedRefs = false;

          for (const docId of documentIds) {
            const ref = getReferenceById(docId); // O(1) lookup
            const targetId = ref?.documentId || docId;
            await queryClient.invalidateQueries({ queryKey: referenceKeys.documentTags(targetId) });
            if (ref?.folderId) {
              affectedFolderIds.add(ref.folderId);
            } else {
              hasUnsignedRefs = true;
            }
          }

          // Invalidate affected folders
          for (const folderId of affectedFolderIds) {
            await queryClient.invalidateQueries({ queryKey: referenceKeys.documents(folderId) });
          }

          // Invalidate unsigned references if any were affected
          if (hasUnsignedRefs) {
            await queryClient.invalidateQueries({ queryKey: referenceKeys.unsigned() });
          }

          addToast('Tags added to documents', 'success');
        } else {
          addToast('Some tags failed to add', 'warning');
        }
      } catch (error) {
        addToast('Failed to add tags', 'error');
      }
    },
    [userId, addToast, queryClient, getReferenceById]
  );

  return {
    createTag,
    updateTag,
    deleteTag,
    addTagToDocument,
    removeTagFromDocument,
    bulkAddTags,
  };
};
