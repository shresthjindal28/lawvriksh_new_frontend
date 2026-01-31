/**
 * ProjectListShell.server.tsx
 *
 * Server Component - renders the static container for recent projects.
 * Children (ProjectList.client.tsx) handle virtualization and mutations.
 */

import { ReactNode } from 'react';

interface ProjectListShellProps {
  children: ReactNode;
  isLoading?: boolean;
}

export default function ProjectListShell({ children, isLoading }: ProjectListShellProps) {
  return (
    <div className="dashboard-recent-section">
      <div className="dashboard-recent-header">
        <h3 className="dashboard-section-heading">Recent Projects</h3>
        {isLoading && <span className="dashboard-recent-sync">Syncing...</span>}
      </div>
      {children}
    </div>
  );
}
