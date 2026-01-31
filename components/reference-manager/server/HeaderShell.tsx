// Server Component - No 'use client' directive
// This component handles the static header structure

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface HeaderShellProps {
  children: React.ReactNode;
}

/**
 * Server Component shell for the Reference Manager Header.
 * Provides the static structure with loading states.
 */
export function HeaderShell({ children }: HeaderShellProps) {
  return (
    <header className="reference-header-shell">
      <Suspense fallback={<HeaderSkeleton />}>{children}</Suspense>
    </header>
  );
}

/**
 * Skeleton loading state for the Header
 */
function HeaderSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      {/* Left side - Menu and Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>

      {/* Right side - Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export default HeaderShell;
