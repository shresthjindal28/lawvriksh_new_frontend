'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomOut, ZoomIn, ChevronDown, PanelRight } from 'lucide-react';
import '@/styles/reference-manager/document-header.css';
export const highlightColors = [
  { id: 'yellow', value: '#FEF3C7', label: 'Yellow' },
  { id: 'gray', value: '#E5E7EB', label: 'Gray' },
  { id: 'green', value: '#D1FAE5', label: 'Green' },
  { id: 'blue', value: '#DBEAFE', label: 'Blue' },
  { id: 'purple', value: '#EDE9FE', label: 'Purple' },
  { id: 'pink', value: '#F5D0FE', label: 'Pink' },
];

interface DocumentHeaderProps {
  // Page navigation
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Zoom controls
  onZoomIn: () => void;
  onZoomOut: () => void;
  // Highlight color
  selectedHighlightColor?: string | null;
  onHighlightColorChange?: (color: string) => void;
  // Navigation
  onBack?: () => void;
  // Info Panel
  onToggleInfoPanel?: () => void;
  infoPanelOpen?: boolean;
}

export function DocumentHeader({
  currentPage,
  totalPages,
  onPageChange,
  onZoomIn,
  onZoomOut,
  selectedHighlightColor,
  onHighlightColorChange,
  onBack,
  onToggleInfoPanel,
  infoPanelOpen,
}: DocumentHeaderProps) {
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [pageInputValue, setPageInputValue] = useState(String(currentPage));
  const colorDropdownRef = useRef<HTMLDivElement>(null);

  // Update input when currentPage changes externally
  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setColorDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const pageNum = parseInt(pageInputValue);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
    } else {
      setPageInputValue(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const currentColor =
    highlightColors.find((c) => c.value === selectedHighlightColor) || highlightColors[0];

  return (
    <div className="annotation-header">
      {/* Left section - Page navigation */}
      <div className="header-section header-left">
        {onBack && (
          <button className="header-icon-btn text-btn" onClick={onBack} title="Back">
            Back
          </button>
        )}
        {/* Page navigation */}
        <div className="page-nav-group">
          <button
            className="header-icon-btn"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="page-indicator">
            <input
              type="text"
              className="page-input"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              aria-label="Enter a page number"
            />
            <span className="page-total">of {totalPages}</span>
          </div>

          <button
            className="header-icon-btn"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Center section - Zoom controls + Color selector */}
      <div className="header-section header-center">
        {/* Zoom controls */}
        <div className="zoom-controls">
          <button className="header-icon-btn" onClick={onZoomOut} title="Zoom out">
            <ZoomOut size={20} />
          </button>
          <button className="header-icon-btn" onClick={onZoomIn} title="Zoom in">
            <ZoomIn size={20} />
          </button>
        </div>

        {/* Highlight color selector dropdown */}
        <div className="color-selector" ref={colorDropdownRef}>
          <button
            className="color-selector-btn"
            onClick={() => setColorDropdownOpen(!colorDropdownOpen)}
          >
            <span className="color-preview" style={{ backgroundColor: currentColor.value }} />
            <ChevronDown size={16} className="dropdown-icon" />
          </button>

          {colorDropdownOpen && (
            <div className="color-dropdown">
              {highlightColors.map((color) => (
                <button
                  key={color.id}
                  className={`color-option ${selectedHighlightColor === color.value ? 'active' : ''}`}
                  onClick={() => {
                    onHighlightColorChange?.(color.value);
                    setColorDropdownOpen(false);
                  }}
                  title={color.label}
                >
                  <span className="color-swatch" style={{ backgroundColor: color.value }} />
                  <span className="color-label">{color.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right section - Info Panel toggle */}
      <div className="header-section header-right">
        {onToggleInfoPanel && (
          <button
            className={`header-icon-btn info-panel-toggle-btn ${infoPanelOpen ? 'active' : ''}`}
            onClick={onToggleInfoPanel}
            title={infoPanelOpen ? 'Close info panel' : 'Open info panel'}
          >
            <PanelRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
