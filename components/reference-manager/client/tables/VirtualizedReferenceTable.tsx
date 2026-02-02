'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ReferenceItem } from '@/types/reference-manager';
import { useReferenceStore } from '@/store/zustand/useReferenceStore';
import { ReferenceRow } from './ReferenceRow';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/reference-manager/referenceTable.css';
const ROW_HEIGHT = 56; // Estimated row height in pixels
const OVERSCAN = 10; // Number of items to render outside visible area

interface VirtualizedReferenceTableProps {
  referenceIds: string[];
  onSelectReference: (id: string) => void;
  onDeleteReference: (id: string) => void;
  onViewFile: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, ref: ReferenceItem) => void;
  selectedReferenceId: string | null;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export function VirtualizedReferenceTable({
  referenceIds,
  onSelectReference,
  onDeleteReference,
  onViewFile,
  onContextMenu,
  selectedReferenceId,
  selectedIds,
  onSelectedIdsChange,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  isLoading = false,
}: VirtualizedReferenceTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get references from store for O(1) lookups
  const referencesById = useReferenceStore((state) => state.referencesById);

  // Calculate total count including loading row if there's more to load
  const totalCount = hasNextPage ? referenceIds.length + 1 : referenceIds.length;

  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Infinite scroll: trigger load more when scrolling near bottom
  useEffect(() => {
    if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;

    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;

    // If we're within 5 items of the end, load more
    if (lastItem.index >= referenceIds.length - 5) {
      onLoadMore();
    }
  }, [virtualItems, onLoadMore, hasNextPage, isFetchingNextPage, referenceIds.length]);

  const handleRowClick = useCallback(
    (e: React.MouseEvent, id: string) => {
      if ((e.target as HTMLElement).closest('input[type=checkbox]')) return;
      if ((e.target as HTMLElement).closest('button')) return;

      if (e.ctrlKey || e.metaKey) {
        // Toggle selection with Ctrl/Cmd
        onSelectedIdsChange(
          selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]
        );
      } else if (e.shiftKey && selectedIds.length > 0) {
        // Range selection with Shift
        const lastSelected = selectedIds[selectedIds.length - 1];
        const lastIndex = referenceIds.indexOf(lastSelected);
        const currentIndex = referenceIds.indexOf(id);
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = referenceIds.slice(start, end + 1);
        onSelectedIdsChange(rangeIds);
      } else {
        onSelectedIdsChange([id]);
        onSelectReference(id);
      }
    },
    [selectedIds, referenceIds, onSelectedIdsChange, onSelectReference]
  );

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
      if (e.target.checked) {
        onSelectedIdsChange([...selectedIds, id]);
      } else {
        onSelectedIdsChange(selectedIds.filter((i) => i !== id));
      }
    },
    [selectedIds, onSelectedIdsChange]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, id: string) => {
      const itemsToDrag = selectedIds.includes(id) ? selectedIds : [id];
      setIsDragging(true);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', JSON.stringify(itemsToDrag));
    },
    [selectedIds]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (isLoading && referenceIds.length === 0) {
    return (
      <div className="reference-table-container">
        <div className="reference-table-loading">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="reference-table-skeleton-row">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (referenceIds.length === 0) {
    return (
      <div className="reference-table-empty">
        <p>No references found</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="virtualized-table-container"
      style={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const isLoadingRow = virtualRow.index >= referenceIds.length;

          if (isLoadingRow) {
            return (
              <div
                key="loading"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isFetchingNextPage ? (
                  <Skeleton className="h-12 w-full mx-4" />
                ) : hasNextPage ? (
                  <button
                    onClick={onLoadMore}
                    className="load-more-button"
                    style={{
                      padding: '8px 16px',
                      background: '#f0f0f0',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Load more...
                  </button>
                ) : null}
              </div>
            );
          }

          const referenceId = referenceIds[virtualRow.index];
          const reference = referencesById[referenceId];

          if (!reference) return null;

          return (
            <ReferenceRow
              key={referenceId}
              reference={reference}
              isSelected={selectedReferenceId === referenceId}
              isInSelection={selectedIds.includes(referenceId)}
              isDragging={isDragging}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              onClick={handleRowClick}
              onCheckboxChange={handleCheckboxChange}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDelete={onDeleteReference}
              onViewFile={onViewFile}
              onContextMenu={onContextMenu}
            />
          );
        })}
      </div>
    </div>
  );
}

export default VirtualizedReferenceTable;
