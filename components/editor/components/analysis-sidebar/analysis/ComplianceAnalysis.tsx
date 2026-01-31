'use client';

import { RotateCcw, CheckCircle2, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import type { Compliance } from '@/types/copilot';
import type { SimpleSetter } from '@/types/analysis-sidebar';
import { truncateText } from '../utils';
import { AnalysisScoreCard, NoIssuesFound } from '../shared';

interface ComplianceAnalysisProps {
  localCompliances: Compliance[];
  complianceScore: number;
  wordCount: number;
  complianceLoading: boolean;
  expandedComplianceItems: Record<string, boolean>;
  setExpandedComplianceItems: SimpleSetter<Record<string, boolean>>;
  handleAnalyze: (type: string) => void;
}

export default function ComplianceAnalysis({
  localCompliances,
  complianceScore,
  wordCount,
  complianceLoading,
  expandedComplianceItems,
  setExpandedComplianceItems,
  handleAnalyze,
}: ComplianceAnalysisProps) {
  const highlightableCompliancesCount = localCompliances.filter(
    (c) => c.statement?.wrongStatement && c.statement?.wrongStatement.trim() !== ''
  ).length;

  return (
    <>
      <AnalysisScoreCard
        score={complianceScore || 0}
        description="Compliances in this document are followed"
        stats={[
          { label: 'Flagged Claims', value: highlightableCompliancesCount },
          { label: 'Total words', value: wordCount },
        ]}
      />

      {/* Compliance Issues List */}
      <div className="issues-list-container">
        {localCompliances.length > 0 ? (
          localCompliances.map((c, idx) => {
            const key = `comp-${idx}`;
            const isOpen = expandedComplianceItems[key];

            // Determine violation type and styling based on verdict/violation_type
            const violationType = c.verdict?.toLowerCase() || '';
            let statusColor: 'red' | 'orange' = 'orange';

            if (
              c.verdict === 'VERY_HIGH' ||
              violationType.includes('high') ||
              violationType.includes('critical')
            ) {
              statusColor = 'red';
            } else if (c.verdict === 'MEDIUM') {
              statusColor = 'orange';
            }

            const displayVerdict = c.verdict || 'Compliance Issue';

            return (
              <div key={key} className="issue-item-card">
                <button
                  onClick={() =>
                    setExpandedComplianceItems({
                      ...expandedComplianceItems,
                      [key]: !expandedComplianceItems[key],
                    })
                  }
                  className="issue-item-button"
                >
                  <div className={`issue-badge-container ${statusColor}`}>
                    <div className={`issue-badge-dot ${statusColor}`} />
                  </div>
                  <div className="issue-content-wrapper">
                    <div className="issue-header-row">
                      <span className={`issue-verdict-text ${statusColor}`}>{displayVerdict}</span>
                    </div>
                    <p className="issue-text-preview">
                      {truncateText(c.statement.wrongStatement, 100)}
                    </p>
                  </div>
                  <div className="issue-chevron-wrapper">
                    <ChevronRight size={20} className={`issue-chevron ${isOpen ? 'open' : ''}`} />
                  </div>
                </button>
                {isOpen && (
                  <div className="issue-details-panel">
                    {/* Justification Box */}
                    {c.justification && (
                      <div className="compliance-justification-box">
                        <div className="issue-source-content">
                          <Image
                            src="/assets/svgs/siren.svg"
                            alt="warning"
                            width={16}
                            height={16}
                            className="opacity-70"
                          />
                          <div>
                            <p className="issue-text-preview">{c.justification}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Corrected Sentence */}
                    {c.statement.correctedStatement &&
                      c.statement.correctedStatement.trim() !== '' && (
                        <div className="issue-correction-box">
                          <div className="issue-source-content">
                            <CheckCircle2 size={16} className="text-green-600" />
                            <div className="flex-1">
                              <p className="issue-correction-label">Suggested Correction:</p>
                              <p className="issue-correction-text">
                                {c.statement.correctedStatement}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Referenced Policies/Legal References */}
                    {c.policies && c.policies.length > 0 && (
                      <div>
                        <p className="issue-detail-label">Legal References:</p>
                        <div className="compliance-legal-tags-container">
                          {c.policies.map((policy, pIdx) => (
                            <span key={policy.id || pIdx} className="compliance-legal-tag">
                              {policy.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <NoIssuesFound
            title="Document is Fully Compliant"
            description="No compliance issues or violations were detected in your document."
          />
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="sticky-bottom-actions">
        <button
          className="analysis-rerun-action-btn"
          onClick={() => handleAnalyze('compliances')}
          disabled={complianceLoading}
        >
          <RotateCcw size={16} />
          {complianceLoading ? 'Rerunning...' : 'Rerun to Refresh Score'}
        </button>
      </div>
    </>
  );
}
