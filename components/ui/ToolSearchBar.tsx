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
import '@/styles/writing-page/tool-search-bar.css';
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
        }
        : undefined;

    // Common Tailwind classes for the results container
    const containerClasses = "bg-white border border-slate-200 rounded-lg shadow-xl overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[400px]";

    if (!hasActions) {
      const emptyContent = (
        <div className={containerClasses} style={resultsStyle}>
          <p className="p-8 text-center text-sm text-slate-500">No matching tools found.</p>
        </div>
      );

      if (variant === 'header') {
        return <DropdownPortal>{emptyContent}</DropdownPortal>;
      }
      return emptyContent;
    }

    const content = (
      <div className={containerClasses} style={resultsStyle}>
        {(Object.keys(CATEGORY_LABELS) as ToolbarActionCategory[]).map((category) => {
          const actions = groupedActions[category];
          if (!actions || actions.length === 0) {
            return null;
          }
          return (
            <section key={category} className="border-b border-slate-100 last:border-0">
              <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 bg-slate-50/50 uppercase tracking-wider">
                {CATEGORY_LABELS[category]}
              </p>
              <div className="p-1.5 grid gap-0.5">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className="w-full flex items-start gap-3 p-2 rounded-md hover:bg-slate-100 hover:text-slate-900 text-left transition-colors group"
                    onClick={(e) => {
                      // @ts-ignore
                      action.action(e);
                      setSearchQuery('');
                    }}
                  >
                    <span className="mt-0.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                      {action.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                        {action.label}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1 opacity-90">
                        {action.description}
                      </p>
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
      className={`relative w-full ${variant === 'header' ? 'max-w-3xl' : ''} ${className || ''}`}
    >
      <div
        className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50/80 border border-slate-200/80 rounded-lg transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 focus-within:bg-white focus-within:border-slate-300 focus-within:ring-2 focus-within:ring-slate-100 focus-within:shadow-sm"
        ref={inputRef}
      >
        <Search size={17} className="text-slate-400 shrink-0" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search tools..."
          aria-label="Search tools"
          className="flex-1 w-full bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 h-full py-1"
        />
      </div>

      {renderResults()}
    </div>
  );
}

export default ToolSearchBar;
