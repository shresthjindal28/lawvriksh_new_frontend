import { ReferenceItem, Tag } from '@/types/reference-manager';

// Re-export from the Zustand store for backward compatibility
export type { Collection, Folder } from '@/store/zustand/useReferenceStore';

/**
 * @deprecated Use ReferenceState from '@/store/zustand/useReferenceStore' instead
 */
export interface ReferenceState {
  collections: import('@/store/zustand/useReferenceStore').Collection[];
  foldersByCollection: Record<string, import('@/store/zustand/useReferenceStore').Folder[]>;
  references: ReferenceItem[];
  trashedReferences: ReferenceItem[];
  tags: Tag[];
  expandedFolders: string[];
  selectedCollectionId: string | null;
  selectedFolderId: string | null;
  selectedReferenceId: string | null;
  isRenaming: boolean;
  error: string | null;
  isLoading: boolean;
  searchQuery: string;
  isTrashOpen: boolean;
  filterTag: Tag | null;
}

/**
 * @deprecated Use the return type of useReferenceContext() instead
 * This type is kept for backward compatibility with existing code.
 */
export interface ReferenceContextType extends ReferenceState {
  setCollections: (
    collections:
      | import('@/store/zustand/useReferenceStore').Collection[]
      | ((
          prev: import('@/store/zustand/useReferenceStore').Collection[]
        ) => import('@/store/zustand/useReferenceStore').Collection[])
  ) => void;
  setFoldersByCollection: (
    folders:
      | Record<string, import('@/store/zustand/useReferenceStore').Folder[]>
      | ((
          prev: Record<string, import('@/store/zustand/useReferenceStore').Folder[]>
        ) => Record<string, import('@/store/zustand/useReferenceStore').Folder[]>)
  ) => void;
  setReferences: (
    references: ReferenceItem[] | ((prev: ReferenceItem[]) => ReferenceItem[])
  ) => void;
  setTrashedReferences: (
    references: ReferenceItem[] | ((prev: ReferenceItem[]) => ReferenceItem[])
  ) => void;
  setTags: (tags: Tag[] | ((prev: Tag[]) => Tag[])) => void;
  setExpandedFolders: (folders: string[] | ((prev: string[]) => string[])) => void;
  setSelectedCollectionId: (id: string | null | ((prev: string | null) => string | null)) => void;
  setSelectedFolderId: (id: string | null | ((prev: string | null) => string | null)) => void;
  setSelectedReferenceId: (id: string | null | ((prev: string | null) => string | null)) => void;
  setIsRenaming: (isRenaming: boolean | ((prev: boolean) => boolean)) => void;
  setError: (error: string | null | ((prev: string | null) => string | null)) => void;
  setIsLoading: (isLoading: boolean | ((prev: boolean) => boolean)) => void;
  setSearchQuery: (query: string | ((prev: string) => string)) => void;
  setIsTrashOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  setFilterTag: (tag: Tag | null | ((prev: Tag | null) => Tag | null)) => void;
}
