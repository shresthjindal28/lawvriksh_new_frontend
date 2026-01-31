'use client';

import { CheckCircle2 } from 'lucide-react';
import type { NoIssuesFoundProps } from '@/types/analysis-sidebar';

/**
 * Reusable empty state component for when no issues are found
 */
export default function NoIssuesFound({ title, description, icon }: NoIssuesFoundProps) {
  return (
    <div className="no-issues-container">
      <div className="no-issues-icon-box">
        {icon || <CheckCircle2 size={48} className="no-issues-icon-svg" />}
      </div>
      <h3 className="no-issues-title">{title}</h3>
      <p className="no-issues-desc">{description}</p>
    </div>
  );
}
