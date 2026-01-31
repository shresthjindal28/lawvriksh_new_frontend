'use client';

import React, { useState, useRef, useEffect } from 'react';

// Components
import CreateReferenceDialog from '../dialogs/CreateReferenceDialog';
import FolderSelectionMenu from '../dialogs/FolderSelectionMenu';
import Header from './ReferenceHeader';
import Sidebar from './ReferenceSidebar';
import ReferenceTable, { UploadMenu } from '../content/ReferenceTable';
import InfoPanel from './InfoPanel';
import UnifiedUploadDialog from '../dialogs/UnifiedUploadDialog';
import AddTagMenu from '../tags/AddTag';

// Hooks
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';
import { useReferenceInitialization } from '@/app/references/hooks/useReferenceInitialization';
import { useReferenceNavigation } from '@/app/references/hooks/useReferenceNavigation';
import { useReferenceFiltering } from '@/app/references/hooks/useReferenceFiltering';
import { useCollectionActions } from '@/app/references/hooks/useCollectionActions';
import { useFolderActions } from '@/app/references/hooks/useFolderActions';
import { useReferenceActions } from '@/app/references/hooks/useReferenceActions';
import { useTagActions } from '@/app/references/hooks/useTagActions';
import { useDocumentActions } from '@/app/references/hooks/useDocumentActions';
import { useToast } from '@/lib/contexts/ToastContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { Tag } from '@/types/reference-manager';
import TimelineSidebar from '../viewer/TimelineSidebar';
import { useQueryClient } from '@tanstack/react-query';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';

