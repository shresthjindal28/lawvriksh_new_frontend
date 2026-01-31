import { SettingsState } from '@/lib/contexts/SettingsContext';

export const DEFAULT_SETTINGS: SettingsState = {
  workspace: {
    defaultView: 'grid',
    autoSave: true,
    theme: 'light',
  },
  editor: {
    fontSize: 14,
    spellCheck: true,
    grammarCheck: true,
    citationFormat: 'chicago',
  },
  ai: {
    smartKeyPointSuggestion: true,
    citationRecommendations: true,
    complianceChecker: true,
    argumentLogicChecker: true,
  },
  notifications: {
    inApp: true,
    taskAlerts: false,
    soundEnabled: true,
    soundChoice: 'chime',
  },
  storage: {
    uploadLimit: {
      used: 5,
      total: 10,
    },
    trashAutoDelete: '30_days',
  },
  shortcuts: {
    toolbarShortcut: {
      key: 't',
      ctrlKey: false,
      metaKey: true,
      altKey: false,
      shiftKey: false,
    },
  },
};

export function mergeSettings(
  serverSettings: Partial<SettingsState> | undefined | null
): SettingsState {
  if (!serverSettings) return DEFAULT_SETTINGS;

  return {
    ...DEFAULT_SETTINGS,
    ...serverSettings,
    workspace: { ...DEFAULT_SETTINGS.workspace, ...serverSettings.workspace },
    editor: { ...DEFAULT_SETTINGS.editor, ...serverSettings.editor },
    ai: { ...DEFAULT_SETTINGS.ai, ...serverSettings.ai },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...serverSettings.notifications },
    storage: { ...DEFAULT_SETTINGS.storage, ...serverSettings.storage },
    shortcuts: {
      ...DEFAULT_SETTINGS.shortcuts,
      ...serverSettings.shortcuts,
    },
  };
}
