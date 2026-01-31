import {
  ChevronsUpDown,
  Plus,
  Search,
  Upload,
  Clock,
  X,
  ArrowLeft,
  PanelLeft,
  Folder,
} from 'lucide-react';
import { useState } from 'react';
import { HamburgerButton } from '@/components/common/HamburgerButton';
import { useTypewriter } from '@/hooks/common/useTypewriter';
import { AnimatedCreateButton } from '../content/AnimatedCreateButton';

// Header Component
export default function Header({
  onUpload,
  onCreateClick,
  createBtnRef,
  uploadBtnRef,
  onSearchChange,
  onTimelineClick,
  onToggleSidebar,
  searchValue,
  isMobile,
  isSidebarOpen,
  sidebarWidth,
  isInfoPanelOpen,
  isCreateMenuOpen,
}: {
  onUpload: () => void;
  onCreateClick: () => void;
  createBtnRef: React.RefObject<HTMLButtonElement | null>;
  uploadBtnRef: React.RefObject<HTMLButtonElement | null>;
  onSearchChange: (value: string) => void;
  onTimelineClick: () => void;
  onToggleSidebar?: () => void;
  searchValue?: string;
  isMobile?: boolean;
  isSidebarOpen?: boolean;
  sidebarWidth?: number;
  isInfoPanelOpen?: boolean;
  isCreateMenuOpen?: boolean;
}) {
  const [localSearchValue, setLocalSearchValue] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const currentValue = searchValue !== undefined ? searchValue : localSearchValue;

  const placeholderText = useTypewriter(
    [
      'Search files...',
      'Search tags...',
      'Search citations...',
      'Search authors...',
      'Search legal cases...',
    ],
    100,
    50,
    2000
  );

  const handleChange = (value: string) => {
    if (searchValue === undefined) {
      setLocalSearchValue(value);
    }
    onSearchChange(value);
  };

  const handleClear = () => {
    handleChange('');
  };

  if (isMobile) {
    return (
      <header
        className="referenceManagerHeader"
        style={{
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '12px 12px',
          gap: '12px',
          height: 'auto',
        }}
      >
        <div
          className="headerLeft flex items-center justify-between w-full border-b"
          style={{
            width: '100%',
            borderRight: 'none',
            padding: '0 16px', // Added padding so it doesn't touch the screen edge
            // Removed 'justifyContent: flex-start' so 'justify-between' can work
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HamburgerButton />
            <h1 className="referenceManagerLogo" style={{ borderBottom: 'none' }}>
              LawVriksh
            </h1>
          </div>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                // Removed marginRight since it's now on the far right
                display: 'flex',
                alignItems: 'center',
                color: '#1d1b20',
              }}
              title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
            >
              <Folder size={20} />
            </button>
          )}
        </div>

        <div
          className="searchBar"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px 12px',
            gap: '8px',
          }}
        >
          <Search size={16} color="#6b7280" />
          <input
            type="text"
            placeholder={placeholderText}
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              width: '100%',
              fontSize: '14px',
              color: '#374151',
            }}
          />
          {currentValue && (
            <button
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                color: '#9ca3af',
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', width: '100%', gap: '8px', alignItems: 'center' }}>
          <button className="uploadBtn" onClick={onUpload} ref={uploadBtnRef} style={{ flex: 1 }}>
            <Upload size={18} />
          </button>
          <AnimatedCreateButton
            onClick={onCreateClick}
            ref={createBtnRef}
            isOpen={!!isCreateMenuOpen}
            className="flex-1"
          />
          <button className="timelineBtn" onClick={onTimelineClick} style={{ flex: 1 }}>
            <Clock size={18} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header
      className="referenceManagerHeader"
      style={{
        padding: 0,
        gap: 0,
        justifyContent: 'flex-start',
      }}
    >
      <div
        className="headerLeft"
        style={{
          width: sidebarWidth ? `${sidebarWidth}px` : '330px',
          minWidth: sidebarWidth ? `${sidebarWidth}px` : '330px',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRight: '1px solid #e5e5e5',
          flexShrink: 0,
        }}
      >
        <h1 className="referenceManagerLogo">LawVriksh</h1>
        {(!isMobile || !isSearchExpanded) && (
          <button className="timelineBtn" onClick={onTimelineClick}>
            <Clock size={18} />
            Timeline
          </button>
        )}
      </div>

      <div
        className="headerRight"
        style={{
          flex: 1,
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {isMobile && !isSearchExpanded ? (
          <button
            onClick={() => setIsSearchExpanded(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
            }}
          >
            <Search size={20} />
          </button>
        ) : (
          <div
            className="searchBar"
            style={
              isMobile
                ? {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 50,
                    background: 'white',
                    borderRadius: 0,
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    padding: '0 16px',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }
                : {
                    width: '100%',
                    margin: 0,
                  }
            }
          >
            {isMobile && (
              <button
                onClick={() => setIsSearchExpanded(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  marginRight: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                }}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            {!isMobile && <Search size={18} />}
            <input
              className="hidden md:block"
              type="text"
              placeholder={isMobile ? 'Search...' : placeholderText}
              value={currentValue}
              onChange={(e) => handleChange(e.target.value)}
              autoFocus={isMobile}
            />
            {currentValue && (
              <button
                onClick={handleClear}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.6,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className="headerCenter"
        style={{
          width: isInfoPanelOpen ? '25%' : 'auto',
          minWidth: isInfoPanelOpen ? '25%' : 'auto',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isInfoPanelOpen ? 'flex-start' : 'flex-end',
          borderLeft: isInfoPanelOpen ? '1px solid #e5e5e5' : 'none',
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <AnimatedCreateButton
          onClick={onCreateClick}
          ref={createBtnRef}
          isOpen={!!isCreateMenuOpen}
        />
        <button className="uploadBtn" onClick={onUpload} ref={uploadBtnRef}>
          <Upload size={18} />
          Upload File
        </button>
      </div>
    </header>
  );
}
