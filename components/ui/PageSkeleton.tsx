'use client';

import { Skeleton } from './skeletons/Skeleton';
import { cn } from '@/lib/utils';

interface PageSkeletonProps {
  className?: string;
  showSidebar?: boolean;
  message?: string;
}

/**
 * Full page skeleton loader that mimics the dashboard layout
 * Used for initial page loads and auth loading states
 */
export function PageSkeleton({ className, showSidebar = true, message }: PageSkeletonProps) {
  return (
    <div className={cn('flex min-h-screen bg-gray-50 dark:bg-gray-950', className)}>
      {/* Sidebar skeleton */}
      {showSidebar && (
        <div className="hidden md:flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          {/* Logo */}
          <Skeleton width="140px" height="32px" className="mb-8" />

          {/* Nav items */}
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="100%" height="40px" />
            ))}
          </div>

          {/* Bottom section */}
          <div className="mt-auto space-y-2">
            <Skeleton width="100%" height="40px" />
            <div className="flex items-center gap-3 p-2">
              <Skeleton width={40} height={40} borderRadius="50%" />
              <div className="flex-1">
                <Skeleton width="80%" height="14px" className="mb-1" />
                <Skeleton width="60%" height="12px" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton width="200px" height="28px" className="mb-2" />
            <Skeleton width="140px" height="16px" />
          </div>
          <Skeleton width="280px" height="40px" />
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height="100px" />
          ))}
        </div>

        {/* Section header */}
        <Skeleton width="160px" height="24px" className="mb-4" />

        {/* Project cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
            >
              <Skeleton width="100%" height="140px" className="mb-4" />
              <Skeleton width="70%" height="20px" className="mb-2" />
              <Skeleton width="40%" height="16px" />
            </div>
          ))}
        </div>

        {/* Loading message */}
        {message && (
          <div className="fixed inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm z-50">
            <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
              <div className="w-5 h-5 border-2 border-primary-300 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {message}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
