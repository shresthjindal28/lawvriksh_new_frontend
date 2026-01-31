// Mock Data Utilities for Reference Manager
import { Tag, Collection, Folder } from '@/lib/contexts/ReferenceManagerContext';
import { ReferenceItem, ReferenceType, Note, Annotation } from '@/types/reference-manager';

// Direct export functions that work with state
export const createAddCollection = (
  collections: Collection[],
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>
) => {
  return () => {
    const newCollection: Collection = {
      id: `c-${Date.now()}`,
      title: 'New Collection',
    };
    setCollections((prev) => {
      const idx = prev.findIndex((n) => n.id === 'collections');
      if (idx === -1) return [...prev, newCollection];
      const copy = [...prev];
      copy.splice(idx + 1, 0, newCollection);
      return copy;
    });
    setFoldersByCollection((prev) => ({
      ...prev,
      [newCollection.id]: [],
    }));
  };
};

export const createRenameCollection = (
  collections: Collection[],
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
  setIsRenaming: React.Dispatch<React.SetStateAction<boolean>>
) => {
  return async (id: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, title: '' } : c)));
      setIsRenaming(true);
      return;
    }
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
  };
};

export const createDeleteCollection = (
  collections: Collection[],
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>,
  expandedFolders: string[],
  setExpandedFolders: React.Dispatch<React.SetStateAction<string[]>>,
  selectedCollectionId: string | null,
  setSelectedCollectionId: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedFolderId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  return async (id: string) => {
    const refsToTrash = references.filter((r) => r.collectionId === id);
    if (refsToTrash.length > 0) {
      setTrashedReferences((prev) => [...prev, ...refsToTrash]);
    }
    setReferences((prev) => prev.filter((r) => r.collectionId !== id));
    setFoldersByCollection((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setCollections((prev) => prev.filter((c) => c.id !== id));
    setExpandedFolders((prev) => prev.filter((x) => x !== id));
    if (selectedCollectionId === id) {
      setSelectedCollectionId(null);
      setSelectedFolderId(null);
    }
  };
};

export const createAddFolderToCollection = (
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>
) => {
  return async (collectionId: string, title = 'New Folder'): Promise<string> => {
    const newFolder: Folder = {
      id: `f-${collectionId}-${Date.now()}`,
      title,
    };
    setFoldersByCollection((prev) => ({
      ...prev,
      [collectionId]: [...(prev[collectionId] || []), newFolder],
    }));
    return newFolder.id;
  };
};

export const createRenameFolder = (
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>
) => {
  return async (collectionId: string, folderId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      setFoldersByCollection((prev) => ({
        ...prev,
        [collectionId]: (prev[collectionId] || []).map((f) =>
          f.id === folderId ? { ...f, title: '' } : f
        ),
      }));
      return;
    }
    setFoldersByCollection((prev) => ({
      ...prev,
      [collectionId]: (prev[collectionId] || []).map((f) =>
        f.id === folderId ? { ...f, title: newTitle } : f
      ),
    }));
  };
};

export const createDeleteFolder = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>,
  selectedFolderId: string | null,
  setSelectedFolderId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  return async (collectionId: string, folderId: string) => {
    const refsToTrash = references.filter(
      (r) => r.folderId === folderId && r.collectionId === collectionId
    );
    if (refsToTrash.length > 0) {
      setTrashedReferences((prev) => [...prev, ...refsToTrash]);
    }
    setFoldersByCollection((prev) => ({
      ...prev,
      [collectionId]: (prev[collectionId] || []).filter((f) => f.id !== folderId),
    }));
    setReferences((prev) => prev.filter((r) => r.folderId !== folderId));
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    }
  };
};

export const createUpdateReference = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>
) => {
  return async (id: string, updates: Partial<ReferenceItem>) => {
    setReferences((prev) =>
      prev.map((ref) =>
        ref.id === id ? { ...ref, ...updates, modifiedAt: new Date().toISOString() } : ref
      )
    );
  };
};

export const createDeleteReference = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedReferenceId: string | null,
  setSelectedReferenceId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  return async (id: string) => {
    const ref = references.find((r) => r.id === id);
    if (ref) {
      setTrashedReferences((prev) => [...prev, ref]);
    }
    setReferences((prev) => prev.filter((r) => r.id !== id));
    if (selectedReferenceId === id) {
      setSelectedReferenceId(null);
    }
  };
};

