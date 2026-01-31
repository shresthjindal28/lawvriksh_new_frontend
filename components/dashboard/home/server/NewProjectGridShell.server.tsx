/**
 * NewProjectGridShell.server.tsx
 *
 * Server Component - renders the static grid layout for new project options.
 * Children (NewProjectCard.client.tsx) handle click interactions client-side.
 */

import { ReactNode } from 'react';

interface NewProjectGridShellProps {
  children: ReactNode;
}

export default function NewProjectGridShell({ children }: NewProjectGridShellProps) {
  return (
    <div className="dashboard-new-project-section">
      <h3 className="dashboard-section-heading">START A NEW PROJECT</h3>
      <div className="dashboard-new-project-grid">{children}</div>
    </div>
  );
}
