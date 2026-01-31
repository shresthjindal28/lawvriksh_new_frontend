'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  scope?: 'global' | 'editor' | 'dashboard';
  allowedRoutes?: string[]; // If specified, shortcut only works if pathname matches one of these
  allowInInputs?: boolean;
}

/**
 * Detects if the user is on a Mac
 */
export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.platform?.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Gets the modifier key based on OS (Ctrl for Windows/Linux, Cmd for Mac)
 */
export function getModifierKey(): string {
  return isMacOS() ? '⌘' : 'Ctrl';
}

/**
 * Formats a shortcut for display based on OS
 */
export function formatShortcutDisplay(shortcut: KeyboardShortcut): string {
  const isMac = isMacOS();
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcut.shiftKey) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt');
  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

/**
 * Hook to register keyboard shortcuts
 * Fixed logic for proper cross-platform support
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  const pathname = usePathname();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if typing in an input (with some exceptions)
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      for (const shortcut of shortcuts) {
        // Check key match (case-insensitive)
        if (!e.key) continue;
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        if (!keyMatches) continue;

        // Check modifier keys
        // For cross-platform: metaKey means "use the platform's primary modifier"
        // On Mac: Command (metaKey), On Windows/Linux: Ctrl
        const wantsPlatformModifier = shortcut.metaKey === true;
        const hasPlatformModifier = e.metaKey || e.ctrlKey;

        // Check individual modifiers
        const ctrlOk =
          shortcut.ctrlKey === undefined
            ? !wantsPlatformModifier || hasPlatformModifier
            : e.ctrlKey === shortcut.ctrlKey;

        const metaOk =
          shortcut.metaKey === undefined
            ? true
            : wantsPlatformModifier
              ? hasPlatformModifier
              : e.metaKey === shortcut.metaKey;

        const shiftOk =
          shortcut.shiftKey === undefined
            ? !e.shiftKey || shortcut.shiftKey === true
            : e.shiftKey === shortcut.shiftKey;

        const altOk = shortcut.altKey === undefined ? !e.altKey : e.altKey === shortcut.altKey;

        // For shortcuts without modifiers, make sure no modifier is pressed
        const hasAnyModifier =
          shortcut.metaKey || shortcut.ctrlKey || shortcut.shiftKey || shortcut.altKey;
        if (!hasAnyModifier && (e.metaKey || e.ctrlKey || e.altKey)) {
          continue;
        }

        // Check if modifiers match
        if (!metaOk || !shiftOk || !altOk) continue;

        // Check route restrictions
        if (shortcut.allowedRoutes && shortcut.allowedRoutes.length > 0) {
          const isAllowed = shortcut.allowedRoutes.some((route) => pathname?.includes(route));
          if (!isAllowed) continue;
        }

        // Shortcuts that should work even in inputs
        const isGlobalShortcut =
          (e.key.toLowerCase() === 's' && hasPlatformModifier) || // Save
          (e.key.toLowerCase() === '/' && hasPlatformModifier) || // Command palette
          (e.key.toLowerCase() === 'k' && hasPlatformModifier); // Command palette fallback

        if (isInput && !isGlobalShortcut && !shortcut.allowInInputs) continue;

        // Execute the action
        e.preventDefault();
        e.stopPropagation();
        shortcut.action();
        return; // Only execute first matching shortcut
      }
    },
    [shortcuts, pathname]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown, enabled]);
}

/**
 * Global shortcuts registry - these work across the entire application
 */
export const GLOBAL_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'k',
    metaKey: true, // Ctrl+K on Windows, Cmd+K on Mac
    action: () => {
      window.dispatchEvent(new CustomEvent('open-shortcuts-help'));
    },
    description: 'Open shortcuts help',
    scope: 'global',
  },
  {
    key: '/',
    metaKey: true, // Ctrl+/ as alternate
    action: () => {
      window.dispatchEvent(new CustomEvent('open-shortcuts-help'));
    },
    description: 'Open shortcuts help',
    scope: 'global',
  },
  {
    key: 'n',
    metaKey: true,
    action: () => {
      window.dispatchEvent(new CustomEvent('open-create-dialog'));
    },
    description: 'Create new project',
    scope: 'dashboard',
    allowedRoutes: ['/dashboard'],
  },
  {
    key: 's',
    metaKey: true,
    action: () => {
      window.dispatchEvent(new CustomEvent('save-document'));
    },
    description: 'Save current document',
    scope: 'global',
  },
  {
    key: 'f',
    metaKey: true,
    action: () => {
      const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: 'Focus search',
    scope: 'dashboard',
    allowedRoutes: ['/dashboard'],
  },
  {
    key: '1',
    metaKey: true,
    action: () => {
      window.location.href = '/dashboard';
    },
    description: 'Go to dashboard',
    scope: 'global',
  },
  {
    key: 'm',
    metaKey: true,
    shiftKey: true,
    action: () => {
      window.location.href = '/dashboard/student/reference-manager';
    },
    description: 'Open reference manager',
    scope: 'global',
  },
  {
    key: '?',
    metaKey: true,
    shiftKey: true,
    action: () => {
      window.dispatchEvent(new CustomEvent('open-shortcuts-help'));
    },
    description: 'Show keyboard shortcuts',
    scope: 'global',
  },
];