export const createRestoreReference = (
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>
) => {
  return async (id: string) => {
    const ref = trashedReferences.find((r) => r.id === id);
    if (ref) {
      setTrashedReferences((prev) => prev.filter((r) => r.id !== id));
      setReferences((prev) => [...prev, ref]);
    }
  };
};

export const createHardDeleteReference = (
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedReferenceId: string | null,
  setSelectedReferenceId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  return async (id: string) => {
    setTrashedReferences((prev) => prev.filter((r) => r.id !== id));
    if (selectedReferenceId === id) {
      setSelectedReferenceId(null);
    }
  };
};

export const createCreateEmptyReference = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedCollectionId: string | null,
  selectedFolderId: string | null,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  return async (type: ReferenceType, refId?: string) => {
    if (!selectedCollectionId || !selectedFolderId) {
      setError('Please create and select a sub-collection (folder) before adding references.');
      return;
    }
    const newRef: ReferenceItem = {
      id: `r-${Date.now()}`,
      type,
      title: 'Empty Reference',
      metadata: {},
      collectionId: selectedCollectionId,
      folderId: selectedFolderId,
      document_source_type: 'weblink',
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
    setReferences((prev) => [...prev, newRef]);
  };
};

export const createCreateBackendReference = (
  selectedCollectionId: string | null,
  selectedFolderId: string | null,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  return async (type: ReferenceType, iconId?: string): Promise<string | undefined> => {
    if (!selectedCollectionId || !selectedFolderId) {
      setError('Please create and select a sub-collection (folder) before adding references.');
      return;
    }
    return `ref-${Date.now()}`;
  };
};

export const createCreateTag = (
  tags: Tag[],
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>,
  setIsRenaming: React.Dispatch<React.SetStateAction<boolean>>
) => {
  return async () => {
    const newTag: Tag = {
      id: `t-${Date.now()}`,
      label: '',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    };
    setTags((prev) => [...prev, newTag]);
    setIsRenaming(true);
  };
};

export const createChangeCollectionIcon = (
  collections: Collection[],
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>
) => {
  return (id: string, icon: string) => {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, icon } : c)));
  };
};

export const createChangeFolderIcon = (
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>
) => {
  return (collectionId: string, folderId: string, icon: string) => {
    setFoldersByCollection((prev) => ({
      ...prev,
      [collectionId]: (prev[collectionId] || []).map((f) =>
        f.id === folderId ? { ...f, icon } : f
      ),
    }));
  };
};

export const createAddIndependentNote = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>
) => {
  return async (referenceId: string, content: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content,
      type: 'independent',
      createdBy: 'mock-user',
      createdAt: new Date().toISOString(),
    };
    setReferences((prev) =>
      prev.map((ref) =>
        ref.id === referenceId
          ? {
              ...ref,
              independentNotes: [...(ref.independentNotes || []), newNote],
            }
          : ref
      )
    );
  };
};

export const createEditNote = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>
) => {
  return async (referenceId: string, noteId: string, newContent: string) => {
    setReferences((prev) =>
      prev.map((ref) =>
        ref.id === referenceId
          ? {
              ...ref,
              independentNotes: ref.independentNotes?.map((note) =>
                note.id === noteId
                  ? { ...note, content: newContent, modifiedAt: new Date().toISOString() }
                  : note
              ),
            }
          : ref
      )
    );
  };
};

export const createDeleteNote = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>
) => {
  return async (referenceId: string, noteId: string) => {
    setReferences((prev) =>
      prev.map((ref) =>
        ref.id === referenceId
          ? {
              ...ref,
              independentNotes: ref.independentNotes?.filter((note) => note.id !== noteId),
            }
          : ref
      )
    );
  };
};

export const createUploadFile = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedCollectionId: string | null,
  selectedFolderId: string | null,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  return async (file: File) => {
    if (!selectedCollectionId || !selectedFolderId) {
      setError('Select a collection folder before uploading.');
      return;
    }
    const newRef: ReferenceItem = {
      id: `r-${Date.now()}`,
      type: 'general_document',
      title: file.name,
      metadata: {},
      collectionId: selectedCollectionId,
      folderId: selectedFolderId,
      document_source_type: 'file',
      file_url: `mock-uploads/${file.name}`,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
    setReferences((prev) => [...prev, newRef]);
  };
};

