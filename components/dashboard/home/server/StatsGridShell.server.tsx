/**
 * StatsGridShell.server.tsx
 *
 * Server Component - renders the static grid layout for stats cards.
 * Children (StatsCard.client.tsx) handle animations client-side.
 */

import { ReactNode } from 'react';

interface StatsGridShellProps {
  children: ReactNode;
}

export default function StatsGridShell({ children }: StatsGridShellProps) {
  return <div className="dashboard-stats-grid">{children}</div>;
}
