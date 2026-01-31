'use client';

import React, { useEffect, useState } from 'react';
import { Clock, TrendingUp, Sparkles, X } from 'lucide-react';

interface DiscoverSearchStateProps {
  onSearch: (query: string) => void;
  contextKeywords?: string[];
}

export default function DiscoverSearchState({
  onSearch,
  contextKeywords = [],
}: DiscoverSearchStateProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    try {
      const stored = localStorage.getItem('lawvriksh_recent_searches');
      if (stored && isMounted) {
        const parsed = JSON.parse(stored).slice(0, 5);
        queueMicrotask(() => setRecentSearches(parsed));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemoveRecent = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((t) => t !== term);
    setRecentSearches(updated);
    localStorage.setItem('lawvriksh_recent_searches', JSON.stringify(updated));
  };

  const trendingSearches = [
    'Article 21 Constitution',
    'Breach of Contract',
    'Intellectual Property Rights',
    'Criminal Procedure Code',
    'Force Majeure',
  ];

  // Combine context keywords with defaults if not enough context
  const suggestions =
    contextKeywords.length > 0
      ? contextKeywords.slice(0, 4)
      : ['Land Acquisition Act', 'Cyber Law India', 'Corporate Governance', 'Family Law'];

  return (
    <div className="discover-empty-state-container">
      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="discover-section">
          <div className="discover-section-header">
            <Clock size={16} className="text-gray-500" />
            <h3 className="discover-section-title">Recent Searches</h3>
          </div>
          <div className="discover-tags-grid">
            {recentSearches.map((term, idx) => (
              <button
                key={`recent-${idx}`}
                className="discover-tag-btn"
                onClick={() => onSearch(term)}
              >
                <span>{term}</span>
                <div className="discover-tag-remove" onClick={(e) => handleRemoveRecent(e, term)}>
                  <X size={12} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations / Suggested for You */}
      <div className="discover-section">
        <div className="discover-section-header">
          <Sparkles size={16} className="text-[#d4af37]" />
          <h3 className="discover-section-title">Suggested for you</h3>
        </div>
        <div className="discover-tags-grid">
          {suggestions.map((term, idx) => (
            <button
              key={`suggest-${idx}`}
              className="discover-tag-btn suggestion"
              onClick={() => onSearch(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .discover-empty-state-container {
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 40px;
          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            Roboto,
            sans-serif;
          max-width: 800px;
          margin: 0 auto;
        }

        .discover-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .discover-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .discover-section-title {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
        }

        .discover-tags-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .discover-tag-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 100px;
          font-size: 14px;
          color: #374151;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .discover-tag-btn:hover {
          background-color: #f9fafb;
          color: #111827;
          border-color: #d1d5db;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .discover-tag-btn.suggestion {
          background-color: #ffffff;
          border-color: #d4af37;
          color: #374151;
        }

        .discover-tag-btn.suggestion:hover {
          background-color: #fffdf0;
          border-color: #b3922d;
          box-shadow:
            0 4px 6px -1px rgba(212, 175, 55, 0.15),
            0 2px 4px -1px rgba(212, 175, 55, 0.1);
        }

        .discover-tag-remove {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          color: #9ca3af;
          transition: all 0.2s;
          margin-left: 2px;
        }

        .discover-tag-remove:hover {
          background-color: #fee2e2;
          color: #ef4444;
        }

        .discover-list-column {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .discover-list-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .discover-list-item:hover {
          background-color: #ffffff;
          border-color: #e5e7eb;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
          transform: translateX(4px);
        }

        .discover-trend-number {
          font-size: 14px;
          font-weight: 700;
          color: #d1d5db;
          width: 24px;
          font-variant-numeric: tabular-nums;
        }

        .discover-list-item:hover .discover-trend-number {
          color: #f97316;
        }

        .discover-trend-text {
          font-size: 15px;
          color: #374151;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
