'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { ReferenceItem, Tag } from '@/types/reference-manager';

// Types
export interface Collection {
  id: string;
  title: string;
  icon?: string;
}

export interface Folder {
  id: string;
  title: string;
  icon?: string;
}

// State interface
export interface ReferenceState {
  // Data - HashMap-based storage for O(1) lookups
  collections: Collection[];
  foldersByCollection: Record<string, Folder[]>;

  // References stored in both Map (for O(1) lookup) and array (for ordered iteration)
  referencesById: Record<string, ReferenceItem>; // O(1) lookup by ID
  referenceIds: string[]; // Maintains order
  references: ReferenceItem[]; // Computed array for backward compatibility

  trashedReferencesById: Record<string, ReferenceItem>; // O(1) lookup by ID
  trashedReferenceIds: string[]; // Maintains order
  trashedReferences: ReferenceItem[]; // Computed array for backward compatibility

  tags: Tag[];

  // Pagination State
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  nextCursor: string | null;

  // UI State
  expandedFolders: string[];
  selectedCollectionId: string | null;
  selectedFolderId: string | null;
  selectedReferenceId: string | null;

  // App State
  isRenaming: boolean;
  error: string | null;
  isLoading: boolean;
  searchQuery: string;
  isTrashOpen: boolean;
  filterTag: Tag | null;
}

// Actions interface
export interface ReferenceActions {
  // Collection actions
  setCollections: (collections: Collection[] | ((prev: Collection[]) => Collection[])) => void;

  // Folder actions
  setFoldersByCollection: (
    folders:
      | Record<string, Folder[]>
      | ((prev: Record<string, Folder[]>) => Record<string, Folder[]>)
  ) => void;

  // Reference actions - O(1) optimized
  setReferences: (
    references: ReferenceItem[] | ((prev: ReferenceItem[]) => ReferenceItem[])
  ) => void;
  setTrashedReferences: (
    references: ReferenceItem[] | ((prev: ReferenceItem[]) => ReferenceItem[])
  ) => void;

  // O(1) lookup function
  getReferenceById: (id: string) => ReferenceItem | undefined;
  getTrashedReferenceById: (id: string) => ReferenceItem | undefined;

  // Optimized update for single reference (O(1))
  updateReferenceById: (id: string, updates: Partial<ReferenceItem>) => void;

  // Append references (for infinite scroll pagination)
  appendReferences: (refs: ReferenceItem[]) => void;

  // Pagination actions
  setPaginationState: (state: {
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    nextCursor?: string | null;
  }) => void;

  // Tag actions
  setTags: (tags: Tag[] | ((prev: Tag[]) => Tag[])) => void;

  // UI State actions
  setExpandedFolders: (folders: string[] | ((prev: string[]) => string[])) => void;
  setSelectedCollectionId: (id: string | null | ((prev: string | null) => string | null)) => void;
  setSelectedFolderId: (id: string | null | ((prev: string | null) => string | null)) => void;
  setSelectedReferenceId: (id: string | null | ((prev: string | null) => string | null)) => void;

  // App State actions
  setIsRenaming: (isRenaming: boolean | ((prev: boolean) => boolean)) => void;
  setError: (error: string | null | ((prev: string | null) => string | null)) => void;
  setIsLoading: (isLoading: boolean | ((prev: boolean) => boolean)) => void;
  setSearchQuery: (query: string | ((prev: string) => string)) => void;
  setIsTrashOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  setFilterTag: (tag: Tag | null | ((prev: Tag | null) => Tag | null)) => void;

  // Utility actions
  reset: () => void;
}

// Combined store type
export type ReferenceStore = ReferenceState & ReferenceActions;

// Initial state
const initialState: ReferenceState = {
  collections: [],
  foldersByCollection: {},

  // HashMap-based reference storage
  referencesById: {},
  referenceIds: [],
  references: [], // Computed from referencesById + referenceIds

  trashedReferencesById: {},
  trashedReferenceIds: [],
  trashedReferences: [], // Computed from trashedReferencesById + trashedReferenceIds

  tags: [],

  // Pagination state
  hasNextPage: false,
  isFetchingNextPage: false,
  nextCursor: null,

  expandedFolders: ['collections'],
  selectedCollectionId: null,
  selectedFolderId: null,
  selectedReferenceId: null,
  isRenaming: false,
  error: null,
  isLoading: false,
  searchQuery: '',
  isTrashOpen: false,
  filterTag: null,
};

// Helper to convert array to Map-based storage
const arrayToMapStorage = (
  refs: ReferenceItem[]
): { byId: Record<string, ReferenceItem>; ids: string[] } => {
  const byId: Record<string, ReferenceItem> = {};
  const ids: string[] = [];
  refs.forEach((ref) => {
    byId[ref.id] = ref;
    ids.push(ref.id);
  });
  return { byId, ids };
};

// Helper to convert Map-based storage back to array
const mapStorageToArray = (byId: Record<string, ReferenceItem>, ids: string[]): ReferenceItem[] => {
  return ids.map((id) => byId[id]).filter(Boolean);
};

// Helper to handle functional updates (similar to React's setState)
const handleUpdate = <T>(value: T | ((prev: T) => T), prev: T): T => {
  if (typeof value === 'function') {
    return (value as (prev: T) => T)(prev);
  }
  return value;
};

