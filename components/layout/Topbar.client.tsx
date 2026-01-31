'use client';

import {
  Search,
  SpellCheck,
  Trash2,
  MoreVertical,
  Moon,
  History,
  Upload,
  Trash,
  Save,
  ChevronDown,
  RefreshCw,
  Menu,
} from 'lucide-react';
import '@/styles/common-styles/top-bar.css';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProgressBadge from '../ui/ProgressBadge';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/contexts/ToastContext';
// import { ExportDialog } from '../student/ExportDialog.tsx';
import DropdownPortal from '../ui/dropdown-portal';
import { DocumentType, ExportOptions } from '@/types/project';
import Image from 'next/image';
import { useMobileSidebar } from '@/lib/contexts/MobileSidebarContext';

type TopbarMode = 'default' | 'search';

interface TopbarProps {
  mode?: TopbarMode;
  role?: string;
  logoText?: string;
  onTrashClick?: (projectId: string) => void;
  projectId?: string;
  onButtonClick?: () => void;
  buttonText?: string;
  profileScore?: number;
  isGrammerSpellCheckOn?: boolean;
  setisGrammerSpellCheckOn?: Dispatch<SetStateAction<boolean>>;
  showPrimaryButton?: boolean;
  toolbar?: React.ReactNode;
  onMenuAction?: (action: string) => void;
  isExportOpen?: boolean;
  setIsExportOpen?: Dispatch<SetStateAction<boolean>>;
  templateType?: DocumentType;
  isExporting?: boolean;
  handleExport?: (options: ExportOptions) => void;
  updateProjectData?: (data: any) => Promise<void>;
  onGetLatestData?: () => Promise<any | null>;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  lastSavedTime?: Date | null;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
  projectTitle?: string;
}

// Hamburger button for mobile sidebar toggle
function HamburgerButton() {
  const { toggle } = useMobileSidebar();

  return (
    <button className="topbar-hamburger" onClick={toggle} aria-label="Toggle menu" type="button">
      <Menu size={20} />
    </button>
  );
}

