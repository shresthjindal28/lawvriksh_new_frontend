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
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ProgressBadge from '../ui/ProgressBadge';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/contexts/ToastContext';
import DropdownPortal from '../ui/dropdown-portal';
import { DocumentType, ExportOptions } from '@/types/project';
import Image from 'next/image';
import { useMobileSidebar } from '@/lib/contexts/MobileSidebarContext';
import { cn } from '@/lib/utils';
import '@/styles/common-styles/top-bar.css';
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
    <button
      className="hidden max-lg:flex items-center justify-center bg-transparent border border-gray-300/70 rounded-lg p-2 cursor-pointer text-gray-700 transition-all duration-200 shrink-0 mr-2 hover:bg-gray-100/95"
      onClick={toggle}
      aria-label="Toggle menu"
      type="button"
    >
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
    <header className="relative top-auto px-7 pt-4 pb-4 backdrop-blur-none bg-[--lv-bg-primary] border-b border-[--lv-border-primary]">
      <div className="w-full grid grid-cols-[1fr_minmax(400px,4fr)_1fr] items-center gap-4 relative max-lg:flex max-lg:justify-between max-lg:gap-2">
        <div className="flex items-center gap-[0.9rem] min-w-0 justify-self-start">
          <HamburgerButton />
          <div className="flex items-center gap-4 max-lg:hidden">
            <div className="relative">
              <h1 className="font-[--lv-font-logo] text-[1.8rem] font-normal leading-none text-slate-800 tracking-tight">
                {logoText}
              </h1>
              <div className="mt-1 h-[3px] w-full bg-[#D4AF37] rounded-full" />
            </div>
            <div className="h-8 w-[1.5px] bg-slate-300/80 rounded-full" />
          </div>
        </div>

        {/* Center Content (Search Bar) */}
        {centerContent && (
          <div className="w-full flex justify-center px-8 max-lg:flex-1 max-lg:w-auto max-lg:mx-2 max-lg:min-w-0 max-lg:px-0 max-sm:hidden">
            {centerContent}
          </div>
        )}

        <div className="inline-flex items-center gap-[0.65rem] justify-self-end justify-end">
          {lastSavedTime && (
            <div className="mr-4 flex flex-col items-end">
              <span className="text-[0.7rem] text-gray-500">
                {autoSaveEnabled ? 'Auto-saved' : 'Saved'}
              </span>
              <span className="text-[0.7rem] text-gray-500 font-normal">
                {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <button
            className="border-none bg-transparent p-[0.4rem] text-red-700 inline-flex items-center justify-center rounded-md transition-colors duration-200 hover:bg-red-500/10"
            onClick={handleTrashClick}
            aria-label="Delete"
            type="button"
          >
            <Trash2 className="w-[1.15rem] h-[1.15rem]" />
          </button>

          {/* AutoSave Toggle */}
          {onToggleAutoSave && (
            <button
              className={cn(
                'inline-flex items-center gap-1.5 py-1.5 px-3 rounded-[20px] border cursor-pointer text-xs font-medium whitespace-nowrap transition-all duration-200',
                autoSaveEnabled
                  ? 'bg-linear-to-b from-emerald-50 to-emerald-100 border-green-500/40 text-green-700 hover:from-emerald-100 hover:to-emerald-200 hover:border-green-500/60'
                  : 'bg-linear-to-b from-gray-50 to-gray-100 border-gray-300/80 text-gray-500 hover:from-gray-100 hover:to-gray-200 hover:border-gray-400'
              )}
              onClick={onToggleAutoSave}
              aria-label={autoSaveEnabled ? 'Disable auto-save' : 'Enable auto-save'}
              title={autoSaveEnabled ? 'Auto-save is ON' : 'Auto-save is OFF'}
              type="button"
            >
              <RefreshCw size={14} />
              <span className="text-xs max-sm:hidden">Auto Save</span>
              <span
                className={cn(
                  'w-2 h-2 rounded-full transition-colors duration-200',
                  autoSaveEnabled
                    ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]'
                    : 'bg-gray-300'
                )}
              />
            </button>
          )}

          <div className="hidden flex-col items-start gap-1">
            <button
              className="inline-flex items-center gap-[0.4rem] py-2 px-4 rounded-lg border border-green-500/30 bg-green-500/10 text-green-700 text-sm font-medium cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-green-500/20 hover:border-green-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => handleMenuAction('update-project-data')}
              aria-label="Save"
              type="button"
              disabled={isSaving}
              style={{ backgroundColor: '#E8E8E8', color: '#3D3D3D' }}
            >
              <Save className="w-[1.15rem] h-[1.15rem]" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="topbar-export-wrapper relative">
            <button
              className={cn(
                'inline-flex items-center justify-center gap-2.5 py-2 px-4 rounded-lg border border-gray-300/85 bg-transparent cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-all duration-200',
                isExportDropdownOpen &&
                  'bg-gray-100/95 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]',
                'hover:bg-gray-100/95 hover:shadow-[inset_0_0_0_1px_rgba(148,163,184,0.25)]'
              )}
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
                    className={cn(
                      'w-full text-left py-2 px-3 text-sm border-none cursor-pointer flex items-center gap-2 text-[--lv-text-primary]',
                      hoveredExportItem === 'pdf' ? 'bg-[--lv-bg-toolbar]' : 'bg-transparent'
                    )}
                    onMouseEnter={() => setHoveredExportItem('pdf')}
                    onMouseLeave={() => setHoveredExportItem(null)}
                  >
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => handleExportAction('docx')}
                    type="button"
                    className={cn(
                      'w-full text-left py-2 px-3 text-sm border-none cursor-pointer flex items-center gap-2 text-[--lv-text-primary]',
                      hoveredExportItem === 'docx' ? 'bg-[--lv-bg-toolbar]' : 'bg-transparent'
                    )}
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
            <button
              className="py-[0.55rem] px-6 rounded-md border border-gray-900 bg-white text-gray-900 text-[0.9rem] font-medium tracking-wide cursor-pointer transition-all duration-200 hover:bg-gray-900 hover:text-white max-md:py-2 max-md:px-4 max-md:text-[0.8125rem] max-sm:py-[0.45rem] max-sm:px-2.5 max-sm:text-xs"
              onClick={onButtonClick}
              type="button"
            >
              <span className="whitespace-nowrap">{buttonText}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
