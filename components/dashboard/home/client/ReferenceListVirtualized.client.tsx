'use client';

/**
 * ReferenceListVirtualized.client.tsx
 *
 * Client Component - renders a virtualized list of recent references.
 * Uses TanStack Virtual for efficient rendering of large lists.
 *
 * Only renders visible items + overscan, reducing DOM nodes from O(n) to O(k).
 */

import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, MessageSquare, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================================
// Constants
// ============================================================================

// Threshold for enabling virtualization
const VIRTUALIZATION_THRESHOLD = 15;

// Item configuration
const ITEM_HEIGHT = 100; // Approximate height of reference item

// Animation variants (static)
const researchListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const researchItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 120,
      damping: 18,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.2 },
  },
};

// ============================================================================
// Types
// ============================================================================

interface ReferenceItem {
  id: string;
  documentId?: string;
  title: string;
  author?: string;
  uploaded?: string;
  annotations?: number;
  notes?: number;
  status?: string;
  statusColor?: string;
  tags?: any[];
  s3_key?: string;
  file_url?: string;
  web_url?: string;
}

interface ReferenceListVirtualizedProps {
  references: ReferenceItem[];
  isLoading: boolean;
  role: 'student' | 'professional';
  totalCount: number;
  onViewFile: (reference: ReferenceItem) => void;
  onTagMouseEnter: (e: React.MouseEvent, tags: any[]) => void;
  onTagMouseLeave: () => void;
}

// ============================================================================
// Reference Item Component (extracted for reuse)
// ============================================================================

interface ReferenceItemProps {
  reference: ReferenceItem;
  index: number;
  onViewFile: (reference: ReferenceItem) => void;
  onTagMouseEnter: (e: React.MouseEvent, tags: any[]) => void;
  onTagMouseLeave: () => void;
}

