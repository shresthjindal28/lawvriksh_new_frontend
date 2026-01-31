'use client';

import { ExternalLink } from 'lucide-react';
import type { SourcesListProps } from '@/types/analysis-sidebar';

/**
 * Reusable sources list component for displaying external links
 */
export default function SourcesList({ sources, title }: SourcesListProps) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="issue-sources-section">
      {title && <p className="issue-detail-label">{title}</p>}
      <div className="issue-sources-list">
        {sources.map((source, idx) => (
          <a
            key={idx}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="issue-source-link"
          >
            <div className="issue-source-content">
              <ExternalLink size={14} className="issue-source-icon" />
              <div className="issue-source-text-wrap">
                <p className="issue-source-name">{source.name || source.title || 'Source'}</p>
                {source.url && <p className="issue-source-url">{source.url}</p>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
