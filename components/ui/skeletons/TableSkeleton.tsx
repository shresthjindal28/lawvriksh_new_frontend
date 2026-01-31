'use client';

import { Skeleton, SkeletonAvatar } from './Skeleton';
import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showAvatar?: boolean;
  className?: string;
}

/**
 * Table skeleton for data tables (e.g., Reference Manager)
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  showAvatar = false,
  className,
}: TableSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
        'rounded-lg overflow-hidden',
        className
      )}
      role="status"
      aria-label="Loading table data"
    >
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              width={i === 0 ? '8rem' : '6rem'}
              height="0.75rem"
              className="flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-3">
            {showAvatar && <SkeletonAvatar size={32} />}
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                width={getColumnWidth(colIndex, columns)}
                height="0.875rem"
                className="flex-shrink-0"
              />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only">Loading table data...</span>
    </div>
  );
}

/**
 * Helper to vary column widths for more natural appearance
 */
function getColumnWidth(index: number, total: number): string {
  const widths = ['40%', '20%', '15%', '15%', '10%'];
  return widths[index % widths.length];
}

/**
 * Reference table specific skeleton
 */
export function ReferenceTableSkeleton({
  rows = 8,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
      role="status"
      aria-label="Loading references"
    >
      {/* Search and filters */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <Skeleton width="16rem" height="2.25rem" borderRadius="0.5rem" />
        <div className="flex gap-2">
          <Skeleton width="6rem" height="2rem" borderRadius="0.375rem" />
          <Skeleton width="6rem" height="2rem" borderRadius="0.375rem" />
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm">
        <div className="col-span-1">
          <Skeleton width="1rem" height="1rem" />
        </div>
        <div className="col-span-4">
          <Skeleton width="4rem" height="0.75rem" />
        </div>
        <div className="col-span-2">
          <Skeleton width="3rem" height="0.75rem" />
        </div>
        <div className="col-span-2">
          <Skeleton width="3rem" height="0.75rem" />
        </div>
        <div className="col-span-2">
          <Skeleton width="4rem" height="0.75rem" />
        </div>
        <div className="col-span-1">
          <Skeleton width="2rem" height="0.75rem" />
        </div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
            <div className="col-span-1">
              <Skeleton width="1rem" height="1rem" />
            </div>
            <div className="col-span-4 space-y-1">
              <Skeleton width="90%" height="0.875rem" />
              <Skeleton width="60%" height="0.75rem" />
            </div>
            <div className="col-span-2">
              <Skeleton width="80%" height="0.75rem" />
            </div>
            <div className="col-span-2">
              <Skeleton width="4rem" height="1.25rem" borderRadius="9999px" />
            </div>
            <div className="col-span-2">
              <Skeleton width="70%" height="0.75rem" />
            </div>
            <div className="col-span-1">
              <Skeleton width="1.5rem" height="1.5rem" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading references...</span>
    </div>
  );
}
