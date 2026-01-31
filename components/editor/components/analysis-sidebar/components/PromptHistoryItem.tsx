'use client';

import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { useIsPromptExpanded } from '@/hooks/editor/usePromptHistory';
import { PromptStep } from '@/store/zustand/usePromptHistoryStore';

// ============================================================================
// Types
// ============================================================================

interface PromptHistoryItemProps {
  step: PromptStep;
  onToggleExpand: (id: string) => void;
}

// ============================================================================
// Component Implementation
// ============================================================================

/**
 * Memoized prompt history item component.
 * Only re-renders when its specific item data or expansion state changes.
 */
const PromptHistoryItemComponent: React.FC<PromptHistoryItemProps> = ({ step, onToggleExpand }) => {
  // Isolated subscription - only re-renders when THIS item's expansion state changes
  const isExpanded = useIsPromptExpanded(step.id);

  const shouldShowReadMore = step.text.length > 80;

  return (
    <div className={`ai-action-item ${step.status === 'loading' ? 'loading' : ''}`}>
      <div className="ai-action-timeline">
        <div className={`ai-action-icon ${step.status}`}>
          {step.status === 'completed' ? (
            <Check size={16} strokeWidth={3} />
          ) : (
            <div className="loading-circle" />
          )}
        </div>
      </div>
      <div className="ai-action-content">
        <p className={`ai-action-text ${isExpanded ? 'expanded' : 'truncated'}`}>{step.text}</p>
        {shouldShowReadMore && (
          <button className="ai-read-more-btn" onClick={() => onToggleExpand(step.id)}>
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </div>
  );
};

// Memoize to prevent re-renders unless props change
export const PromptHistoryItem = memo(PromptHistoryItemComponent, (prev, next) => {
  // Custom comparison - only re-render if step or callback changes
  return (
    prev.step.id === next.step.id &&
    prev.step.text === next.step.text &&
    prev.step.status === next.step.status &&
    prev.onToggleExpand === next.onToggleExpand
  );
});

PromptHistoryItem.displayName = 'PromptHistoryItem';

// ============================================================================
// List Component
// ============================================================================

interface PromptHistoryListProps {
  items: PromptStep[];
  onToggleExpand: (id: string) => void;
  emptyMessage?: string;
}

/**
 * Optimized list component for rendering prompt history items.
 * Uses memoization to prevent unnecessary re-renders.
 */
const PromptHistoryListComponent: React.FC<PromptHistoryListProps> = ({
  items,
  onToggleExpand,
  emptyMessage = 'No prompt history yet',
}) => {
  if (items.length === 0) {
    return (
      <div className="ai-action-item">
        <div className="ai-action-content">
          <p className="ai-action-text" style={{ color: '#888' }}>
            {emptyMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {items.map((step) => (
        <PromptHistoryItem key={step.id} step={step} onToggleExpand={onToggleExpand} />
      ))}
    </>
  );
};

export const PromptHistoryList = memo(PromptHistoryListComponent);

PromptHistoryList.displayName = 'PromptHistoryList';

// ============================================================================
// Loading Skeleton
// ============================================================================

export const PromptHistoryLoadingSkeleton: React.FC = memo(() => {
  return (
    <div className="ai-action-item">
      <div className="ai-action-timeline">
        <div className="ai-action-icon loading">
          <div className="loading-circle" />
        </div>
      </div>
      <div className="ai-action-content">
        <p className="ai-action-text">Loading history...</p>
      </div>
    </div>
  );
});

PromptHistoryLoadingSkeleton.displayName = 'PromptHistoryLoadingSkeleton';
