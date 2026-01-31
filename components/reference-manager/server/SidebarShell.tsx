// Server Component - No 'use client' directive
// This component handles the static sidebar structure

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SidebarShellProps {
  children: React.ReactNode;
}

/**
 * Server Component shell for the Reference Manager Sidebar.
 * Provides the static structure with loading states.
 */
export function SidebarShell({ children }: SidebarShellProps) {
  return (
    <aside className="reference-sidebar-shell">
      <Suspense fallback={<SidebarSkeleton />}>{children}</Suspense>
    </aside>
  );
}

/**
 * Skeleton loading state for the Sidebar
 */
function SidebarSkeleton() {
  return (
    <div style={{ width: '280px', padding: '16px' }}>
      {/* Collections Header */}
      <div style={{ marginBottom: '16px' }}>
        <Skeleton className="h-6 w-24 mb-2" />
      </div>

      {/* Collection Items */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 flex-1" />
          </div>
        ))}
      </div>

      {/* Folders Section */}
      <div style={{ marginTop: '24px' }}>
        <Skeleton className="h-6 w-20 mb-2" />
        <div className="space-y-2 pl-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Tags Section */}
      <div style={{ marginTop: '24px' }}>
        <Skeleton className="h-6 w-16 mb-2" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default SidebarShell;
