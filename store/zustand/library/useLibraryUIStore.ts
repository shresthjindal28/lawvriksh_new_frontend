'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { FilterType } from '@/lib/constants/library';
import type { ProjectCategory } from '@/types/project';

type DeleteModalState = {
  isOpen: boolean;
  projectId: string | null;
  isLoading: boolean;
};

interface LibraryUIState {
  filterType: FilterType;
  searchQuery: string;
  category: ProjectCategory;
  isCreateDialogOpen: boolean;
  deleteModal: DeleteModalState;
}

interface LibraryUIActions {
  setFilterType: (filterType: FilterType) => void;

  setSearchQuery: (query: string) => void;
  clearSearch: () => void;

  setCategory: (category: ProjectCategory) => void;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;

  openDeleteModal: (projectId: string) => void;
  closeDeleteModal: () => void;
  resetDeleteModal: () => void;
  setDeleteModalLoading: (isLoading: boolean) => void;

  reset: () => void;
}

const initialState: LibraryUIState = {
  filterType: 'recent',
  searchQuery: '',
  category: 'ideation',
  isCreateDialogOpen: false,
  deleteModal: {
    isOpen: false,
    projectId: null,
    isLoading: false,
  },
};

export const useLibraryUIStore = create<LibraryUIState & LibraryUIActions>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setFilterType: (filterType) => set({ filterType }),

    setSearchQuery: (query) => set({ searchQuery: query }),
    clearSearch: () => set({ searchQuery: '' }),

    setCategory: (category) => set({ category }),
    openCreateDialog: () => set({ isCreateDialogOpen: true }),
    closeCreateDialog: () => set({ isCreateDialogOpen: false }),

    openDeleteModal: (projectId) =>
      set({
        deleteModal: {
          isOpen: true,
          projectId,
          isLoading: false,
        },
      }),
    closeDeleteModal: () =>
      set((state) => ({
        deleteModal: {
          ...state.deleteModal,
          isOpen: false,
          isLoading: false,
        },
      })),
    resetDeleteModal: () => set({ deleteModal: initialState.deleteModal }),
    setDeleteModalLoading: (isLoading) =>
      set((state) => ({
        deleteModal: {
          ...state.deleteModal,
          isLoading,
        },
      })),

    reset: () => set(initialState),
  }))
);
