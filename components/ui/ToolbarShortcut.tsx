'use client';

import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Search } from 'lucide-react';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { formatShortcutDisplay, type KeyboardShortcut } from '@/hooks/common/useKeyboardShortcuts';
import type { AnalysisShortcutActions } from '@/types/analysis-sidebar';
import {
  useToolbarActions,
  CATEGORY_LABELS,
  type ToolbarActionCategory,
} from '@/hooks/common/useToolbarActions';

interface ToolbarShortcutProps {
  editor: Editor | null;
  onCite?: () => void;
  onAi?: (e?: React.MouseEvent) => void;
  onToggleVariables?: () => void;
  analysisActions?: AnalysisShortcutActions | null;
}

export function ToolbarShortcut({
  editor,
  onAi,
  onCite,
  onToggleVariables,
  analysisActions,
}: ToolbarShortcutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { settings } = useSettings();

  const toolbarShortcutSetting = settings.shortcuts.toolbarShortcut;

  const shortcutForDisplay: KeyboardShortcut = {
    key: toolbarShortcutSetting.key,
    ctrlKey: toolbarShortcutSetting.ctrlKey,
    metaKey: toolbarShortcutSetting.metaKey,
    altKey: toolbarShortcutSetting.altKey,
    shiftKey: toolbarShortcutSetting.shiftKey,
    action: () => {},
    description: 'Open toolbar shortcut',
  };

  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('open-toolbar-shortcut-dialog', handleOpenEvent);
    return () => window.removeEventListener('open-toolbar-shortcut-dialog', handleOpenEvent);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    searchInputRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const { groupedActions, hasActions } = useToolbarActions({
    editor,
    onAi,
    onCite,
    onToggleVariables,
    analysisActions,
    searchQuery,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        padding: '20px',
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: '18px',
          backgroundColor: '#fff',
          boxShadow: '0 40px 80px rgba(15, 23, 42, 0.25)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '8px',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
              }}
            >
              Toolbar shortcut
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: '14px',
                color: '#475569',
              }}
            >
              Search for the tool you need.
            </p>
          </div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#0f172a',
              backgroundColor: '#f1f5f9',
              padding: '4px 10px',
              borderRadius: '999px',
            }}
          >
            {formatShortcutDisplay(shortcutForDisplay)}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#f8fafc',
            borderRadius: '10px',
            padding: '8px 12px',
          }}
        >
          <Search size={16} color="#94a3b8" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search tools..."
            style={{
              border: 'none',
              width: '100%',
              outline: 'none',
              fontSize: '15px',
              backgroundColor: 'transparent',
              color: '#0f172a',
            }}
          />
        </div>

        <div
          style={{
            maxHeight: '360px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {hasActions ? (
            (Object.keys(CATEGORY_LABELS) as ToolbarActionCategory[]).map((category) => {
              const actions = groupedActions[category];
              if (!actions || actions.length === 0) {
                return null;
              }
              return (
                <section key={category}>
                  <p
                    style={{
                      margin: '0 0 6px',
                      fontSize: '12px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#94a3b8',
                    }}
                  >
                    {CATEGORY_LABELS[category]}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => {
                          action.action();
                          setIsOpen(false);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            backgroundColor: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {action.icon}
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '15px',
                              fontWeight: 500,
                              color: '#0f172a',
                            }}
                          >
                            {action.label}
                          </span>
                          <span
                            style={{
                              fontSize: '13px',
                              color: '#64748b',
                            }}
                          >
                            {action.description}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <p
              style={{
                margin: 0,
                textAlign: 'center',
                fontSize: '14px',
                color: '#64748b',
              }}
            >
              No matching tools found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ToolbarShortcut;