export const createUploadUrls = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedCollectionId: string | null,
  selectedFolderId: string | null,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  return async (urls: string[]) => {
    if (!selectedCollectionId || !selectedFolderId) {
      setError('Select a collection folder before adding URLs.');
      return;
    }
    for (const url of urls) {
      const newRef: ReferenceItem = {
        id: `r-${Date.now()}-${Math.random()}`,
        type: 'general_document',
        title: url,
        metadata: {},
        collectionId: selectedCollectionId,
        folderId: selectedFolderId,
        document_source_type: 'weblink',
        web_url: url,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      };
      setReferences((prev) => [...prev, newRef]);
    }
  };
};

export const createAttachFileToReference = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>
) => {
  return async (referenceId: string, file: File) => {
    setReferences((prev) =>
      prev.map((ref) =>
        ref.id === referenceId
          ? {
              ...ref,
              file_url: `mock-attachments/${file.name}`,
              web_url: undefined,
              document_source_type: 'file',
              fileName: file.name,
              modifiedAt: new Date().toISOString(),
            }
          : ref
      )
    );
  };
};

export const createAttachUrlToReference = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>
) => {
  return async (referenceId: string, url: string) => {
    setReferences((prev) =>
      prev.map((ref) =>
        ref.id === referenceId
          ? {
              ...ref,
              web_url: url,
              file_url: undefined,
              document_source_type: 'weblink',
              modifiedAt: new Date().toISOString(),
            }
          : ref
      )
    );
  };
};

export const createUnlinkFileFromReference = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>
) => {
  return async (referenceId: string) => {
    setReferences((prev) =>
      prev.map((ref) =>
        ref.id === referenceId
          ? {
              ...ref,
              file_url: undefined,
              web_url: undefined,
              fileName: undefined,
              modifiedAt: new Date().toISOString(),
            }
          : ref
      )
    );
  };
};

export const createUpdateAnnotation = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>
) => {
  return (referenceId: string, annotationId: string, updates: Partial<Annotation>) => {
    setReferences((prev) =>
      prev.map((ref) =>
        ref.id === referenceId
          ? {
              ...ref,
              annotations: ref.annotations?.map((ann) =>
                ann.id === annotationId ? { ...ann, ...updates } : ann
              ),
            }
          : ref
      )
    );
  };
};

// Collection Utilities
export const addCollectionUtil = (
  collections: Collection[],
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>
) => {
  const newCollection: Collection = {
    id: `c-${Date.now()}`,
    title: 'New Collection',
  };
  setCollections((prev) => {
    const idx = prev.findIndex((n) => n.id === 'collections');
    if (idx === -1) return [...prev, newCollection];
    const copy = [...prev];
    copy.splice(idx + 1, 0, newCollection);
    return copy;
  });
  setFoldersByCollection((prev) => ({
    ...prev,
    [newCollection.id]: [],
  }));
};

export const renameCollectionUtil = (
  collections: Collection[],
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
  id: string,
  newTitle: string,
  setIsRenaming: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!newTitle.trim()) {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, title: '' } : c)));
    setIsRenaming(true);
    return;
  }
  setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
};

export const deleteCollectionUtil = (
  collections: Collection[],
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>,
  expandedFolders: string[],
  setExpandedFolders: React.Dispatch<React.SetStateAction<string[]>>,
  selectedCollectionId: string | null,
  setSelectedCollectionId: React.Dispatch<React.SetStateAction<string | null>>,
  setSelectedFolderId: React.Dispatch<React.SetStateAction<string | null>>,
  id: string
) => {
  const refsToTrash = references.filter((r) => r.collectionId === id);
  if (refsToTrash.length > 0) {
    setTrashedReferences((prev) => [...prev, ...refsToTrash]);
  }
  setReferences((prev) => prev.filter((r) => r.collectionId !== id));
  setFoldersByCollection((prev) => {
    const copy = { ...prev };
    delete copy[id];
    return copy;
  });
  setCollections((prev) => prev.filter((c) => c.id !== id));
  setExpandedFolders((prev) => prev.filter((x) => x !== id));
  if (selectedCollectionId === id) {
    setSelectedCollectionId(null);
    setSelectedFolderId(null);
  }
};

// Folder Utilities
export const addFolderToCollectionUtil = (
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>,
  collectionId: string,
  title = 'New Folder'
): string => {
  const newFolder: Folder = {
    id: `f-${collectionId}-${Date.now()}`,
    title,
  };
  setFoldersByCollection((prev) => ({
    ...prev,
    [collectionId]: [...(prev[collectionId] || []), newFolder],
  }));
  return newFolder.id;
};

