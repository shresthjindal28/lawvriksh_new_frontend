'use client';

import {
  useReferenceStore,
  Collection,
  Folder,
  ReferenceState,
  ReferenceActions,
} from '@/store/zustand/useReferenceStore';
import { ReferenceItem, Tag } from '@/types/reference-manager';

/**
 * Return type for the useReferenceContext hook.
 * This interface maintains backward compatibility with the old Context-based implementation.
 */
export interface UseReferenceContextReturn {
  // State
  collections: Collection[];
  foldersByCollection: Record<string, Folder[]>;
  references: ReferenceItem[];
  referenceIds: string[];
  referencesById: Record<string, ReferenceItem>;
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

  // Pagination state
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  nextCursor: string | null;

  // Actions
  setCollections: (collections: Collection[] | ((prev: Collection[]) => Collection[])) => void;
  setFoldersByCollection: (
    folders:
      | Record<string, Folder[]>
      | ((prev: Record<string, Folder[]>) => Record<string, Folder[]>)
  ) => void;
  setReferences: (
    references: ReferenceItem[] | ((prev: ReferenceItem[]) => ReferenceItem[])
  ) => void;
  setTrashedReferences: (
    references: ReferenceItem[] | ((prev: ReferenceItem[]) => ReferenceItem[])
  ) => void;

  // O(1) lookup functions
  getReferenceById: (id: string) => ReferenceItem | undefined;
  getTrashedReferenceById: (id: string) => ReferenceItem | undefined;
  updateReferenceById: (id: string, updates: Partial<ReferenceItem>) => void;
  appendReferences: (refs: ReferenceItem[]) => void;
  setPaginationState: (state: {
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    nextCursor?: string | null;
  }) => void;

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
  reset: () => void;
}

/**
 * Hook to access the reference store state and actions.
 * This is the primary hook used by components to access reference data.
 *
 * Uses Zustand for state management with optimized selectors.
 */
export const useReferenceContext = (): UseReferenceContextReturn => {
  // Get all state and actions from the store
  const collections = useReferenceStore((state) => state.collections);
  const foldersByCollection = useReferenceStore((state) => state.foldersByCollection);
  const references = useReferenceStore((state) => state.references);
  const referenceIds = useReferenceStore((state) => state.referenceIds);
  const referencesById = useReferenceStore((state) => state.referencesById);
  const trashedReferences = useReferenceStore((state) => state.trashedReferences);
  const tags = useReferenceStore((state) => state.tags);
  const expandedFolders = useReferenceStore((state) => state.expandedFolders);
  const selectedCollectionId = useReferenceStore((state) => state.selectedCollectionId);
  const selectedFolderId = useReferenceStore((state) => state.selectedFolderId);
  const selectedReferenceId = useReferenceStore((state) => state.selectedReferenceId);
  const isRenaming = useReferenceStore((state) => state.isRenaming);
  const error = useReferenceStore((state) => state.error);
  const isLoading = useReferenceStore((state) => state.isLoading);
  const searchQuery = useReferenceStore((state) => state.searchQuery);
  const isTrashOpen = useReferenceStore((state) => state.isTrashOpen);
  const filterTag = useReferenceStore((state) => state.filterTag);

  // Pagination state
  const hasNextPage = useReferenceStore((state) => state.hasNextPage);
  const isFetchingNextPage = useReferenceStore((state) => state.isFetchingNextPage);
  const nextCursor = useReferenceStore((state) => state.nextCursor);

  // Actions
  const setCollections = useReferenceStore((state) => state.setCollections);
  const setFoldersByCollection = useReferenceStore((state) => state.setFoldersByCollection);
  const setReferences = useReferenceStore((state) => state.setReferences);
  const setTrashedReferences = useReferenceStore((state) => state.setTrashedReferences);
  const getReferenceById = useReferenceStore((state) => state.getReferenceById);
  const getTrashedReferenceById = useReferenceStore((state) => state.getTrashedReferenceById);
  const updateReferenceById = useReferenceStore((state) => state.updateReferenceById);
  const appendReferences = useReferenceStore((state) => state.appendReferences);
  const setPaginationState = useReferenceStore((state) => state.setPaginationState);
  const setTags = useReferenceStore((state) => state.setTags);
  const setExpandedFolders = useReferenceStore((state) => state.setExpandedFolders);
  const setSelectedCollectionId = useReferenceStore((state) => state.setSelectedCollectionId);
  const setSelectedFolderId = useReferenceStore((state) => state.setSelectedFolderId);
  const setSelectedReferenceId = useReferenceStore((state) => state.setSelectedReferenceId);
  const setIsRenaming = useReferenceStore((state) => state.setIsRenaming);
  const setError = useReferenceStore((state) => state.setError);
  const setIsLoading = useReferenceStore((state) => state.setIsLoading);
  const setSearchQuery = useReferenceStore((state) => state.setSearchQuery);
  const setIsTrashOpen = useReferenceStore((state) => state.setIsTrashOpen);
  const setFilterTag = useReferenceStore((state) => state.setFilterTag);
  const reset = useReferenceStore((state) => state.reset);

  return {
    // State
    collections,
    foldersByCollection,
    references,
    referenceIds,
    referencesById,
    trashedReferences,
    tags,
    expandedFolders,
    selectedCollectionId,
    selectedFolderId,
    selectedReferenceId,
    isRenaming,
    error,
    isLoading,
    searchQuery,
    isTrashOpen,
    filterTag,
    hasNextPage,
    isFetchingNextPage,
    nextCursor,

    // Actions
    setCollections,
    setFoldersByCollection,
    setReferences,
    setTrashedReferences,
    getReferenceById,
    getTrashedReferenceById,
    updateReferenceById,
    appendReferences,
    setPaginationState,
    setTags,
    setExpandedFolders,
    setSelectedCollectionId,
    setSelectedFolderId,
    setSelectedReferenceId,
    setIsRenaming,
    setError,
    setIsLoading,
    setSearchQuery,
    setIsTrashOpen,
    setFilterTag,
    reset,
  };
};

// Re-export types for convenience
export type { Collection, Folder, ReferenceState, ReferenceActions };
