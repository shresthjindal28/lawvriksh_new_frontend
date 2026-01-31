/**
 * ResearchHubShell.server.tsx
 *
 * Server Component - renders the static structure for the research hub section.
 * Children (ReferenceList.client.tsx) handle interactions client-side.
 */

import { ReactNode } from 'react';

interface ResearchHubShellProps {
  children: ReactNode;
}

export default function ResearchHubShell({ children }: ResearchHubShellProps) {
  return (
    <div className="dashboard-right-column">
      <h3 className="dashboard-section-heading">YOUR RESEARCH HUB</h3>
      <p className="dashboard-research-subtitle">Recently Active References</p>
      <div className="dashboard-research-container" style={{ minWidth: 'auto', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}