export const renameFolderUtil = (
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>,
  collectionId: string,
  folderId: string,
  newTitle: string
) => {
  if (!newTitle.trim()) {
    setFoldersByCollection((prev) => ({
      ...prev,
      [collectionId]: (prev[collectionId] || []).map((f) =>
        f.id === folderId ? { ...f, title: '' } : f
      ),
    }));
    return;
  }
  setFoldersByCollection((prev) => ({
    ...prev,
    [collectionId]: (prev[collectionId] || []).map((f) =>
      f.id === folderId ? { ...f, title: newTitle } : f
    ),
  }));
};

export const deleteFolderUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>,
  selectedFolderId: string | null,
  setSelectedFolderId: React.Dispatch<React.SetStateAction<string | null>>,
  collectionId: string,
  folderId: string
) => {
  const refsToTrash = references.filter(
    (r) => r.folderId === folderId && r.collectionId === collectionId
  );
  if (refsToTrash.length > 0) {
    setTrashedReferences((prev) => [...prev, ...refsToTrash]);
  }
  setFoldersByCollection((prev) => ({
    ...prev,
    [collectionId]: (prev[collectionId] || []).filter((f) => f.id !== folderId),
  }));
  setReferences((prev) => prev.filter((r) => r.folderId !== folderId));
  if (selectedFolderId === folderId) {
    setSelectedFolderId(null);
  }
};

// Reference Utilities
export const updateReferenceUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  id: string,
  updates: Partial<ReferenceItem>
) => {
  setReferences((prev) =>
    prev.map((ref) =>
      ref.id === id ? { ...ref, ...updates, modifiedAt: new Date().toISOString() } : ref
    )
  );
};

export const deleteReferenceUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedReferenceId: string | null,
  setSelectedReferenceId: React.Dispatch<React.SetStateAction<string | null>>,
  id: string
) => {
  const ref = references.find((r) => r.id === id);
  if (ref) {
    setTrashedReferences((prev) => [...prev, ref]);
  }
  setReferences((prev) => prev.filter((r) => r.id !== id));
  if (selectedReferenceId === id) {
    setSelectedReferenceId(null);
  }
};

export const restoreReferenceUtil = (
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  id: string
) => {
  const ref = trashedReferences.find((r) => r.id === id);
  if (ref) {
    setTrashedReferences((prev) => prev.filter((r) => r.id !== id));
    setReferences((prev) => [...prev, ref]);
  }
};

export const hardDeleteReferenceUtil = (
  trashedReferences: ReferenceItem[],
  setTrashedReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedReferenceId: string | null,
  setSelectedReferenceId: React.Dispatch<React.SetStateAction<string | null>>,
  id: string
) => {
  setTrashedReferences((prev) => prev.filter((r) => r.id !== id));
  if (selectedReferenceId === id) {
    setSelectedReferenceId(null);
  }
};

export const createEmptyReferenceUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedCollectionId: string | null,
  selectedFolderId: string | null,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  type: ReferenceType,
  refId?: string
) => {
  if (!selectedCollectionId || !selectedFolderId) {
    setError('Please create and select a sub-collection (folder) before adding references.');
    return;
  }
  const newRef: ReferenceItem = {
    id: `r-${Date.now()}`,
    type,
    title: 'Empty Reference',
    metadata: {},
    collectionId: selectedCollectionId,
    folderId: selectedFolderId,
    document_source_type: 'weblink',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  };
  setReferences((prev) => [...prev, newRef]);
};

export const createBackendReferenceUtil = (
  selectedCollectionId: string | null,
  selectedFolderId: string | null,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  type: ReferenceType,
  iconId?: string
): string | undefined => {
  if (!selectedCollectionId || !selectedFolderId) {
    setError('Please create and select a sub-collection (folder) before adding references.');
    return;
  }
  return `ref-${Date.now()}`;
};

// Tag Utilities
export const createTagUtil = (
  tags: Tag[],
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>,
  setIsRenaming: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const newTag: Tag = {
    id: `t-${Date.now()}`,
    label: '',
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
  };
  setTags((prev) => [...prev, newTag]);
  setIsRenaming(true);
};

// Icon Utilities
export const changeCollectionIconUtil = (
  collections: Collection[],
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>,
  id: string,
  icon: string
) => {
  setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, icon } : c)));
};

