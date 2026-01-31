'use client';

import { ChevronRight } from 'lucide-react';
import type { IssueItemCardProps } from '@/types/analysis-sidebar';

/**
 * Reusable expandable issue card component
 */
export default function IssueItemCard({
  statusColor,
  verdictText,
  previewText,
  isOpen,
  onToggle,
  status,
  children,
}: IssueItemCardProps) {
  const isClickable = !status || status === 'pending';

  return (
    <div className={`issue-item-card ${status === 'accepted' ? 'accepted' : ''}`}>
      <button
        onClick={() => {
          if (isClickable) {
            onToggle();
          }
        }}
        className="issue-item-button"
      >
        <div className={`issue-badge-container ${statusColor}`}>
          <div className={`issue-badge-dot ${statusColor}`} />
        </div>

        <div className="issue-content-wrapper">
          <div className="issue-header-row">
            <span className={`issue-verdict-text ${statusColor}`}>{verdictText}</span>
            {status && (
              <span
                className={`issue-status-badge ${status === 'accepted' ? 'accepted' : 'pending'}`}
              >
                {status}
              </span>
            )}
          </div>
          <p className="issue-text-preview">{previewText}</p>
        </div>

        {isClickable && (
          <div className="issue-chevron-wrapper">
            <ChevronRight size={20} className={`issue-chevron ${isOpen ? 'open' : ''}`} />
          </div>
        )}
      </button>

      {isOpen && isClickable && children && <div className="issue-details-panel">{children}</div>}
    </div>
  );
}
