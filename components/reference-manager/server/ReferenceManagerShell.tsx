// Server Component - No 'use client' directive
// This component handles the static layout structure

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Types for initial data that can be fetched on the server
interface ReferenceManagerShellProps {
  children: React.ReactNode;
}

/**
 * Server Component shell for the Reference Manager.
 * Handles the static layout structure and provides loading states.
 *
 * Benefits:
 * - Reduces JavaScript bundle size (layout code stays on server)
 * - Faster initial paint (static HTML rendered on server)
 * - Better SEO for the layout structure
 */
export function ReferenceManagerShell({ children }: ReferenceManagerShellProps) {
  return (
    <div className="reference-manager-shell">
      <Suspense fallback={<ReferenceManagerSkeleton />}>{children}</Suspense>
    </div>
  );
}

/**
 * Skeleton loading state for the Reference Manager
 */
function ReferenceManagerSkeleton() {
  return (
    <div className="reference-manager-layout" style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar Skeleton */}
      <div style={{ width: '280px', borderRight: '1px solid #e5e7eb', padding: '16px' }}>
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header Skeleton */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div style={{ flex: 1, padding: '16px' }}>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReferenceManagerShell;
