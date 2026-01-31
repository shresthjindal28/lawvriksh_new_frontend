'use client';

import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard } from 'lucide-react';
import {
  GLOBAL_SHORTCUTS,
  isMacOS,
  formatShortcutDisplay,
  getModifierKey,
  type KeyboardShortcut,
} from '@/hooks/common/useKeyboardShortcuts';

const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: 9999,
  },
  modalWrapper: {
    position: 'fixed' as const,
    inset: 0,
    margin: 'auto',
    width: '100%',
    maxWidth: '640px',
    height: 'fit-content',
    zIndex: 10000,
    padding: '0 16px',
    pointerEvents: 'none' as const, // Wrapper ignores clicks (passed to backdrop), but children (modal content) recapture them
  },
  command: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    height: 'auto',
    maxHeight: '400px',
    display: 'flex',
    flexDirection: 'column' as const,
    pointerEvents: 'auto' as const, // Re-enable clicks for the modal content
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    padding: '0 16px',
    height: '56px',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    backgroundColor: 'transparent',
    color: '#111827',
    padding: '16px 0',
    marginLeft: '12px',
  },
  escBadge: {
    padding: '2px 8px',
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontFamily: 'monospace',
    border: '1px solid #e5e7eb',
  },
  list: {
    maxHeight: '344px',
    overflowY: 'auto' as const,
    padding: '8px',
  },
  groupHeading: {
    padding: '8px 8px 8px 12px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '8px',
    cursor: 'default',
    color: '#374151',
    fontSize: '14px',
    userSelect: 'none' as const,
    transition: 'background-color 0.15s ease',
  },
  itemSelected: {
    backgroundColor: '#f3f4f6',
  },
  shortcutKeys: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  key: {
    padding: '2px 6px',
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    fontFamily: 'monospace',
    border: '1px solid #e5e7eb',
    minWidth: '20px',
    textAlign: 'center' as const,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    fontSize: '12px',
    color: '#6b7280',
  },
  footerGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  footerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Listen for open event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-shortcuts-help', handler);
    return () => window.removeEventListener('open-shortcuts-help', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Group shortcuts by scope
  const groupedShortcuts = GLOBAL_SHORTCUTS.reduce(
    (acc, shortcut) => {
      const scope = shortcut.scope || 'global';
      if (!acc[scope]) acc[scope] = [];
      acc[scope].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>
  );

  const scopeNames: Record<string, string> = {
    global: 'Global Shortcuts',
    editor: 'Editor Shortcuts',
    dashboard: 'Dashboard Shortcuts',
  };

  const modKey = getModifierKey();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={modalStyles.overlay}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={modalStyles.modalWrapper}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <Command
              style={modalStyles.command}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setOpen(false);
                }
              }}
              label="Keyboard shortcuts"
            >
              {/* Header / Search */}
              <div style={modalStyles.header}>
                <Keyboard size={18} color="#9ca3af" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search shortcuts..."
                  style={modalStyles.input}
                  autoFocus
                />
                <span style={modalStyles.escBadge}>ESC</span>
              </div>

              {/* List */}
              <Command.List style={modalStyles.list}>
                <Command.Empty
                  style={{
                    padding: '32px 0',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#6b7280',
                  }}
                >
                  No shortcuts found.
                </Command.Empty>

                {Object.entries(groupedShortcuts).map(([scope, shortcuts]) => (
                  <Command.Group
                    key={scope}
                    heading={scopeNames[scope] || scope}
                    style={{ marginBottom: '8px' }}
                  >
                    {/* We need to inject styles for cmdk group heading via global CSS or style tag usually, 
                        but effectively we can also render custom headers if not using strict cmdk styling.
                        cmdk default styles might interfere, but here we provide inline styles.
                        Note: cmdk handles grouping internally.
                    */}
                    <div style={modalStyles.groupHeading}>{scopeNames[scope] || scope}</div>
                    {shortcuts.map((shortcut, idx) => (
                      <CommandItem key={`${scope}-${idx}`} shortcut={shortcut} />
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div style={modalStyles.footer}>
                <div style={modalStyles.footerGroup}>
                  <span style={modalStyles.footerItem}>
                    <span style={modalStyles.key}>↑↓</span>
                    <span>Navigate</span>
                  </span>
                  <span style={modalStyles.footerItem}>
                    <span style={modalStyles.key}>ESC</span>
                    <span>Close</span>
                  </span>
                </div>
                <div style={modalStyles.footerGroup}>
                  <span style={modalStyles.footerItem}>
                    <span>Pro tip: Press</span>
                    <span style={modalStyles.key}>{modKey}+K</span>
                    <span>to view this anytime</span>
                  </span>
                </div>
              </div>
            </Command>
          </motion.div>
          {/* Style hack for cmdk items data-selected attribute since inline styles can't easily target pseudo-selectors/attributes without CSS-in-JS library */}
          <style jsx global>{`
            [cmdk-group-heading] {
              display: none;
            }
            [cmdk-item] {
              content-visibility: auto;
              cursor: pointer;
              border-radius: 8px;
              padding: 10px 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: #374151;
            }
            [cmdk-item][data-selected='true'] {
              background-color: #f3f4f6;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}

// Separate component to handle item rendering
function CommandItem({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <Command.Item
      value={`${shortcut.description} ${formatShortcutDisplay(shortcut)}`}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: '14px', color: '#374151' }}>{shortcut.description}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            padding: '2px 6px',
            fontSize: '12px',
            color: '#6b7280',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            fontFamily: 'monospace',
            minWidth: '24px',
            textAlign: 'center',
          }}
        >
          {formatShortcutDisplay(shortcut)}
        </span>
      </div>
    </Command.Item>
  );
}
