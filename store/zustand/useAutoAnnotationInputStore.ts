import { create } from 'zustand';

interface AutoAnnotationInputState {
  isAutoMode: boolean;
  setAutoMode: (value: boolean) => void;
  toggleAutoMode: () => void;
  resetAutoMode: () => void;
}

export const useAutoAnnotationInputStore = create<AutoAnnotationInputState>((set) => ({
  isAutoMode: false,
  setAutoMode: (value) => set({ isAutoMode: value }),
  toggleAutoMode: () => set((state) => ({ isAutoMode: !state.isAutoMode })),
  resetAutoMode: () => set({ isAutoMode: false }),
}));
