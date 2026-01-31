import { create } from 'zustand';

type SectionKey = 'workspace' | 'editor' | 'ai' | 'notifications';

interface SettingsUiState {
  activeSection: SectionKey;
  shortcutKeyInput: string;
  isEditingShortcut: boolean;

  // Actions
  setActiveSection: (section: SectionKey) => void;
  setShortcutKeyInput: (input: string) => void;
  setIsEditingShortcut: (isEditing: boolean) => void;
  resetUi: () => void;
}

export const useSettingsUiStore = create<SettingsUiState>((set) => ({
  activeSection: 'workspace',
  shortcutKeyInput: '',
  isEditingShortcut: false,

  setActiveSection: (section) => set({ activeSection: section }),
  setShortcutKeyInput: (input) => set({ shortcutKeyInput: input }),
  setIsEditingShortcut: (isEditing) => set({ isEditingShortcut: isEditing }),
  resetUi: () =>
    set({
      activeSection: 'workspace',
      shortcutKeyInput: '',
      isEditingShortcut: false,
    }),
}));
