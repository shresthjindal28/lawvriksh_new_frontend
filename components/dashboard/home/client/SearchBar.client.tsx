'use client';

/**
 * SearchBar.client.tsx
 *
 * Client Component - handles keyboard shortcuts and input focus.
 * Isolated client component to prevent re-renders in parent.
 */

import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({
  placeholder = 'Search shortcuts or projects...',
  onSearch,
}: SearchBarProps) {
  return (
    <div className="dashboard-search">
      <div className="dashboard-search-icon-left">
        <Search size={16} />
      </div>
      <input
        type="text"
        placeholder={placeholder}
        className="dashboard-search-input"
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <div className="dashboard-search-shortcut">
        <span className="dashboard-search-shortcut-label">⌘K</span>
      </div>
    </div>
  );
}
