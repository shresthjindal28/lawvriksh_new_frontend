import React, { useState, useEffect } from 'react';
import '@/styles/common-styles/search-interface.css';
import { Folder, Search, Loader2 } from 'lucide-react';
import { SearchProject } from '@/types/project';
import { debounce, formatTimeAgo } from '@/lib/utils/helpers';
import Link from 'next/link';
import VideoLoader from '../ui/VideoLoader';

interface SearchInterfaceProps {
  onSearch: (query: string) => void;
  searchedProjects: SearchProject[] | null;
  isLoading?: boolean;
}

const SearchComponent: React.FC<SearchInterfaceProps> = ({
  onSearch,
  searchedProjects,
  isLoading = false,
}) => {
  const [query, setQuery] = useState('');
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      const timeoutId = setTimeout(() => {
        console.log('Triggering search with query:', query);
        onSearch(query);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    } else {
      // Clear results when query is empty
      onSearch('');
    }
  }, [query, onSearch]);

  const handleFocus = () => setIsResultsOpen(true);
  const handleBlur = () => setTimeout(() => setIsResultsOpen(false), 200);

  return (
    <div className="search-container">
      <div className="search-bar">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search in this Workspace"
          value={query}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isLoading && <Loader2 size={18} className="animate-spin" />}
      </div>

      {isResultsOpen && query.trim() && (
        <div className="results-list">
          {isLoading ? (
            <div className="loading-state">
              <VideoLoader width={100} height={100} />
              <p>Searching projects...</p>
            </div>
          ) : searchedProjects && searchedProjects.length > 0 ? (
            searchedProjects.map((item) => (
              <Link href={`/writing-section/${item.id}`} key={item.id} className="result-item">
                <div className="file-info">
                  <span className="folder-icon">
                    <Folder />
                  </span>
                  <span className="file-name">{item.title}</span>
                  <span className={`file-tag ${item.category.replace(' ', '-').toLowerCase()}`}>
                    {item.category}
                  </span>
                </div>
                <div className="file-meta">
                  <span className="last-edited">Last edited: {formatTimeAgo(item.updated_at)}</span>
                </div>
              </Link>
            ))
          ) : query.trim() ? (
            <div className="no-results">
              <Folder size={40} strokeWidth={1.5} />
              <h4>No projects found</h4>
              <p>
                "{query}" did not match any projects.
                <br />
                Please try again or{' '}
                <a href="#" className="create-link">
                  create a new project
                </a>
                .
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