export const changeFolderIconUtil = (
  foldersByCollection: Record<string, Folder[]>,
  setFoldersByCollection: React.Dispatch<React.SetStateAction<Record<string, Folder[]>>>,
  collectionId: string,
  folderId: string,
  icon: string
) => {
  setFoldersByCollection((prev) => ({
    ...prev,
    [collectionId]: (prev[collectionId] || []).map((f) => (f.id === folderId ? { ...f, icon } : f)),
  }));
};

// Note Utilities
export const addIndependentNoteUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  referenceId: string,
  content: string
) => {
  const newNote: Note = {
    id: `note-${Date.now()}`,
    content,
    type: 'independent',
    createdBy: 'mock-user',
    createdAt: new Date().toISOString(),
  };
  setReferences((prev) =>
    prev.map((ref) =>
      ref.id === referenceId
        ? {
            ...ref,
            independentNotes: [...(ref.independentNotes || []), newNote],
          }
        : ref
    )
  );
};

export const editNoteUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  referenceId: string,
  noteId: string,
  newContent: string
) => {
  setReferences((prev) =>
    prev.map((ref) =>
      ref.id === referenceId
        ? {
            ...ref,
            independentNotes: ref.independentNotes?.map((note) =>
              note.id === noteId
                ? { ...note, content: newContent, modifiedAt: new Date().toISOString() }
                : note
            ),
          }
        : ref
    )
  );
};

export const deleteNoteUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  referenceId: string,
  noteId: string
) => {
  setReferences((prev) =>
    prev.map((ref) =>
      ref.id === referenceId
        ? {
            ...ref,
            independentNotes: ref.independentNotes?.filter((note) => note.id !== noteId),
          }
        : ref
    )
  );
};

// File/URL Utilities
export const uploadFileUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedCollectionId: string | null,
  selectedFolderId: string | null,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  file: File
) => {
  if (!selectedCollectionId || !selectedFolderId) {
    setError('Select a collection folder before uploading.');
    return;
  }
  const newRef: ReferenceItem = {
    id: `r-${Date.now()}`,
    type: 'general_document',
    title: file.name,
    metadata: {},
    collectionId: selectedCollectionId,
    folderId: selectedFolderId,
    document_source_type: 'file',
    file_url: `mock-uploads/${file.name}`,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  };
  setReferences((prev) => [...prev, newRef]);
};

export const uploadUrlsUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  selectedCollectionId: string | null,
  selectedFolderId: string | null,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  urls: string[]
) => {
  if (!selectedCollectionId || !selectedFolderId) {
    setError('Select a collection folder before adding URLs.');
    return;
  }
  for (const url of urls) {
    const newRef: ReferenceItem = {
      id: `r-${Date.now()}-${Math.random()}`,
      type: 'general_document',
      title: url,
      metadata: {},
      collectionId: selectedCollectionId,
      folderId: selectedFolderId,
      document_source_type: 'weblink',
      web_url: url,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    };
    setReferences((prev) => [...prev, newRef]);
  }
};

export const attachFileToReferenceUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  referenceId: string,
  file: File
) => {
  setReferences((prev) =>
    prev.map((ref) =>
      ref.id === referenceId
        ? {
            ...ref,
            file_url: `mock-attachments/${file.name}`,
            web_url: undefined,
            document_source_type: 'file',
            fileName: file.name,
            modifiedAt: new Date().toISOString(),
          }
        : ref
    )
  );
};

export const attachUrlToReferenceUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  referenceId: string,
  url: string
) => {
  setReferences((prev) =>
    prev.map((ref) =>
      ref.id === referenceId
        ? {
            ...ref,
            web_url: url,
            file_url: undefined,
            document_source_type: 'weblink',
            modifiedAt: new Date().toISOString(),
          }
        : ref
    )
  );
};

export const unlinkFileFromReferenceUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  referenceId: string
) => {
  setReferences((prev) =>
    prev.map((ref) =>
      ref.id === referenceId
        ? {
            ...ref,
            file_url: undefined,
            web_url: undefined,
            fileName: undefined,
            modifiedAt: new Date().toISOString(),
          }
        : ref
    )
  );
};

export const updateAnnotationUtil = (
  references: ReferenceItem[],
  setReferences: React.Dispatch<React.SetStateAction<ReferenceItem[]>>,
  referenceId: string,
  annotationId: string,
  updates: Partial<Annotation>
) => {
  setReferences((prev) =>
    prev.map((ref) =>
      ref.id === referenceId
        ? {
            ...ref,
            annotations: ref.annotations?.map((ann) =>
              ann.id === annotationId ? { ...ann, ...updates } : ann
            ),
          }
        : ref
    )
  );
};
