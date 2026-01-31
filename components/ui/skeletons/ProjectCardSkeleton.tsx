'use client';

import { Skeleton, SkeletonText, SkeletonButton } from './Skeleton';
import { cn } from '@/lib/utils';

interface ProjectCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader that matches the ProjectCard component layout
 * Used when loading project data on the dashboard
 */
export function ProjectCardSkeleton({ className }: ProjectCardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
        'rounded-xl p-5 space-y-4',
        'shadow-sm',
        className
      )}
      aria-hidden="true"
    >
      {/* Header: Category badge and menu */}
      <div className="flex items-center justify-between">
        <Skeleton width="5rem" height="1.5rem" borderRadius="9999px" />
        <Skeleton width="1.5rem" height="1.5rem" borderRadius="0.25rem" />
      </div>

      {/* Title */}
      <Skeleton width="80%" height="1.25rem" />

      {/* Description - 2 lines */}
      <SkeletonText lines={2} lastLineWidth="60%" />

      {/* Footer: Date and actions */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton width="6rem" height="0.875rem" />
        <div className="flex gap-2">
          <SkeletonButton width="4rem" height="1.75rem" />
          <SkeletonButton width="4rem" height="1.75rem" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton cards for dashboard loading state
 */
export function ProjectCardSkeletonGrid({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}
      role="status"
      aria-label="Loading projects"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading projects...</span>
    </div>
  );
}
