/**
 * Hook to access and apply application settings
 * This hook provides easy access to settings that affect different parts of the app
 */

import { useSettings } from '@/lib/contexts/SettingsContext';

export function useAppSettings() {
  const { settings } = useSettings();

  return {
    // Workspace settings
    defaultView: settings.workspace.defaultView,
    autoSave: settings.workspace.autoSave,
    theme: settings.workspace.theme,

    // Editor settings
    editorFontSize: settings.editor.fontSize,
    isSpellCheckEnabled: settings.editor.spellCheck,
    isGrammarCheckEnabled: settings.editor.grammarCheck,
    citationFormat: settings.editor.citationFormat,

    // AI Assistance settings
    isSmartKeyPointSuggestionEnabled: settings.ai.smartKeyPointSuggestion,

    // Notification settings
    isInAppNotificationsEnabled: settings.notifications.inApp,
    isTaskAlertsEnabled: settings.notifications.taskAlerts,
    isSoundEnabled: settings.notifications.soundEnabled,
    soundChoice: settings.notifications.soundChoice,

    // Storage settings
    storageUsed: settings.storage.uploadLimit.used,
    storageTotal: settings.storage.uploadLimit.total,
    trashAutoDelete: settings.storage.trashAutoDelete,

    // All settings
    allSettings: settings,
  };
}
