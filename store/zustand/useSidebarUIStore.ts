'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ProjectCategory } from '@/types/project';

interface SidebarUIState {
  isCollapsed: boolean;
  isDialogOpen: boolean;
  selectedCategory: ProjectCategory;
  optimisticPath: string;
}

interface SidebarUIActions {
  toggleCollapsed: () => boolean;
  setCollapsed: (collapsed: boolean) => void;

  openDialog: () => void;
  closeDialog: () => void;

  setSelectedCategory: (category: ProjectCategory) => void;

  setOptimisticPath: (path: string) => void;

  reset: () => void;
}

const initialState: SidebarUIState = {
  isCollapsed: true,
  isDialogOpen: false,
  selectedCategory: 'ideation',
  optimisticPath: '',
};

export const useSidebarUIStore = create<SidebarUIState & SidebarUIActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    toggleCollapsed: () => {
      const next = !get().isCollapsed;
      set({ isCollapsed: next });
      return next;
    },
    setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),

    openDialog: () => set({ isDialogOpen: true }),
    closeDialog: () => set({ isDialogOpen: false }),

    setSelectedCategory: (category) => set({ selectedCategory: category }),

    setOptimisticPath: (path) => set({ optimisticPath: path }),

    reset: () => set(initialState),
  }))
);
