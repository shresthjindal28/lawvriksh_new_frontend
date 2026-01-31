'use client';

import { useMemo } from 'react';
import {
  useKeyboardShortcuts,
  GLOBAL_SHORTCUTS,
  type KeyboardShortcut,
} from '@/hooks/common/useKeyboardShortcuts';
import { useSettings } from '@/lib/contexts/SettingsContext';

/**
 * Provider component that registers all global keyboard shortcuts
 * This should be placed in the root layout to enable shortcuts across the app
 */
export function GlobalShortcutsProvider({ children }: { children?: React.ReactNode }) {
  const { settings } = useSettings();
  const toolbarShortcutSetting = settings.shortcuts.toolbarShortcut;

  const toolbarShortcut = useMemo<KeyboardShortcut | null>(() => {
    if (!toolbarShortcutSetting?.key) return null;
    return {
      key: toolbarShortcutSetting.key,
      ctrlKey: toolbarShortcutSetting.ctrlKey,
      metaKey: toolbarShortcutSetting.metaKey,
      altKey: toolbarShortcutSetting.altKey,
      shiftKey: toolbarShortcutSetting.shiftKey,
      allowInInputs: true,
      action: () => {
        window.dispatchEvent(new CustomEvent('open-toolbar-shortcut-dialog'));
      },
      description: 'Open toolbar shortcut dialog',
      scope: 'global',
    };
  }, [toolbarShortcutSetting]);

  const shortcuts = useMemo(() => {
    if (toolbarShortcut) {
      return [...GLOBAL_SHORTCUTS, toolbarShortcut];
    }
    return GLOBAL_SHORTCUTS;
  }, [toolbarShortcut]);

  useKeyboardShortcuts(shortcuts, true);

  return <>{children}</>;
}
