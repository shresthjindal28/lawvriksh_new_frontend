'use client';

import { useCallback, useMemo } from 'react';
import { LayoutDashboard, Settings2, Bot, Bell, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MobileHeader } from '@/components/common/MobileHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { formatShortcutDisplay, isMacOS } from '@/hooks/common/useKeyboardShortcuts';
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
            className="pt-[clamp(1.8rem,2.7vh,2.25rem)] pb-[clamp(12rem,18vh,15rem)] border-t border-[#f1f5f9] overflow-visible first-of-type:pt-0 first-of-type:border-t-0"
            aria-labelledby="workspace-heading"
            aria-hidden={false}
          >
            <div className="mb-[clamp(1.4rem,2vh,1.75rem)]">
              <h2 id="workspace-heading" className="text-[clamp(1.25rem,1.75vw,1.45rem)] font-medium text-[#0f172a] mb-[clamp(0.4rem,0.6vh,0.5rem)]">
                Workspace Preference
              </h2>
              <p className="text-[#64748b] text-[clamp(0.87rem,1.2vw,0.95rem)] max-w-[clamp(28rem,38vw,34rem)]">
                Choose how your workspace looks and behaves by default.
              </p>
            </div>

            <div className="flex flex-col gap-[clamp(1.2rem,1.8vw,1.5rem)] overflow-visible">
              <ToggleControl
                label="Auto-save"
                description="Automatically save documents while you edit."
                checked={settings.workspace.autoSave}
                onChange={() => toggleSetting('workspace', 'autoSave')}
              />

              <div className="flex flex-col gap-[clamp(0.5rem,0.7vw,0.6rem)]">
                <label className="font-medium text-[#0f172a] text-[clamp(0.87rem,1.2vw,0.95rem)]">Language</label>
                <div style={{ width: '100%' }}>
                  <GoogleTranslate dropdownPosition="bottom" />
                </div>
              </div>

              <button
                type="button"
                className="w-[clamp(90px,11vw,100px)] h-[clamp(36px,4.8vh,40px)] px-[clamp(0.85rem,1.2vw,1rem)] py-[clamp(0.15rem,0.24vh,0.2rem)] rounded-[clamp(4px,0.6vw,5px)] border border-white bg-black text-white text-[clamp(0.8rem,1.05vw,0.85rem)] font-medium cursor-pointer transition-colors duration-150"
                onClick={handleLogout}
              >
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
            className="pt-[clamp(1.8rem,2.7vh,2.25rem)] pb-[clamp(12rem,18vh,15rem)] border-t border-[#f1f5f9] overflow-visible first-of-type:pt-0 first-of-type:border-t-0"
            aria-labelledby="editor-heading"
            aria-hidden={false}
          >
            <div className="mb-[clamp(1.4rem,2vh,1.75rem)]">
              <h2 id="editor-heading" className="text-[clamp(1.25rem,1.75vw,1.45rem)] font-medium text-[#0f172a] mb-[clamp(0.4rem,0.6vh,0.5rem)]">
                Editor Settings
              </h2>
              <p className="text-[#64748b] text-[clamp(0.87rem,1.2vw,0.95rem)] max-w-[clamp(28rem,38vw,34rem)]">
                Configure how the writing editor behaves while you work.
              </p>
            </div>

            <div className="grid gap-[clamp(1.2rem,1.8vw,1.5rem)] grid-cols-[repeat(auto-fit,minmax(clamp(240px,28vw,260px),1fr))] overflow-visible">
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
                    <h3 className="text-[clamp(1.25rem,1.75vw,1.45rem)] font-medium text-[#0f172a] mb-[clamp(0.4rem,0.6vh,0.5rem)]" style={{ margin: 0, fontSize: '20px' }}>
                      Toolbar shortcut
                    </h3>
                    <p
                      className="text-[#64748b] text-[clamp(0.87rem,1.2vw,0.95rem)] max-w-[clamp(28rem,38vw,34rem)]"
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
            className="pt-[clamp(1.8rem,2.7vh,2.25rem)] pb-[clamp(12rem,18vh,15rem)] border-t border-[#f1f5f9] overflow-visible first-of-type:pt-0 first-of-type:border-t-0"
            aria-labelledby="ai-heading"
            aria-hidden={false}
          >
            <div className="mb-[clamp(1.4rem,2vh,1.75rem)]">
              <h2 id="ai-heading" className="text-[clamp(1.25rem,1.75vw,1.45rem)] font-medium text-[#0f172a] mb-[clamp(0.4rem,0.6vh,0.5rem)]">
                AI Assistance
              </h2>
              <p className="text-[#64748b] text-[clamp(0.87rem,1.2vw,0.95rem)] max-w-[clamp(28rem,38vw,34rem)]">
                Enable intelligent checks that support your legal writing workflow.
              </p>
            </div>

            <div className="grid gap-[clamp(1.2rem,1.8vw,1.5rem)] grid-cols-[repeat(auto-fit,minmax(clamp(240px,28vw,260px),1fr))] overflow-visible">
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
            className="pt-[clamp(1.8rem,2.7vh,2.25rem)] pb-[clamp(12rem,18vh,15rem)] border-t border-[#f1f5f9] overflow-visible first-of-type:pt-0 first-of-type:border-t-0"
            aria-labelledby="notifications-heading"
            aria-hidden={false}
          >
            <div className="mb-[clamp(1.4rem,2vh,1.75rem)]">
              <h2 id="notifications-heading" className="text-[clamp(1.25rem,1.75vw,1.45rem)] font-medium text-[#0f172a] mb-[clamp(0.4rem,0.6vh,0.5rem)]">
                Notifications
              </h2>
              <p className="text-[#64748b] text-[clamp(0.87rem,1.2vw,0.95rem)] max-w-[clamp(28rem,38vw,34rem)]">
                Manage how notification feedback is delivered across the workspace.
              </p>
            </div>

            <div className="grid gap-[clamp(1.2rem,1.8vw,1.5rem)] grid-cols-[repeat(auto-fit,minmax(clamp(240px,28vw,260px),1fr))] overflow-visible">
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
              <div className="flex flex-col gap-[clamp(0.5rem,0.7vw,0.6rem)]">
                <label htmlFor="sound-choice" className="font-medium text-[#0f172a] text-[clamp(0.87rem,1.2vw,0.95rem)]">
                  Sound choice
                </label>
                <select
                  id="sound-choice"
                  className="appearance-none py-[clamp(0.6rem,0.85vh,0.7rem)] pl-[clamp(0.7rem,1vw,0.85rem)] pr-[clamp(2.2rem,3vw,2.5rem)] rounded-[clamp(6px,0.9vw,8px)] border-[1.5px] border-[#d1d5db] bg-[#ffffff] text-[#0f172a] text-[clamp(0.87rem,1.2vw,0.95rem)] font-medium cursor-pointer transition-all duration-200 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23475569%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22></polyline></svg>')] bg-no-repeat bg-[right_clamp(0.6rem,0.85vw,0.7rem)_center] bg-[size:clamp(16px,2.1vw,18px)_clamp(16px,2.1vw,18px)] hover:border-[#9ca3af] hover:bg-[#f9fafb] focus:outline-none focus:border-[#111827] focus:ring-[3px] focus:ring-[#111827]/10 focus:bg-[#ffffff]"
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
      <main className="min-h-screen">
        <div className="w-full h-full">
          <section className="font-sans antialiased text-[#0f172a]">
            <div className="grid grid-cols-1 lg:grid-cols-[clamp(240px,18vw,260px)_1fr] gap-[clamp(1.5rem,2.5vw,2rem)] p-[clamp(1.4rem,2.1vw,1.75rem)] lg:p-[clamp(1.5rem,2.5vw,2rem)_clamp(2rem,3vw,2.5rem)_clamp(3rem,5vh,4rem)]">
              <aside className="static flex flex-row overflow-x-auto p-[clamp(0.85rem,1.2vw,1rem)] bg-[#ffffff] rounded-[clamp(10px,1.4vw,12px)] border border-[#d1d5db] lg:sticky lg:top-[clamp(5rem,7vh,6rem)] lg:flex-col lg:overflow-visible lg:self-start lg:gap-[clamp(0.4rem,0.6vw,0.5rem)] lg:p-[clamp(1.2rem,1.8vw,1.5rem)_clamp(0.8rem,1.2vw,1rem)]">
                {[1, 2, 3].map((i) => (
                  <SkeletonLoader key={i} height="40px" style={{ marginBottom: '8px' }} />
                ))}
              </aside>
              <div className="bg-[#ffffff] rounded-[clamp(12px,1.8vw,16px)] border border-[#d1d5db] padding-[clamp(1.6rem,2.4vw,2rem)] lg:padding-[clamp(2rem,3vw,2.5rem)] overflow-x-hidden relative">
                <div className="flex flex-col items-start gap-[clamp(1.2rem,1.8vw,1.5rem)] mb-[clamp(2rem,3vh,2.5rem)] lg:flex-row lg:items-start lg:justify-between">
                  <SkeletonLoader height="32px" width="150px" style={{ marginBottom: '8px' }} />
                  <SkeletonLoader height="20px" width="300px" />
                </div>
                <div className="grid gap-[clamp(1.2rem,1.8vw,1.5rem)] grid-cols-[repeat(auto-fit,minmax(clamp(240px,28vw,260px),1fr))] overflow-visible">
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
    <main className="min-h-screen">
      <MobileHeader />
      <div className="w-full h-full">
        <section className="font-sans antialiased text-[#0f172a]">
          <div className="grid grid-cols-1 lg:grid-cols-[clamp(240px,18vw,260px)_1fr] gap-[clamp(1.5rem,2.5vw,2rem)] p-[clamp(1.4rem,2.1vw,1.75rem)] lg:p-[clamp(1.5rem,2.5vw,2rem)_clamp(2rem,3vw,2.5rem)_clamp(3rem,5vh,4rem)]">
            <aside className="static flex flex-row overflow-x-auto p-[clamp(0.85rem,1.2vw,1rem)] bg-[#ffffff] rounded-[clamp(10px,1.4vw,12px)] border border-[#d1d5db] lg:sticky lg:top-[clamp(5rem,7vh,6rem)] lg:flex-col lg:overflow-visible lg:self-start lg:gap-[clamp(0.4rem,0.6vw,0.5rem)] lg:p-[clamp(1.2rem,1.8vw,1.5rem)_clamp(0.8rem,1.2vw,1rem)]" aria-label="Settings sections">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`group flex items-center gap-[clamp(0.6rem,0.9vw,0.75rem)] px-[clamp(0.7rem,1vw,0.85rem)] py-[clamp(0.55rem,0.8vw,0.65rem)] border-none bg-transparent rounded-[clamp(6px,0.9vw,8px)] text-[#475569] text-[clamp(0.87rem,1.2vw,0.95rem)] font-medium cursor-pointer transition-colors duration-200 text-left decoration-0 hover:bg-slate-900/5 hover:text-[#1f2937] ${activeSection === id ? '!bg-[#111827] !text-white' : ''}`}
                  onClick={() => handleNavClick(id)}
                  aria-current={activeSection === id}
                >
                  <Icon size={18} className={`text-[#94a3b8] group-hover:text-[#1f2937] ${activeSection === id ? '!text-white' : ''}`} />
                  <span>{label}</span>
                </button>
              ))}
            </aside>

            <div className="bg-[#ffffff] rounded-[clamp(12px,1.8vw,16px)] border border-[#d1d5db] p-[clamp(1.6rem,2.4vw,2rem)] lg:p-[clamp(2rem,3vw,2.5rem)] overflow-x-hidden relative">
              <header className="flex flex-col items-start gap-[clamp(1.2rem,1.8vw,1.5rem)] mb-[clamp(2rem,3vh,2.5rem)] lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="font-[family-name:var(--font-playfair),serif] text-[clamp(1.6rem,2.4vw,2rem)] font-medium text-[#0f172a] mb-[clamp(0.3rem,0.4vh,0.35rem)]">Settings</h1>
                  <p className="text-[#64748b] text-[clamp(0.87rem,1.2vw,0.95rem)] max-w-[clamp(24rem,32vw,28rem)]">
                    Fine-tune your workspace preferences, editor behaviour, and AI assistance.
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-[clamp(0.4rem,0.6vw,0.5rem)] px-[clamp(0.6rem,0.85vw,0.7rem)] py-[clamp(0.5rem,0.7vh,0.6rem)] rounded-full border border-[#d1d5db] bg-[#ffffff] text-[#0f172a] text-[clamp(0.6rem,0.8vw,0.65rem)] font-medium cursor-pointer transition-colors duration-150 hover:border-[#9ca3af] hover:bg-[#f9fafb] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#d1d5db] disabled:hover:bg-[#ffffff]"
                  onClick={resetToDefault}
                  disabled={!isDirty}
                >
                  <RotateCcw size={16} />
                  <span>Reset to Default</span>
                </button>
              </header>

              <div className="relative grid gap-0">
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
    <div className="flex items-center justify-between p-[clamp(0.85rem,1.2vh,1rem)_clamp(0.95rem,1.3vw,1.1rem)] border border-[#d1d5db] rounded-[clamp(10px,1.4vw,12px)] bg-[#ffffff] w-fit">
      <div className="flex flex-col gap-[clamp(0.3rem,0.42vh,0.35rem)] mr-[clamp(0.85rem,1.2vw,1rem)]">
        <span className="font-medium text-[#0f172a]">{label}</span>
        {description ? <p className="text-[clamp(0.8rem,1.05vw,0.85rem)] text-[#64748b] max-w-[clamp(16rem,21vw,18rem)]">{description}</p> : null}
      </div>
      <label className="relative w-[50px] h-[24px] cursor-pointer inline-block box-border">
        <input type="checkbox" checked={checked} onChange={onChange} className="opacity-0 w-0 h-0 absolute" />
        <span className="absolute cursor-pointer inset-0 bg-[#ccc] transition-[0.3s] rounded-[24px] border-2 border-black box-border before:absolute before:content-[''] before:h-[16px] before:w-[16px] before:left-[2px] before:top-1/2 before:-translate-y-1/2 before:bg-black before:transition-[0.3s] before:rounded-full before:z-[2] peer-checked:bg-black peer-checked:border-black peer-checked:before:bg-white peer-checked:before:translate-x-[26px]" aria-hidden="true" />
        <span className={`absolute cursor-pointer inset-0 transition-[0.3s] rounded-[24px] border-2 border-black box-border before:absolute before:content-[''] before:h-[16px] before:w-[16px] before:left-[2px] before:top-1/2 before:-translate-y-1/2 before:bg-black before:transition-[0.3s] before:rounded-full before:z-[2] ${checked ? '!bg-black !border-black before:!bg-white before:!translate-x-[26px]' : '!bg-[#ccc]'}`}></span>
      </label>
    </div>
  );
}
