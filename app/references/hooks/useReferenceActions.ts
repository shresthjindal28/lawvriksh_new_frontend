'use client';

import { useCallback } from 'react';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { useToast } from '@/lib/contexts/ToastContext';
import { ReferenceItem, ReferenceType } from '@/types/reference-manager';
import { ReferenceTypeToAPI, apiEnumToUIType } from '@/lib/utils/referenceTypeMapper';
import { useQueryClient } from '@tanstack/react-query';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';

export const useReferenceActions = () => {
  const {
    references,
    setReferences,
    trashedReferences,
    setTrashedReferences,
    selectedFolderId,
    selectedCollectionId,
    selectedReferenceId,
    foldersByCollection,
    setIsLoading,
    setError,
    setSelectedReferenceId,
    getReferenceById, // O(1) lookup
  } = useReferenceContext();
  const { user } = useAuth();
  const userId = user?.user_id;
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  // Create Backend Reference
  const createBackendReference = useCallback(
    async (type: ReferenceType, iconId?: string): Promise<string | undefined> => {
      if (!userId) {
        addToast('User not authenticated', 'error');
        return undefined;
      }

      try {
        setIsLoading(true);
        let response;

        if (selectedFolderId) {
          response = await referenceManagerService.createReference({
            ref_type: ReferenceTypeToAPI[type],
            created_by: userId,
            folder_id: selectedFolderId,
            icon_id: iconId,
          } as any);
        } else {
          response = await referenceManagerService.createUnsignedReference({
            ref_type: ReferenceTypeToAPI[type],
            created_by: userId,
            icon_id: iconId,
          } as any);
        }

        if (response?.success && response.data?.reference) {
          if (selectedFolderId) {
            await queryClient.invalidateQueries({
              queryKey: referenceKeys.documents(selectedFolderId),
            });
          }
          return response.data.reference.id;
        }
        return undefined;
      } catch (error) {
        console.error('Error creating reference:', error);
        setError('Failed to create reference');
        addToast('Failed to create reference', 'error');
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, selectedFolderId, setIsLoading, setError, addToast, queryClient]
  );

  // Create Empty Reference (for UI) - optimistic add then hydrate
  const createEmptyReference = useCallback(
    async (type: ReferenceType, refId?: string) => {
      if (!refId) return;

      // Check if reference already exists (may have been added by query invalidation)
      const alreadyExists = references.some((r) => r.id === refId);
      if (alreadyExists) {
        // Reference was already added by React Query refresh, just show toast
        addToast('Reference added to workspace', 'success');
        return;
      }

      // Determine collectionId from current selection or folder mapping
      let collectionId = selectedCollectionId || '';
      if (!collectionId && selectedFolderId && foldersByCollection) {
        for (const [colId, folders] of Object.entries(foldersByCollection)) {
          if (folders.some((f) => f.id === selectedFolderId)) {
            collectionId = colId;
            break;
          }
        }
      }

      // Use "Unsigned" for references without a folder, otherwise use type-based title
      const title = selectedFolderId ? `Untitled ${type}` : 'Unsigned';

      const optimisticRef: ReferenceItem = {
        id: refId,
        collectionId: collectionId,
        folderId: selectedFolderId || undefined,
        type,
        title,
        metadata: {},
        tags: [],
        annotations: [],
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };

      // Use functional update to check again (in case of race condition)
      setReferences((prev) => {
        // Double-check inside the setter to prevent race conditions
        if (prev.some((r) => r.id === refId)) {
          return prev; // Already exists, don't add duplicate
        }
        return [...prev, optimisticRef];
      });
      addToast('Reference added to workspace', 'success');

      try {
        const response = await referenceManagerService.getReference(refId);
        if (response?.success && response.data?.reference) {
          const apiRef = response.data.reference as any;
          setReferences((prev) =>
            prev.map((r) =>
              r.id === refId
                ? {
                    ...r,
                    folderId: apiRef.folder_id || r.folderId,
                    type: apiEnumToUIType(apiRef.ref_type),
                    modifiedAt: apiRef.updated_at,
                  }
                : r
            )
          );
        }
      } catch (error) {}
    },
    [
      references,
      selectedFolderId,
      selectedCollectionId,
      foldersByCollection,
      setReferences,
      addToast,
    ]
  );

  const updateReference = useCallback(
    async (
      id: string,
      updates: Partial<ReferenceItem> & { is_link?: boolean; icon_id?: string },
      suppressToast: boolean = false
    ) => {
      if (!userId) return;

      const needsReferenceApiCall = updates.is_link !== undefined || updates.icon_id !== undefined;
      const needsDocumentApiCall = updates.title !== undefined || updates.metadata !== undefined;

      let folderIdToInvalidate: string | null = null;

      try {
        if (needsReferenceApiCall) {
          setIsLoading(true);

          const response = await referenceManagerService.updateReference(id, {
            is_link: updates.is_link,
            icon_id: updates.icon_id,
          });

          if (!response?.success) {
            throw new Error('Failed to update reference');
          }
        }

        if (needsDocumentApiCall) {
          const currentRef = getReferenceById(id); // O(1) lookup
          const documentId = currentRef?.documentId || id;

          const existingMetadata =
            currentRef && typeof currentRef.metadata === 'object'
              ? (currentRef.metadata as any)
              : {};

          const incomingMetadata =
            updates.metadata && typeof updates.metadata === 'object' ? updates.metadata : {};

          const mergedMetadata = {
            ...existingMetadata,
            ...incomingMetadata,
          };

          await referenceManagerService.updateDocument({
            document_id: documentId,
            title: updates.title ?? currentRef?.title,
            metadata: mergedMetadata,
          });
        }

        setReferences((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;

            folderIdToInvalidate = r.folderId ?? null;

            const existingMetadata = r && typeof r.metadata === 'object' ? (r.metadata as any) : {};
            const incomingMetadata =
              updates.metadata && typeof updates.metadata === 'object' ? updates.metadata : {};

            const mergedMetadata =
              updates.metadata !== undefined
                ? {
                    ...existingMetadata,
                    ...incomingMetadata,
                  }
                : existingMetadata;

            return {
              ...r,
              title: updates.title ?? r.title,
              metadata: mergedMetadata,
              collectionId: updates.collectionId ?? r.collectionId,
              folderId: updates.folderId ?? r.folderId,
              file_url: updates.file_url ?? r.file_url,
              web_url: updates.web_url ?? r.web_url,
              fileName: updates.fileName ?? r.fileName,
              size: updates.size ?? r.size,
              uploadedBy: updates.uploadedBy ?? r.uploadedBy,
              dateUploaded: updates.dateUploaded ?? r.dateUploaded,
              tags: updates.tags ?? r.tags,
              annotations: updates.annotations ?? r.annotations,
              independentNotes: updates.independentNotes ?? r.independentNotes,
              modifiedAt: new Date().toISOString(),
            };
          })
        );

        if (needsReferenceApiCall) {
          if (folderIdToInvalidate) {
            await queryClient.invalidateQueries({
              queryKey: referenceKeys.documents(folderIdToInvalidate),
            });
          } else {
            // For unsigned references (no folderId), invalidate the unsigned query
            await queryClient.invalidateQueries({ queryKey: referenceKeys.unsigned() });
          }
        }

        if (needsReferenceApiCall && !suppressToast) {
          addToast('Reference updated successfully', 'success');
        }
      } catch (error) {
        setError('Failed to update reference');
        if (!suppressToast) {
          addToast('Failed to update reference', 'error');
        }
      } finally {
        if (needsReferenceApiCall) {
          setIsLoading(false);
        }
      }
    },
    [userId, setReferences, setIsLoading, setError, addToast, queryClient, getReferenceById]
  );

  const deleteReference = useCallback(
    async (id: string) => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const response = await referenceManagerService.deleteReference(id, false);

        if (response?.success) {
          const deletedRef = getReferenceById(id); // O(1) lookup
          if (deletedRef?.folderId) {
            queryClient.setQueryData(referenceKeys.documents(deletedRef.folderId), (old: any) => {
              if (!old) return old;
              const refs = Array.isArray(old.references) ? old.references : null;
              if (!refs) return old;
              const nextRefs = refs.filter((item: any) => {
                const ref = item?.reference ?? item;
                return ref?.id !== id;
              });
              return { ...old, references: nextRefs };
            });
            await queryClient.invalidateQueries({
              queryKey: referenceKeys.documents(deletedRef.folderId),
            });
          } else {
            // For unsigned references (no folderId), invalidate the unsigned query
            await queryClient.invalidateQueries({ queryKey: referenceKeys.unsigned() });
          }

          if (deletedRef) {
            setReferences((prev) => prev.filter((r) => r.id !== id));
            setTrashedReferences((prev) => [...prev, deletedRef]);
          }
          if (selectedReferenceId === id) {
            setSelectedReferenceId(null);
          }
          addToast('Reference moved to trash', 'success');
        } else {
          throw new Error('Failed to delete reference');
        }
      } catch (error) {
        setError('Failed to delete reference');
        addToast('Failed to delete reference', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [
      userId,
      setReferences,
      setTrashedReferences,
      selectedReferenceId,
      setIsLoading,
      setError,
      addToast,
      queryClient,
      setSelectedReferenceId,
      getReferenceById,
    ]
  );

  const restoreReference = useCallback(
    async (id: string) => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const response = await referenceManagerService.restoreReference(id);

        if (response?.success) {
          const restoredRef = trashedReferences.find((r) => r.id === id);
          if (restoredRef?.folderId) {
            await queryClient.invalidateQueries({
              queryKey: referenceKeys.documents(restoredRef.folderId),
            });
          } else {
            // For unsigned references (no folderId), invalidate the unsigned query
            await queryClient.invalidateQueries({ queryKey: referenceKeys.unsigned() });
          }

          if (restoredRef) {
            setTrashedReferences((prev) => prev.filter((r) => r.id !== id));
            setReferences((prev) => [...prev, restoredRef]);
          }
          addToast('Reference restored successfully', 'success');
        } else {
          throw new Error('Failed to restore reference');
        }
      } catch (error) {
        setError('Failed to restore reference');
        addToast('Failed to restore reference', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [
      userId,
      trashedReferences,
      setReferences,
      setTrashedReferences,
      setIsLoading,
      setError,
      addToast,
      queryClient,
    ]
  );

  const hardDeleteReference = useCallback(
    async (id: string) => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const response = await referenceManagerService.deleteReference(id, true);

        if (response?.success) {
          // Hard delete usually happens from trash, so we might not need to invalidate documents folder
          // but if we do support hard delete from active list directly, we should.
          // Assuming trash:
          setTrashedReferences((prev) => prev.filter((r) => r.id !== id));
          addToast('Reference permanently deleted', 'success');
        } else {
          throw new Error('Failed to permanently delete reference');
        }
      } catch (error) {
        setError('Failed to permanently delete reference');
        addToast('Failed to permanently delete reference', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [userId, setTrashedReferences, setIsLoading, setError, addToast]
  );

  /**
   * List all reference documents for the current user
   * This fetches actual documents from the Reference Manager
   */
  const listRefDocuments = useCallback(async () => {
    if (!userId) {
      return [];
    }

    try {
      const response = await referenceManagerService.listDocuments(userId, {
        includeDeleted: false,
        pagination: { skip: 0, limit: 100 },
      });

      if (response?.success && response.data) {
        const documents = response.data.documents || [];
        return documents;
      }
      return [];
    } catch (error) {
      return [];
    }
  }, [userId]);

  return {
    createBackendReference,
    createEmptyReference,
    deleteReference,
    restoreReference,
    hardDeleteReference,
    updateReference,
    listRefDocuments,
  };
};
