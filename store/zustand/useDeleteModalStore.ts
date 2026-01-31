import { create } from 'zustand';

interface DeleteModalState {
  isOpen: boolean;
  projectId: string | null;
  projectTitle: string;
  isLoading: boolean;
  onConfirm: () => Promise<void>;
  openModal: (projectId: string, projectTitle: string, onConfirm: () => Promise<void>) => void;
  closeModal: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useDeleteModalStore = create<DeleteModalState>((set) => ({
  isOpen: false,
  projectId: null,
  projectTitle: '',
  isLoading: false,
  onConfirm: async () => {},
  openModal: (projectId, projectTitle, onConfirm) =>
    set({
      isOpen: true,
      projectId,
      projectTitle,
      onConfirm,
      isLoading: false,
    }),
  closeModal: () =>
    set({
      isOpen: false,
      projectId: null,
      projectTitle: '',
      isLoading: false,
      onConfirm: async () => {},
    }),
  setLoading: (isLoading) => set({ isLoading }),
}));