export function Topbar({
  mode = 'default',
  role,
  logoText = 'LawVriksh',
  onTrashClick,
  projectId,
  onButtonClick,
  buttonText = 'Switch to Blog',
  profileScore,
  isGrammerSpellCheckOn,
  setisGrammerSpellCheckOn,
  showPrimaryButton = true,
  toolbar,
  onMenuAction,
  // isExportOpen, - Removed
  // setIsExportOpen, - Removed
  // templateType, - Removed
  // isExporting, - Removed
  // handleExport, - Removed
  updateProjectData,
  onGetLatestData,
  searchPlaceholder = 'Search...',
  searchQuery = '',
  onSearchChange,
  lastSavedTime,
  autoSaveEnabled = true,
  onToggleAutoSave,
  projectTitle: projectTitleProp,
  centerContent,
}: TopbarProps & { centerContent?: React.ReactNode }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documentTitle, setDocumentTitle] = useState<string>(projectTitleProp || '');
  const menuRef = useRef<HTMLDivElement | null>(null);

  // New state for Export Dropdown
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [hoveredExportItem, setHoveredExportItem] = useState<string | null>(null);
  const [exportButtonPos, setExportButtonPos] = useState({ top: 0, left: 0 });

  // Sync projectTitleProp with documentTitle - intentionally only syncing when projectTitleProp changes
  useEffect(() => {
    if (projectTitleProp) {
      setDocumentTitle(projectTitleProp);
    }
  }, [projectTitleProp]);

  const handleExportAction = (format: 'pdf' | 'docx') => {
    setIsExportDropdownOpen(false);
    onMenuAction?.(`export-${format}`);
  };

  const handleGrammerSpellCheckOn = useCallback(() => {
    try {
      if (setisGrammerSpellCheckOn) {
        setisGrammerSpellCheckOn((prev) => !prev);
      }
    } catch (error) {
      addToast('Unable to Turn on Grammer and SpellCheck', 'error');
    }
  }, [addToast, setisGrammerSpellCheckOn]);

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleTrashClick = useCallback(() => {
    if (!projectId) return;
    onTrashClick?.(projectId);
  }, [onTrashClick, projectId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      // Close export dropdown if clicking outside
      const target = event.target as Element;
      // Check if click is inside the wrapper OR inside the portal dropdown
      if (
        isExportDropdownOpen &&
        !target.closest('.topbar-export-wrapper') &&
        !target.closest('.export-dropdown-portal-content')
      ) {
        setIsExportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportDropdownOpen]);

  // Listen for save-document event from command palette
  useEffect(() => {
    const handleSaveDocument = async () => {
      if (!updateProjectData || !onGetLatestData) {
        addToast('Save function not available on this page', 'info');
        return;
      }

      setIsSaving(true);
      try {
        const latestData = await onGetLatestData();
        if (latestData) {
          await updateProjectData(latestData);
          addToast('Project saved successfully', 'success');
        }
      } catch (error) {
        addToast('Failed to save project', 'error');
        console.error('Save error:', error);
      } finally {
        setIsSaving(false);
      }
    };

    window.addEventListener('save-document', handleSaveDocument);
    return () => window.removeEventListener('save-document', handleSaveDocument);
  }, [updateProjectData, onGetLatestData, addToast]);

  const handleMenuAction = useCallback(
    async (action: string) => {
      if (action === 'dark-mode') {
        setIsDarkModeEnabled((prev) => !prev);
      }

      if (action === 'update-project-data') {
        if (!updateProjectData || !onGetLatestData) {
          addToast('Save function not available', 'error');
          return;
        }

        setIsSaving(true);
        try {
          // Get latest data from editor
          const latestData = await onGetLatestData();

          if (latestData) {
            await updateProjectData(latestData);
          }
        } catch (error) {
          addToast('Failed to save project', 'error');
          console.error('Save error:', error);
        } finally {
          setIsSaving(false);
        }
        return;
      }

      onMenuAction?.(action);
    },
    [onMenuAction, updateProjectData, onGetLatestData, addToast]
  );

  if (mode === 'search') {
    return <div></div>;
  }

  return (
    <header className="page-header-default">
      <div className="header-content header-content-default topbar-default-layout">
        <div className="topbar-left">
          <HamburgerButton />
          <div className="topbar-brand">
            <h1 className="topbar-logo">{logoText}</h1>
            <span className="topbar-separator" aria-hidden="true" />
          </div>
        </div>

        {/* Center Content (Search Bar) */}
        {centerContent && <div className="topbar-center">{centerContent}</div>}

        {/* {toolbar && <div className="topbar-toolbar-slot">{toolbar}</div>} */}
        <div className="topbar-right">
          {lastSavedTime && (
            <div
              className="topbar-save-status"
              style={{
                marginRight: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <span
                className="topbar-auto-save-indicator"
                style={{ fontSize: '0.7rem', color: '#6B7280' }}
              >
                {autoSaveEnabled ? 'Auto-saved' : 'Saved'}
              </span>
              <span className="topbar-save-time">
                {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <button
            className="topbar-trash-btn"
            onClick={handleTrashClick}
            aria-label="Delete"
            type="button"
          >
            <Trash2 className="topbar-icon" />
          </button>

          {/* AutoSave Toggle */}
          {onToggleAutoSave && (
            <button
              className={`topbar-autosave-toggle ${autoSaveEnabled ? 'enabled' : 'disabled'}`}
              onClick={onToggleAutoSave}
              aria-label={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
              title={autoSaveEnabled ? 'Auto-save is ON' : 'Auto-save is OFF'}
              type="button"
            >
              <RefreshCw size={14} className={autoSaveEnabled ? 'spinning' : ''} />
              <span className="autosave-label">Auto Save</span>
              <span className={`autosave-indicator ${autoSaveEnabled ? 'on' : 'off'}`} />
            </button>
          )}

          <div className="topbar-save-wrapper" style={{ display: 'none' }}>
            <button
              className="topbar-save-btn"
              onClick={() => handleMenuAction('update-project-data')}
              aria-label="Save"
              type="button"
              disabled={isSaving}
              style={{ backgroundColor: '#E8E8E8', color: '#3D3D3D' }}
            >
              <Save className="topbar-icon" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="topbar-menu topbar-export-wrapper" style={{ position: 'relative' }}>
            <button
              className={`topbar-menu-btn ${isExportDropdownOpen ? 'active' : ''}`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setExportButtonPos({ top: rect.bottom, left: rect.right - 140 }); // Align right edge
                setIsExportDropdownOpen(!isExportDropdownOpen);
              }}
              aria-haspopup="menu"
              aria-expanded={isExportDropdownOpen}
              type="button"
            >
              <Image src="/assets/svgs/share.svg" alt="share" width={16} height={16} />
              Export
              <ChevronDown size={16} />
            </button>

            {isExportDropdownOpen && (
              <DropdownPortal>
                <div
                  className="export-dropdown-portal-content"
                  style={{
                    position: 'fixed',
                    top: `${exportButtonPos.top + 4}px`,
                    left: `${exportButtonPos.left}px`,
                    width: '140px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow:
                      '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    zIndex: 999999,
                    padding: '4px 0',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => handleExportAction('pdf')}
                    type="button"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor:
                        hoveredExportItem === 'pdf'
                          ? 'var(--lv-bg-toolbar, #F2EFE9)'
                          : 'transparent',
                      color: 'var(--lv-text-primary, #133435)',
                    }}
                    onMouseEnter={() => setHoveredExportItem('pdf')}
                    onMouseLeave={() => setHoveredExportItem(null)}
                  >
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleExportAction('docx')}
                    type="button"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor:
                        hoveredExportItem === 'docx'
                          ? 'var(--lv-bg-toolbar, #F2EFE9)'
                          : 'transparent',
                      color: 'var(--lv-text-primary, #133435)',
                    }}
                    onMouseEnter={() => setHoveredExportItem('docx')}
                    onMouseLeave={() => setHoveredExportItem(null)}
                  >
                    <span>DOCX</span>
                  </button>
                </div>
              </DropdownPortal>
            )}
          </div>

          {showPrimaryButton && (
            <button className="topbar-primary-btn" onClick={onButtonClick} type="button">
              <span className="topbar-primary-btn-text">{buttonText}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
