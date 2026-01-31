'use client';

import { Search, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import type { ExploreItem } from '@/types/explore';
import type { Document } from '@/lib/validators/library-documents/response';
import type { SimpleSetter } from '@/types/analysis-sidebar';
import DiscoverSearchState from '../../DiscoverSearchState';
import { truncateText } from '../utils';

interface DiscoverTabProps {
  searchQuery: string;
  setSearchQuery: SimpleSetter<string>;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchClick: (term?: string) => void;
  loading: boolean;
  items: ExploreItem[];
  selectedItem: ExploreItem | null;
  setSelectedItem: SimpleSetter<ExploreItem | null>;
  projectDocuments?: Document[];
}

export default function DiscoverTab({
  searchQuery,
  setSearchQuery,
  handleSearchChange,
  handleSearchClick,
  loading,
  items,
  selectedItem,
  setSelectedItem,
  projectDocuments,
}: DiscoverTabProps) {
  const handleCardClick = (item: ExploreItem) => {
    setSelectedItem(item);
  };

  const handleBackToList = () => {
    setSelectedItem(null);
  };

  return (
    <div className="discover-content">
      {/* Search Box */}
      <div className="search-box">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search any case or judgement"
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
        />
        {loading && <Loader2 className="search-loader spin-animation" size={18} />}
      </div>

      {selectedItem ? (
        <div className="detail-view">
          <div className="detail-header">
            <button className="back-button" onClick={handleBackToList}>
              <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
              Back to Results
            </button>
          </div>

          <div className="detail-content">
            <div className="detail-title-section">
              <h1 className="detail-title">{selectedItem.title}</h1>
              <div className="detail-meta">
                <a
                  href={selectedItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explore-detail-read-btn"
                >
                  <ExternalLink size={16} />
                  <span>Read full Material</span>
                </a>
                <span className={`verdict-badge ${selectedItem.verdict.toLowerCase()}`}>
                  {selectedItem.verdict}
                </span>
              </div>
            </div>

            {selectedItem.fullContent?.introduction && (
              <div className="detail-section">
                <h2 className="detail-section-title">Introduction</h2>
                <p className="detail-section-content">{selectedItem.fullContent.introduction}</p>
              </div>
            )}

            {selectedItem.fullContent?.sections.map((section, index) => (
              <div key={index} className="detail-section">
                <h2 className="detail-section-title">{section.title}</h2>
                <p className="detail-section-content">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : !loading && items.length === 0 ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <DiscoverSearchState
            onSearch={handleSearchClick}
            contextKeywords={
              projectDocuments?.map((d) => d.file_name.replace(/\.[^/.]+$/, '')) || []
            }
          />
        </div>
      ) : (
        <div className="case-cards">
          {items.map((caseItem) => (
            <div key={caseItem.id} className="case-card" onClick={() => handleCardClick(caseItem)}>
              <h3 className="case-title">{caseItem.title}</h3>
              <p className="case-summary">{truncateText(caseItem.description || '', 300)}</p>
              <div className="case-actions">
                <a
                  href={caseItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explore-detail-read-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={16} />
                  <span>Read full Material</span>
                </a>
                <span className={`verdict-badge ${caseItem.verdict.toLowerCase()}`}>
                  {caseItem.verdict}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