function ReferenceItemRow({
  reference,
  index,
  onViewFile,
  onTagMouseEnter,
  onTagMouseLeave,
}: ReferenceItemProps) {
  return (
    <div className="dashboard-reference-item">
      <div className="dashboard-reference-row">
        <div className="dashboard-reference-main">
          <div className="dashboard-reference-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5.00065 18.3337C4.55862 18.3337 4.1347 18.1581 3.82214 17.8455C3.50958 17.5329 3.33398 17.109 3.33398 16.667V3.33366C3.33398 2.89163 3.50958 2.46771 3.82214 2.15515C4.1347 1.84259 4.55862 1.66699 5.00065 1.66699H11.6673C11.9311 1.66657 12.1924 1.71833 12.4361 1.8193C12.6798 1.92027 12.9011 2.06846 13.0873 2.25533L16.0773 5.24533C16.2647 5.43158 16.4133 5.65312 16.5146 5.89713C16.6158 6.14114 16.6677 6.4028 16.6673 6.66699V16.667C16.6673 17.109 16.4917 17.5329 16.1792 17.8455C15.8666 18.1581 15.4427 18.3337 15.0007 18.3337H5.00065Z"
                stroke="#133435"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.666 1.66699V5.83366C11.666 6.05467 11.7538 6.26663 11.9101 6.42291C12.0664 6.57919 12.2783 6.66699 12.4993 6.66699H16.666"
                stroke="#133435"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.33268 7.5H6.66602"
                stroke="#133435"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.3327 10.833H6.66602"
                stroke="#133435"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.3327 14.167H6.66602"
                stroke="#133435"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="dashboard-reference-title-wrapper">
            <h4 className="dashboard-reference-title" title={reference.title}>
              {reference.title || 'Untitled reference'}
            </h4>
            {/* Tags display */}
            {reference.tags && reference.tags.length > 0 && (
              <div className="dashboard-reference-tags" style={{ marginTop: '0px', flexShrink: 0 }}>
                <div
                  className="relative group mt-1"
                  style={{ position: 'relative', display: 'inline-block' }}
                  onMouseEnter={(e) => onTagMouseEnter(e, reference.tags!)}
                  onMouseLeave={onTagMouseLeave}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      gap: '2px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: reference.tags[0]?.color || '#eee',
                        }}
                      />
                      {reference.tags.length > 1 && (
                        <div
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            color: '#6b7280',
                            fontSize: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                          }}
                        >
                          +{reference.tags.length - 1}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '9px', color: '#666', lineHeight: 1 }}>Tag</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <span className={`dashboard-reference-badge ${reference.statusColor || ''}`}>
          {reference.status}
        </span>
      </div>
      <p className="dashboard-reference-meta">
        By: {reference.author} • Uploaded: {reference.uploaded}
      </p>

      <div className="dashboard-reference-stats">
        <div
          className="dashboard-reference-stat"
          style={{
            cursor:
              reference.s3_key || reference.file_url || reference.web_url ? 'pointer' : 'default',
          }}
          onClick={(e) => {
            if (reference.s3_key || reference.file_url || reference.web_url) {
              e.stopPropagation();
              onViewFile(reference);
            }
          }}
          title={
            reference.s3_key || reference.file_url || reference.web_url
              ? 'Click to view document and annotations'
              : 'No document attached'
          }
        >
          <MessageSquare size={12} />
          <span>
            {reference.annotations || 0}{' '}
            {(reference.annotations || 0) === 1 ? 'annotation' : 'annotations'}
          </span>
        </div>
        <div className="dashboard-reference-stat">
          <Bookmark size={12} />
          <span>
            {reference.notes || 0} {(reference.notes || 0) === 1 ? 'note' : 'notes'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ReferenceListVirtualized({
  references,
  isLoading,
  role,
  totalCount,
  onViewFile,
  onTagMouseEnter,
  onTagMouseLeave,
}: ReferenceListVirtualizedProps) {
  const router = useRouter();
  const parentRef = useRef<HTMLDivElement>(null);

  // Virtualizer
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: references.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 2,
  });

  // Decide whether to use virtualization
  const useVirtualization = references.length > VIRTUALIZATION_THRESHOLD;

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        key="research-loading"
        className="dashboard-research-list"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="dashboard-research-skeleton">
          {[0, 1, 2].map((index) => (
            <div key={`ref-skeleton-${index}`} className="dashboard-ref-skeleton-row">
              <div className="dashboard-ref-skeleton-avatar" />
              <div className="dashboard-ref-skeleton-lines">
                <div className="dashboard-ref-skeleton-line-primary" />
                <div className="dashboard-ref-skeleton-line-secondary" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Empty state
  if (references.length === 0) {
    return (
      <motion.div
        key="research-empty"
        className="dashboard-research-empty-state"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
      >
        <div className="dashboard-research-empty-icon">
          <BookOpen size={24} strokeWidth={1.5} />
        </div>
        <h3 className="dashboard-research-empty-title">No recent references</h3>
        <p className="dashboard-research-empty-text">
          Your research hub is waiting. Add references to get started.
        </p>
        <button
          className="dashboard-research-empty-button"
          onClick={() => router.push(`/dashboard/${role}/reference-manager`)}
        >
          <span>Create Your First Reference</span>
        </button>
      </motion.div>
    );
  }

  // Non-virtualized rendering for small lists
  if (!useVirtualization) {
    return (
      <>
        <AnimatePresence mode="wait">
          <motion.div
            key="research-list"
            className="dashboard-research-list"
            variants={researchListVariants}
            initial="hidden"
            animate="visible"
          >
            {references.map((ref, index) => (
              <motion.div key={ref.id ?? `recent-ref-${index}`} variants={researchItemVariants}>
                <ReferenceItemRow
                  reference={ref}
                  index={index}
                  onViewFile={onViewFile}
                  onTagMouseEnter={onTagMouseEnter}
                  onTagMouseLeave={onTagMouseLeave}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {references.length > 0 && (
          <button
            className="dashboard-research-footer"
            onClick={() => router.push(`/dashboard/${role}/reference-manager`)}
          >
            View all references ({totalCount > 0 ? totalCount : '0'}) →
          </button>
        )}
      </>
    );
  }

  // Virtualized rendering for large lists
  return (
    <>
      <div
        ref={parentRef}
        className="dashboard-research-list-virtualized"
        style={{
          height: '400px',
          overflow: 'auto',
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const reference = references[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ReferenceItemRow
                  reference={reference}
                  index={virtualItem.index}
                  onViewFile={onViewFile}
                  onTagMouseEnter={onTagMouseEnter}
                  onTagMouseLeave={onTagMouseLeave}
                />
              </div>
            );
          })}
        </div>
      </div>

      <button
        className="dashboard-research-footer"
        onClick={() => router.push(`/dashboard/${role}/reference-manager`)}
      >
        View all references ({totalCount > 0 ? totalCount : '0'}) →
      </button>
    </>
  );
}