export default function ReferenceManager() {
  const { refresh } = useReferenceInitialization();
  const { user } = useAuth();
  const userId = user?.user_id;
  const queryClient = useQueryClient();

  const {
    collections,
    foldersByCollection,
    references,
    trashedReferences,
    tags,
    expandedFolders,
    selectedCollectionId,
    selectedFolderId,
    selectedReferenceId,
    isLoading,
    isRenaming,
    setIsRenaming,
    setReferences,
    setTags,
    searchQuery,
    setSearchQuery,
    setFilterTag,
    filterTag,
    setIsTrashOpen,
    isTrashOpen,
    error,
    setError,
    setSelectedCollectionId,
    setSelectedFolderId,
    setSelectedReferenceId,
    setIsLoading,
  } = useReferenceContext();

  const { toggleFolder, selectCollection, selectFolder, selectReference } =
    useReferenceNavigation();
  const { filteredReferences } = useReferenceFiltering();

  const { addCollection, renameCollection, deleteCollection } = useCollectionActions();

  const { addFolderToCollection, renameFolder, deleteFolder } = useFolderActions();

  const {
    createBackendReference,
    createEmptyReference,
    deleteReference,
    restoreReference,
    hardDeleteReference,
    updateReference,
  } = useReferenceActions();

  const { createTag, updateTag, deleteTag } = useTagActions();

  const {
    uploadFile,
    uploadUrls,
    attachFileToReference,
    attachUrlToReference,
    unlinkFileFromReference,
    updateAnnotation,
    addIndependentNote,
    editNote,
    deleteNote,
    uploadProgress,
    uploadStatus,
    uploadImageFile,
  } = useDocumentActions();

  // 4. Local UI State
  const [showDialog, setShowDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url' | 'image'>('file');
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showAddTagMenu, setShowAddTagMenu] = useState(false);
  const [showMobileScreen, setShowMobileScreen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [folderMenuSource, setFolderMenuSource] = useState<'create' | 'upload'>('create');

  const createBtnRef = useRef<HTMLButtonElement>(null);
  const uploadBtnRef = useRef<HTMLButtonElement>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);

  const { addToast } = useToast();
  const selectedReference = references.find((r) => r.id === selectedReferenceId) || null;

  // 5. Effects
  useEffect(() => {
    if (error) {
      addToast(error, 'error');
      setError(null);
    }
  }, [error, addToast, setError]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setShowMobileScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const c = window.localStorage.getItem('ref_selectedCollectionId');
    const f = window.localStorage.getItem('ref_selectedFolderId');
    const r = window.localStorage.getItem('ref_selectedReferenceId');
    if (c) setSelectedCollectionId(c);
    if (f) setSelectedFolderId(f);
    if (r) setSelectedReferenceId(r);
  }, [setSelectedCollectionId, setSelectedFolderId, setSelectedReferenceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (selectedCollectionId) {
      window.localStorage.setItem('ref_selectedCollectionId', selectedCollectionId);
    } else {
      window.localStorage.removeItem('ref_selectedCollectionId');
    }
    if (selectedFolderId) {
      window.localStorage.setItem('ref_selectedFolderId', selectedFolderId);
    } else {
      window.localStorage.removeItem('ref_selectedFolderId');
    }
    if (selectedReferenceId) {
      window.localStorage.setItem('ref_selectedReferenceId', selectedReferenceId);
    } else {
      window.localStorage.removeItem('ref_selectedReferenceId');
    }
  }, [selectedCollectionId, selectedFolderId, selectedReferenceId]);

  useEffect(() => {
    if (uploadProgress === 100) {
      const timer = setTimeout(() => {
        setShowUploadDialog(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress]);

  // 6. Handlers
  const handleDownloadReference = (referenceId: string) => {
    const ref = references.find((r) => r.id === referenceId);
    if (!ref) return;

    const fileUrl = ref.file_url || (ref.metadata as any)?.real_file_url;

    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = ref.title || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (ref.web_url) {
      window.open(ref.web_url, '_blank');
    }
  };

  const handleUpload = () => {
    if (!selectedCollectionId || !selectedFolderId) {
      setFolderMenuSource('upload');
      setShowFolderMenu((prev) => !prev);
      return;
    }
    setShowMenu((prev) => !prev);
  };

  const handleCreate = () => {
    setFolderMenuSource('create');
    setShowMenu(false);
    setShowDialog(false);
    setShowFolderMenu(true);
  };

  const handleMode = (e: React.MouseEvent, mode: 'file' | 'url' | 'image') => {
    setUploadMode(mode);
    setShowUploadDialog(true);
  };

  const handleUpdateTags = async (tagsInput: Tag | Tag[]) => {
    console.log('ReferenceManager: handleUpdateTags called with:', tagsInput);
    if (!tagsInput || !selectedReferenceId) {
      console.log('ReferenceManager: Missing tagsInput or selectedReferenceId', {
        tagsInput,
        selectedReferenceId,
      });
      return;
    }

    const targetDocumentId = selectedReference?.documentId || selectedReferenceId;

    const tagsList = Array.isArray(tagsInput) ? tagsInput : [tagsInput];
    if (tagsList.length === 0) return;

    // Filter out duplicates (tags already on the doc)
    const newTags = tagsList.filter(
      (tag) => !selectedReference?.tags?.some((t) => t.id === tag.id)
    );

    console.log('ReferenceManager: New tags to add:', newTags);

    if (newTags.length === 0) {
      addToast('Selected tag(s) already added to this document', 'info');
      return;
    }

    try {
      // If single tag, use the single endpoint
      if (newTags.length === 1) {
        console.log('ReferenceManager: Using single tag endpoint');
        await referenceManagerService.addTagToDocument(
          targetDocumentId,
          newTags[0].id,
          userId || ''
        );
      } else if (newTags.length > 1) {
        // If multiple tags, use the bulk endpoint
        console.log('ReferenceManager: Using bulk tags endpoint');
        await referenceManagerService.bulkAddTagsToDocument({
          document_id: targetDocumentId,
          tag_ids: newTags.map((t) => t.id),
          added_by: userId || '',
        });
      }

      // Update local state directly
      setReferences((prev) =>
        prev.map((r) =>
          r.id === selectedReferenceId ? { ...r, tags: [...(r.tags || []), ...newTags] } : r
        )
      );
      await queryClient.invalidateQueries({
        queryKey: referenceKeys.documentTags(targetDocumentId),
      });
      if (selectedReference?.folderId) {
        await queryClient.invalidateQueries({
          queryKey: referenceKeys.documents(selectedReference.folderId),
        });
      }
      addToast('Tags added successfully', 'success');
    } catch (err: any) {
      console.error('ReferenceManager: Error adding tags:', err);
      if (
        err?.error?.code === 'FAILED_PRECONDITION' ||
        err?.message?.includes('already be associated')
      ) {
        addToast('Tag is already added to this document', 'info');
        // If it's already there, we can optimistically update the UI to show it
        setReferences((prev) =>
          prev.map((r) =>
            r.id === selectedReferenceId
              ? {
                  ...r,
                  tags: [
                    ...(r.tags || []),
                    ...newTags.filter((nt) => !r.tags?.some((et) => et.id === nt.id)),
                  ],
                }
              : r
          )
        );
        await queryClient.invalidateQueries({
          queryKey: referenceKeys.documentTags(targetDocumentId),
        });
        if (selectedReference?.folderId) {
          await queryClient.invalidateQueries({
            queryKey: referenceKeys.documents(selectedReference.folderId),
          });
        }
      } else {
        addToast('Failed to add tags', 'error');
      }
    }
  };

  const handleMoveReferences = async (
    referenceIds: string[],
    targetCollectionId: string,
    targetFolderId?: string
  ) => {
    if (!referenceIds.length) return;
    if (!userId) {
      addToast('User not authenticated', 'error');
      return;
    }

    for (const refId of referenceIds) {
      const ref = references.find((r) => r.id === refId);
      const sourceFolderId = ref?.folderId || selectedFolderId || '';

      // Check if it's an unsigned reference being moved to a folder
      // Unsigned references have no folderId. We use the specific endpoint for them.
      const isUnsignedMove = !sourceFolderId && targetFolderId;

      try {
        if (isUnsignedMove) {
          await referenceManagerService.moveUnsignedReferenceToFolder(refId, {
            ref_id: refId,
            target_folder_id: targetFolderId,
          });
        } else {
          await referenceManagerService.moveReference(refId, {
            ref_id: refId,
            user_id: userId,
            source_folder_id: sourceFolderId,
            target_collection_id: targetCollectionId,
            target_folder_id: targetFolderId,
          });
        }

        // Optimistically update the reference's folderId in local state
        // so the UI (including InfoPanel) reflects the move immediately.
        setReferences((prev) =>
          prev.map((r) => (r.id === refId ? { ...r, folderId: targetFolderId } : r))
        );
      } catch (err) {
        addToast('Failed to move one or more references.', 'error');
      }
    }
    await refresh();
    addToast('References moved successfully', 'success');
  };

  const handleCopyReferences = async (
    referenceIds: string[],
    targetCollectionId: string,
    targetFolderId?: string
  ) => {
    if (!referenceIds.length) return;
    if (!userId) {
      addToast('User not authenticated', 'error');
      return;
    }

    for (const refId of referenceIds) {
      const sourceFolderId =
        references.find((r) => r.id === refId)?.folderId || selectedFolderId || '';

      try {
        await referenceManagerService.copyReference(refId, {
          ref_id: refId,
          user_id: userId,
          source_folder_id: sourceFolderId,
          target_collection_id: targetCollectionId,
          target_folder_id: targetFolderId,
        });
      } catch (err) {
        addToast('Failed to copy one or more references.', 'error');
      }
    }

    await refresh();
    addToast('References copied successfully', 'success');
  };

  return (
    <div className="referenceManagerContainer">
      <Header
        onUpload={handleUpload}
        onCreateClick={handleCreate}
        createBtnRef={createBtnRef}
        uploadBtnRef={uploadBtnRef}
        onSearchChange={setSearchQuery}
        searchValue={searchQuery}
        onTimelineClick={() => setIsTimelineOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        isMobile={showMobileScreen}
        isCreateMenuOpen={showFolderMenu && folderMenuSource === 'create'}
      />

      {showMenu && <UploadMenu onClick={handleMode} btnRef={uploadBtnRef} />}

      <FolderSelectionMenu
        isOpen={showFolderMenu}
        onClose={() => setShowFolderMenu(false)}
        onSelect={(collectionId, folderId) => {
          setSelectedCollectionId(collectionId);
          setSelectedFolderId(folderId);
          if (folderMenuSource === 'create') {
            setShowDialog(true);
          } else {
            setShowMenu(true);
          }
        }}
        anchorRef={folderMenuSource === 'create' ? createBtnRef : uploadBtnRef}
        collections={collections}
        foldersByCollections={foldersByCollection}
        showUnsignedOption={folderMenuSource === 'create'}
      />

      <CreateReferenceDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSelect={async (type, iconId) => {
          const refId = await createBackendReference(type, iconId);
          if (refId) {
            // createBackendReference already invalidates queries,
            // createEmptyReference will add optimistically only if not already present
            await createEmptyReference(type, refId);
            // Note: refresh() removed to prevent duplicate references
            // The query invalidation in createBackendReference handles the sync
          } else {
            addToast('Failed to create reference.', 'error');
          }
        }}
        anchorRef={createBtnRef}
      />

      <div className="mainContent">
        <Sidebar
          collections={collections}
          expandedFolders={expandedFolders}
          selectedCollectionId={selectedCollectionId}
          selectedFolderId={selectedFolderId}
          isLoading={isLoading}
          onToggleFolder={toggleFolder}
          onSelectCollection={selectCollection}
          onSelectFolder={selectFolder}
          onAddCollection={addCollection}
          onRenameCollection={renameCollection}
          onDeleteCollection={deleteCollection}
          foldersByCollection={foldersByCollection}
          onAddFolder={addFolderToCollection}
          onRenameFolder={renameFolder}
          onDeleteFolder={deleteFolder}
          references={references}
          trashedReferences={trashedReferences}
          tags={tags}
          setTags={setTags}
          createTag={createTag}
          isRenaming={isRenaming}
          setIsRenaming={setIsRenaming}
          setFilterTag={setFilterTag}
          filterTag={filterTag}
          setTrashOpen={setIsTrashOpen}
          isTrashOpen={isTrashOpen}
          onDropReferences={handleMoveReferences}
          onUpdateTag={updateTag}
          onDeleteTag={deleteTag}
          isMobile={showMobileScreen}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <ReferenceTable
          references={filteredReferences}
          selectedReferenceId={selectedReferenceId}
          onSelectReference={selectReference}
          filterTag={filterTag}
          trashedReferences={trashedReferences}
          isTrashOpen={isTrashOpen}
          isLoading={isLoading}
          onMoveReferences={handleMoveReferences}
          onCopyReferences={handleCopyReferences}
          collections={collections}
          foldersByCollections={foldersByCollection}
          onDeleteReference={deleteReference}
          onUploadFile={uploadFile}
          onUploadUrls={uploadUrls}
          onUploadImage={uploadImageFile}
          onAttachFile={attachFileToReference}
          onAttachUrl={attachUrlToReference}
          onUnlinkFile={async (referenceId: string, documentId?: string) => {
            if (documentId) {
              await unlinkFileFromReference(referenceId, documentId);
              addToast('File unlinked successfully.', 'success');
            } else {
              await updateReference(referenceId, { file_url: undefined, fileName: undefined });
              addToast('File unlinked successfully.', 'success');
            }
          }}
          onDownloadReference={handleDownloadReference}
          onRestoreReference={restoreReference}
          onHardDeleteReference={hardDeleteReference}
          selectedCollectionId={selectedCollectionId}
          onOpenReference={(referenceId: string) => {
            selectReference(referenceId);
          }}
          onRenameReference={(referenceId: string) => {
            setIsRenaming(true);
            selectReference(referenceId);
          }}
          progress={uploadProgress}
          status={uploadStatus}
        />

        <InfoPanel
          selectedReference={selectedReference}
          isOpen={!!selectedReferenceId}
          onUpdateReference={updateReference}
          showAddTagMenu={showAddTagMenu}
          setShowAddTagMenu={setShowAddTagMenu}
          tagButtonRef={tagButtonRef}
          onDeleteNote={deleteNote}
          editNote={editNote}
          onAddNote={addIndependentNote}
          showMobileScreen={showMobileScreen}
          onClose={() => setSelectedReferenceId(null)}
          onAttachFile={() => {
            if (!selectedReferenceId) {
              addToast('Please select a reference to attach a file to.', 'error');
              return;
            }
            setUploadMode('file');
            setShowUploadDialog(true);
          }}
          onAttachUrl={() => {
            if (!selectedReferenceId) {
              addToast('Please select a reference to attach a URL to.', 'error');
              return;
            }
            setUploadMode('url');
            setShowUploadDialog(true);
          }}
        />

        <AddTagMenu
          open={showAddTagMenu}
          onSelect={handleUpdateTags}
          anchorRef={tagButtonRef}
          onClose={() => setShowAddTagMenu(false)}
          tags={tags}
          onCreateTag={createTag}
        />
      </div>

      <UnifiedUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        uploadMode={uploadMode}
        onUploadFile={
          selectedReferenceId
            ? async (file: File) => {
                try {
                  const refId =
                    (selectedReference?.metadata as any)?.reference_id || selectedReferenceId;
                  await attachFileToReference(refId, file);
                  await refresh();
                  addToast('File attached successfully.', 'success');
                  setShowUploadDialog(false);
                } catch (err) {
                  addToast('Failed to attach file.', 'error');
                }
              }
            : uploadFile
        }
        onUploadUrls={
          selectedReferenceId
            ? async (urls: string[]) => {
                try {
                  if (urls.length > 0) {
                    const refId =
                      (selectedReference?.metadata as any)?.reference_id || selectedReferenceId;
                    await attachUrlToReference(refId, urls[0]);
                    await refresh();
                    addToast('URL attached successfully.', 'success');
                  }
                  setShowUploadDialog(false);
                } catch (err) {
                  addToast('Failed to attach URL.', 'error');
                }
              }
            : uploadUrls
        }
        onUploadImage={
          selectedReferenceId
            ? async (file: File) => {
                try {
                  const refId =
                    (selectedReference?.metadata as any)?.reference_id || selectedReferenceId;
                  await uploadImageFile(file, refId);
                  await refresh();
                  addToast('Image attached successfully.', 'success');
                  setShowUploadDialog(false);
                } catch (err) {
                  addToast('Failed to attach image.', 'error');
                }
              }
            : uploadImageFile
        }
        progress={uploadProgress}
        status={uploadStatus}
      />

      <TimelineSidebar
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        collections={collections}
        foldersByCollection={foldersByCollection}
        references={references}
      />
    </div>
  );
}
