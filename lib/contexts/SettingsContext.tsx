'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/hooks/common/useSettingsQuery';
import { DEFAULT_SETTINGS } from '@/lib/utils/settingsUtils';

export type WorkspaceSettings = {
  defaultView: 'grid' | 'list';
  autoSave: boolean;
  theme: 'light' | 'dark';
};

export type EditorSettings = {
  fontSize: number;
  spellCheck: boolean;
  grammarCheck: boolean;
  citationFormat: 'apa' | 'mla' | 'chicago';
};

export type AiSettings = {
  smartKeyPointSuggestion: boolean;
  citationRecommendations: boolean;
  complianceChecker: boolean;
  argumentLogicChecker: boolean;
};

export type NotificationSettings = {
  inApp: boolean;
  taskAlerts: boolean;
  soundEnabled: boolean;
  soundChoice: 'chime' | 'ping' | 'soft';
};

export type StorageSettings = {
  uploadLimit: {
    used: number;
    total: number;
  };
  trashAutoDelete: '7_days' | '30_days' | '60_days' | 'never';
};

export type ToolbarShortcutSetting = {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
};

export type ShortcutsSettings = {
  toolbarShortcut: ToolbarShortcutSetting;
};

export type SettingsState = {
  workspace: WorkspaceSettings;
  editor: EditorSettings;
  ai: AiSettings;
  notifications: NotificationSettings;
  storage: StorageSettings;
  shortcuts: ShortcutsSettings;
};

// Re-export DEFAULT_SETTINGS for compatibility if needed, though usually imported from utils
export { DEFAULT_SETTINGS };

interface SettingsContextType {
  settings: SettingsState;
  updateSettings: <T extends keyof SettingsState, K extends keyof SettingsState[T]>(
    section: T,
    key: K,
    value: SettingsState[T][K]
  ) => Promise<void>;
  toggleSetting: <T extends keyof SettingsState, K extends keyof SettingsState[T]>(
    section: T,
    key: K
  ) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isDirty: boolean;
  isSyncing: boolean;
  syncError: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { data: settings = DEFAULT_SETTINGS, isLoading } = useSettingsQuery();
  const updateSettingsMutation = useUpdateSettingsMutation();

  const updateSettings = useCallback(
    async <T extends keyof SettingsState, K extends keyof SettingsState[T]>(
      section: T,
      key: K,
      value: SettingsState[T][K]
    ) => {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [key]: value,
        },
      };
      await updateSettingsMutation.mutateAsync(newSettings);
    },
    [settings, updateSettingsMutation]
  );

  const toggleSetting = useCallback(
    async <T extends keyof SettingsState, K extends keyof SettingsState[T]>(section: T, key: K) => {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [key]: !settings[section][key] as unknown as SettingsState[T][K],
        },
      };
      await updateSettingsMutation.mutateAsync(newSettings);
    },
    [settings, updateSettingsMutation]
  );

  const resetToDefault = useCallback(async () => {
    await updateSettingsMutation.mutateAsync(DEFAULT_SETTINGS);
  }, [updateSettingsMutation]);

  // Apply theme changes to document
  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      const root = document.documentElement;
      if (settings.workspace.theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.workspace.theme, isLoading]);

  // Listen for toggle-theme event from command palette
  useEffect(() => {
    if (isLoading) return;

    const handleToggleTheme = async () => {
      const newTheme: WorkspaceSettings['theme'] =
        settings.workspace.theme === 'dark' ? 'light' : 'dark';

      await updateSettings('workspace', 'theme', newTheme);
    };

    window.addEventListener('toggle-theme', handleToggleTheme);
    return () => window.removeEventListener('toggle-theme', handleToggleTheme);
  }, [isLoading, settings.workspace.theme, updateSettings]);

  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);
  }, [settings]);

  const isSyncing = updateSettingsMutation.isPending || isLoading;
  const syncError = updateSettingsMutation.error
    ? (updateSettingsMutation.error as Error).message
    : null;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        toggleSetting,
        resetToDefault,
        isDirty,
        isSyncing,
        syncError,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
