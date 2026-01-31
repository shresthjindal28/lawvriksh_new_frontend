import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import {
  useToolbarActions,
  CATEGORY_LABELS,
  type ToolbarActionCategory,
} from '@/hooks/common/useToolbarActions';
import type { AnalysisShortcutActions } from '@/types/analysis-sidebar';
import type { Editor } from '@tiptap/react';
import DropdownPortal from './dropdown-portal';

interface ToolSearchBarProps {
  editor: Editor | null;
  onAi?: (e?: React.MouseEvent) => void;
  onCite?: () => void;
  onToggleVariables?: () => void;
  analysisActions?: AnalysisShortcutActions | null;
  className?: string;
  variant?: 'default' | 'header';
}

function ToolSearchBar({
  editor,
  onAi,
  onCite,
  onToggleVariables,
  analysisActions,
  className,
  variant = 'default',
}: ToolSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const { groupedActions, hasActions } = useToolbarActions({
    editor,
    onAi,
    onCite,
    onToggleVariables,
    analysisActions,
    searchQuery,
  });

  // Update dropdown position
  useEffect(() => {
    if (variant === 'header' && searchQuery && inputRef.current) {
      const updatePosition = () => {
        const rect = inputRef.current!.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 2,
          left: rect.left,
          width: rect.width,
        });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [variant, searchQuery]);

  // Close results when clicking outside could be handled here or by parent,
  // but for now let's just style it.

  const renderResults = () => {
    if (!searchQuery) return null;

    const resultsStyle =
      variant === 'header' && dropdownPosition
        ? {
            position: 'fixed' as const,
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: '400px',
            zIndex: 99999,
            marginTop: 0,
          }
        : undefined;

    if (!hasActions) {
      const emptyContent = (
        <div className="tool-search-bar__results" style={resultsStyle}>
          <p className="tool-search-bar__empty">No matching tools found.</p>
        </div>
      );

      if (variant === 'header') {
        return <DropdownPortal>{emptyContent}</DropdownPortal>;
      }
      return emptyContent;
    }

    const content = (
      <div className="tool-search-bar__results" style={resultsStyle}>
        {(Object.keys(CATEGORY_LABELS) as ToolbarActionCategory[]).map((category) => {
          const actions = groupedActions[category];
          if (!actions || actions.length === 0) {
            return null;
          }
          return (
            <section key={category} className="tool-search-bar__category">
              <p className="tool-search-bar__category-label">{CATEGORY_LABELS[category]}</p>
              <div className="tool-search-bar__category-actions">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className="tool-search-bar__action"
                    onClick={(e) => {
                      // @ts-ignore
                      action.action(e);
                      setSearchQuery('');
                    }}
                  >
                    <span className="tool-search-bar__action-icon">{action.icon}</span>
                    <div>
                      <p className="tool-search-bar__action-label">{action.label}</p>
                      <p className="tool-search-bar__action-description">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    );

    if (variant === 'header' && searchQuery) {
      return <DropdownPortal>{content}</DropdownPortal>;
    }

    if (variant === 'default') {
      return content;
    }

    return null;
  };

  return (
    <div
      ref={containerRef}
      className={`tool-search-bar ${variant === 'header' ? 'tool-search-bar--header' : ''} ${className || ''}`}
    >
      <div className="tool-search-bar__input" ref={inputRef}>
        <Search size={16} color="#94a3b8" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tools..."
          aria-label="Search tools"
        />
      </div>

      {renderResults()}
    </div>
  );
}

export default ToolSearchBar;