// Create the store
export const useReferenceStore = create<ReferenceStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      ...initialState,

      // Collection actions
      setCollections: (collections) =>
        set(
          (state) => ({
            collections: handleUpdate(collections, state.collections),
          }),
          false,
          'setCollections'
        ),

      // Folder actions
      setFoldersByCollection: (folders) =>
        set(
          (state) => ({
            foldersByCollection: handleUpdate(folders, state.foldersByCollection),
          }),
          false,
          'setFoldersByCollection'
        ),

      // Reference actions - O(1) optimized with Map-based storage
      setReferences: (references) =>
        set(
          (state) => {
            const newRefs = handleUpdate(references, state.references);
            const { byId, ids } = arrayToMapStorage(newRefs);
            return {
              referencesById: byId,
              referenceIds: ids,
              references: newRefs,
            };
          },
          false,
          'setReferences'
        ),

      setTrashedReferences: (references) =>
        set(
          (state) => {
            const newRefs = handleUpdate(references, state.trashedReferences);
            const { byId, ids } = arrayToMapStorage(newRefs);
            return {
              trashedReferencesById: byId,
              trashedReferenceIds: ids,
              trashedReferences: newRefs,
            };
          },
          false,
          'setTrashedReferences'
        ),

      // O(1) lookup functions
      getReferenceById: (id: string) => {
        return get().referencesById[id];
      },

      getTrashedReferenceById: (id: string) => {
        return get().trashedReferencesById[id];
      },

      // O(1) update for single reference
      updateReferenceById: (id: string, updates: Partial<ReferenceItem>) =>
        set(
          (state) => {
            const existing = state.referencesById[id];
            if (!existing) return state;

            const updated = { ...existing, ...updates };
            const newById = { ...state.referencesById, [id]: updated };

            return {
              referencesById: newById,
              references: mapStorageToArray(newById, state.referenceIds),
            };
          },
          false,
          'updateReferenceById'
        ),

      // Append references for infinite scroll (O(m) where m = new items)
      appendReferences: (refs: ReferenceItem[]) =>
        set(
          (state) => {
            const newById = { ...state.referencesById };
            const newIds = [...state.referenceIds];

            refs.forEach((ref) => {
              if (!newById[ref.id]) {
                newById[ref.id] = ref;
                newIds.push(ref.id);
              } else {
                // Update existing reference
                newById[ref.id] = { ...newById[ref.id], ...ref };
              }
            });

            return {
              referencesById: newById,
              referenceIds: newIds,
              references: mapStorageToArray(newById, newIds),
            };
          },
          false,
          'appendReferences'
        ),

      // Pagination state
      setPaginationState: (paginationState) =>
        set(
          (state) => ({
            hasNextPage: paginationState.hasNextPage ?? state.hasNextPage,
            isFetchingNextPage: paginationState.isFetchingNextPage ?? state.isFetchingNextPage,
            nextCursor:
              paginationState.nextCursor !== undefined
                ? paginationState.nextCursor
                : state.nextCursor,
          }),
          false,
          'setPaginationState'
        ),

      // Tag actions
      setTags: (tags) =>
        set(
          (state) => ({
            tags: handleUpdate(tags, state.tags),
          }),
          false,
          'setTags'
        ),

      // UI State actions
      setExpandedFolders: (folders) =>
        set(
          (state) => ({
            expandedFolders: handleUpdate(folders, state.expandedFolders),
          }),
          false,
          'setExpandedFolders'
        ),

      setSelectedCollectionId: (id) =>
        set(
          (state) => ({
            selectedCollectionId: handleUpdate(id, state.selectedCollectionId),
          }),
          false,
          'setSelectedCollectionId'
        ),

      setSelectedFolderId: (id) =>
        set(
          (state) => ({
            selectedFolderId: handleUpdate(id, state.selectedFolderId),
          }),
          false,
          'setSelectedFolderId'
        ),

      setSelectedReferenceId: (id) =>
        set(
          (state) => ({
            selectedReferenceId: handleUpdate(id, state.selectedReferenceId),
          }),
          false,
          'setSelectedReferenceId'
        ),

      // App State actions
      setIsRenaming: (isRenaming) =>
        set(
          (state) => ({
            isRenaming: handleUpdate(isRenaming, state.isRenaming),
          }),
          false,
          'setIsRenaming'
        ),

      setError: (error) =>
        set(
          (state) => ({
            error: handleUpdate(error, state.error),
          }),
          false,
          'setError'
        ),

      setIsLoading: (isLoading) =>
        set(
          (state) => ({
            isLoading: handleUpdate(isLoading, state.isLoading),
          }),
          false,
          'setIsLoading'
        ),

      setSearchQuery: (query) =>
        set(
          (state) => ({
            searchQuery: handleUpdate(query, state.searchQuery),
          }),
          false,
          'setSearchQuery'
        ),

      setIsTrashOpen: (isOpen) =>
        set(
          (state) => ({
            isTrashOpen: handleUpdate(isOpen, state.isTrashOpen),
          }),
          false,
          'setIsTrashOpen'
        ),

      setFilterTag: (tag) =>
        set(
          (state) => ({
            filterTag: handleUpdate(tag, state.filterTag),
          }),
          false,
          'setFilterTag'
        ),

      // Utility actions
      reset: () => set(initialState, false, 'reset'),
    })),
    { name: 'ReferenceStore' }
  )
);
