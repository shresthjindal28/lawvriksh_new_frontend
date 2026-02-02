'use client';

import { useCallback, useMemo } from 'react';
import { LayoutDashboard, Settings2, Bot, Bell, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MobileHeader } from '@/components/common/MobileHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { formatShortcutDisplay, isMacOS } from '@/hooks/common/useKeyboardShortcuts';
import '@/styles/common-styles/settings-page.css';
// State Management
import { useSettingsUiStore } from '@/store/zustand/settingsUiStore';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/hooks/common/useSettingsQuery';
import { DEFAULT_SETTINGS } from '@/lib/utils/settingsUtils';

import {
  WorkspaceSettings,
  EditorSettings,
  NotificationSettings,
  type ToolbarShortcutSetting,
  SettingsState,
} from '@/lib/contexts/SettingsContext';

import { SkeletonLoader } from '../ui/Loader';
import { playNotificationSound } from '@/lib/utils/notificationSound';
import GoogleTranslate from '@/components/common/GoogleTranslate';

type SectionKey = 'workspace' | 'editor' | 'ai' | 'notifications';

interface NavItemConfig {
  id: SectionKey;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItemConfig[] = [
  { id: 'workspace', label: 'Workspace Preferences', icon: LayoutDashboard },
  { id: 'editor', label: 'Editor Settings', icon: Settings2 },
  { id: 'ai', label: 'AI Assistance', icon: Bot },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function Settings() {
  const { profile, logout } = useAuth();

  // Server State
  const { data: settings = DEFAULT_SETTINGS } = useSettingsQuery();
  const updateSettingsMutation = useUpdateSettingsMutation();

  // UI State (Zustand)
  const activeSection = useSettingsUiStore((state) => state.activeSection);
  const setActiveSection = useSettingsUiStore((state) => state.setActiveSection);
  const shortcutKeyInput = useSettingsUiStore((state) => state.shortcutKeyInput);
  const setShortcutKeyInput = useSettingsUiStore((state) => state.setShortcutKeyInput);
  const isEditingShortcut = useSettingsUiStore((state) => state.isEditingShortcut);
  const setIsEditingShortcut = useSettingsUiStore((state) => state.setIsEditingShortcut);

  const toolbarShortcut = settings.shortcuts.toolbarShortcut;

  // Derived State
  const isDirty = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);
  }, [settings]);

  // Actions
  const updateSettings = useCallback(
    async (section: keyof SettingsState, key: string, value: any) => {
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
    async (section: keyof SettingsState, key: string) => {
      // @ts-ignore - dynamic access
      const currentValue = settings[section][key];
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [key]: !currentValue,
        },
      };
      await updateSettingsMutation.mutateAsync(newSettings);
    },
    [settings, updateSettingsMutation]
  );

  const resetToDefault = useCallback(async () => {
    await updateSettingsMutation.mutateAsync(DEFAULT_SETTINGS);
  }, [updateSettingsMutation]);

  const updateToolbarShortcut = useCallback(
    (updates: Partial<ToolbarShortcutSetting>) => {
      void updateSettings('shortcuts', 'toolbarShortcut', {
        ...toolbarShortcut,
        ...updates,
      });
    },
    [toolbarShortcut, updateSettings]
  );

  const isMac = isMacOS();
  const modifierKeys: Array<{ key: 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'; label: string }> =
    [
      { key: 'metaKey', label: isMac ? 'Cmd (⌘)' : 'Command (⌘)' },
      { key: 'ctrlKey', label: 'Ctrl' },
      { key: 'shiftKey', label: 'Shift' },
      { key: 'altKey', label: isMac ? 'Option (⌥)' : 'Alt' },
    ];

  const handleModifierToggle = useCallback(
    (modifier: 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey') => {
      updateToolbarShortcut({
        [modifier]: !toolbarShortcut[modifier],
      });
    },
    [toolbarShortcut, updateToolbarShortcut]
  );

  const commitShortcutKey = useCallback(() => {
    const normalizedKey = shortcutKeyInput.trim().toLowerCase();
    if (!normalizedKey) {
      setShortcutKeyInput('');
      setIsEditingShortcut(false);
      return;
    }

    if (normalizedKey === toolbarShortcut.key) {
      setShortcutKeyInput('');
      setIsEditingShortcut(false);
      return;
    }

    updateToolbarShortcut({ key: normalizedKey });
    setShortcutKeyInput('');
    setIsEditingShortcut(false);
  }, [
    shortcutKeyInput,
    toolbarShortcut,
    updateToolbarShortcut,
    setShortcutKeyInput,
    setIsEditingShortcut,
  ]);

  const shortcutPreview = useMemo(
    () =>
      formatShortcutDisplay({
        ...toolbarShortcut,
        action: () => {},
        description: 'Toolbar shortcut preview',
      }),
    [toolbarShortcut]
  );

  const handleNavClick = useCallback(
    (section: SectionKey) => {
      setActiveSection(section);
      const target = document.getElementById(section);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [setActiveSection]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'workspace':
        return (
          <section
            key="workspace"
            id="workspace"
            className="settings-section"
            aria-labelledby="workspace-heading"
            aria-hidden={false}
          >
            <div className="settings-section-header">
              <h2 id="workspace-heading" className="settings-section-title">
                Workspace Preference
              </h2>
              <p className="settings-section-description">
                Choose how your workspace looks and behaves by default.
              </p>
            </div>

            <div className="settings-card-grid-logout">
              <ToggleControl
                label="Auto-save"
                description="Automatically save documents while you edit."
                checked={settings.workspace.autoSave}
                onChange={() => toggleSetting('workspace', 'autoSave')}
              />

              <div className="settings-field">
                <label className="settings-field__label">Language</label>
                <div style={{ width: '100%' }}>
                  <GoogleTranslate dropdownPosition="bottom" />
                </div>
              </div>

              <button type="button" className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </section>
        );

      case 'editor':
        return (
          <section
            key="editor"
            id="editor"
            className="settings-section"
            aria-labelledby="editor-heading"
            aria-hidden={false}
          >
            <div className="settings-section-header">
              <h2 id="editor-heading" className="settings-section-title">
                Editor Settings
              </h2>
              <p className="settings-section-description">
                Configure how the writing editor behaves while you work.
              </p>
            </div>

            <div className="settings-card-grid">
              <div style={{ width: '100%' }}>
                <div
                  style={{
                    backgroundColor: 'var(--lv-bg-white, #fff)',
                    borderRadius: '16px',
                    border: '1px solid #e5e7eb',
                    padding: '24px',
                    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
                  }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <h3 className="settings-section-title" style={{ margin: 0, fontSize: '20px' }}>
                      Toolbar shortcut
                    </h3>
                    <p
                      className="settings-section-description"
                      style={{ margin: '8px 0 0', color: '#475569' }}
                    >
                      Set your preferred modifier key combo for opening the toolbar shortcut dialog.
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                      marginBottom: '16px',
                    }}
                  >
                    <input
                      type="text"
                      aria-label="Toolbar shortcut key"
                      value={isEditingShortcut ? shortcutKeyInput : toolbarShortcut.key}
                      onChange={(event) => setShortcutKeyInput(event.target.value)}
                      onFocus={() => {
                        setIsEditingShortcut(true);
                        setShortcutKeyInput(toolbarShortcut.key);
                      }}
                      onBlur={commitShortcutKey}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          commitShortcutKey();
                        }
                      }}
                      placeholder="t"
                      style={{
                        minWidth: '80px',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5f5',
                        fontSize: '15px',
                        fontWeight: 500,
                        backgroundColor: '#f8fafc',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      {modifierKeys.map((modifier) => (
                        <label
                          key={modifier.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            borderRadius: '999px',
                            border: toolbarShortcut[modifier.key]
                              ? '1px solid #2563eb'
                              : '1px solid #d1d5db',
                            fontSize: '13px',
                            cursor: 'pointer',
                            backgroundColor: toolbarShortcut[modifier.key] ? '#ebf2ff' : '#f8fafc',
                            color: toolbarShortcut[modifier.key] ? '#1e3a8a' : '#475569',
                            fontWeight: toolbarShortcut[modifier.key] ? 600 : 400,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={toolbarShortcut[modifier.key]}
                            onChange={() => handleModifierToggle(modifier.key)}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '12px' }}>{modifier.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
                      Current shortcut
                    </span>
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: '999px',
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {shortcutPreview}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'ai':
        return (
          <section
            key="ai"
            id="ai"
            className="settings-section"
            aria-labelledby="ai-heading"
            aria-hidden={false}
          >
            <div className="settings-section-header">
              <h2 id="ai-heading" className="settings-section-title">
                AI Assistance
              </h2>
              <p className="settings-section-description">
                Enable intelligent checks that support your legal writing workflow.
              </p>
            </div>

            <div className="settings-card-grid">
              <ToggleControl
                label="Smart Key Point Suggestion"
                description="Get intelligent key points and drafting suggestions while your write."
                checked={settings.ai.smartKeyPointSuggestion}
                onChange={() => toggleSetting('ai', 'smartKeyPointSuggestion')}
              />
              <ToggleControl
                label="Citation Recommendations"
                description="Highlight unsupported statements and suggest references."
                checked={settings.ai.citationRecommendations}
                onChange={() => toggleSetting('ai', 'citationRecommendations')}
              />
              <ToggleControl
                label="Compliance Checker"
                description="Detect compliance gaps and suggest safer alternatives."
                checked={settings.ai.complianceChecker}
                onChange={() => toggleSetting('ai', 'complianceChecker')}
              />
              <ToggleControl
                label="Argument Logic Checker"
                description="Spot logical inconsistencies and strengthen your reasoning."
                checked={settings.ai.argumentLogicChecker}
                onChange={() => toggleSetting('ai', 'argumentLogicChecker')}
              />
            </div>
          </section>
        );
      case 'notifications':
        return (
          <section
            key="notifications"
            id="notifications"
            className="settings-section"
            aria-labelledby="notifications-heading"
            aria-hidden={false}
          >
            <div className="settings-section-header">
              <h2 id="notifications-heading" className="settings-section-title">
                Notifications
              </h2>
              <p className="settings-section-description">
                Manage how notification feedback is delivered across the workspace.
              </p>
            </div>

            <div className="settings-card-grid">
              <ToggleControl
                label="Sound alerts"
                description="Play a short sound when notes are created or uploads succeed."
                checked={settings.notifications.soundEnabled}
                onChange={() => {
                  if (!settings.notifications.soundEnabled) {
                    void playNotificationSound(settings.notifications.soundChoice);
                  }
                  void toggleSetting('notifications', 'soundEnabled');
                }}
              />
              <div className="settings-field">
                <label htmlFor="sound-choice" className="settings-field__label">
                  Sound choice
                </label>
                <select
                  id="sound-choice"
                  className="settings-select"
                  value={settings.notifications.soundChoice}
                  onChange={(event) => {
                    const value = event.target.value as NotificationSettings['soundChoice'];
                    void updateSettings('notifications', 'soundChoice', value);
                    if (settings.notifications.soundEnabled) {
                      void playNotificationSound(value);
                    }
                  }}
                >
                  <option value="chime">Chime</option>
                  <option value="ping">Ping</option>
                  <option value="soft">Soft</option>
                </select>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (!profile) {
    return (
      <main className="main-container settings-main">
        <div className="page-wrapper">
          <section className="content-section">
            <div className="settings-layout">
              <aside className="settings-nav">
                {[1, 2, 3].map((i) => (
                  <SkeletonLoader key={i} height="40px" style={{ marginBottom: '8px' }} />
                ))}
              </aside>
              <div className="settings-content">
                <div className="settings-page-header">
                  <SkeletonLoader height="32px" width="150px" style={{ marginBottom: '8px' }} />
                  <SkeletonLoader height="20px" width="300px" />
                </div>
                <div className="settings-card-grid">
                  {[1, 2, 3].map((i) => (
                    <SkeletonLoader key={i} height="80px" style={{ borderRadius: '12px' }} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="main-container settings-main">
      <MobileHeader />
      <div className="page-wrapper">
        <section className="content-section">
          <div className="settings-layout">
            <aside className="settings-nav" aria-label="Settings sections">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`settings-nav__link ${activeSection === id ? 'settings-nav__link--active' : ''}`}
                  onClick={() => handleNavClick(id)}
                  aria-current={activeSection === id}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </aside>

            <div className="settings-content">
              <header className="settings-page-header">
                <div>
                  <h1 className="settings-page-title">Settings</h1>
                  <p className="settings-page-description">
                    Fine-tune your workspace preferences, editor behaviour, and AI assistance.
                  </p>
                </div>
                <button
                  type="button"
                  className="settings-reset"
                  onClick={resetToDefault}
                  disabled={!isDirty}
                >
                  <RotateCcw size={16} />
                  <span>Reset to Default</span>
                </button>
              </header>

              <div className="settings-section-stack">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderCurrentSection()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface ToggleControlProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleControl({ label, description, checked, onChange }: ToggleControlProps) {
  return (
    <div className="settings-toggle">
      <div className="settings-toggle__info">
        <span className="settings-toggle__label">{label}</span>
        {description ? <p className="settings-toggle__description">{description}</p> : null}
      </div>
      <label className="settings-toggle__switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="settings-toggle__slider" aria-hidden="true" />
      </label>
    </div>
  );
}
