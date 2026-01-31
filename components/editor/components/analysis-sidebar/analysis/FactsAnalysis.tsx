'use client';

import { RefreshCw, CheckCircle2, ExternalLink, ChevronRight } from 'lucide-react';
import type { FactChecker } from '@/types/copilot';
import type { SimpleSetter } from '@/types/analysis-sidebar';
import { truncateText, getVerdictType } from '../utils';
import { AnalysisScoreCard, NoIssuesFound, SourcesList } from '../shared';

interface FactsAnalysisProps {
  localFacts: FactChecker[];
  factScore: number;
  wordCount: number;
  correctionsApplied: number;
  factsLoading: boolean;
  expandedFactItems: Record<string, boolean>;
  setExpandedFactItems: SimpleSetter<Record<string, boolean>>;
  handleAnalyze: (type: string) => void;
  replaceHighlightedText: (
    blockId: string,
    correctedText: string,
    type: string,
    factIndex: number
  ) => void;
  rejectFactCorrection: (factIndex: number) => void;
  handleResolveAll: (type: string) => void;
}

export default function FactsAnalysis({
  localFacts,
  factScore,
  wordCount,
  correctionsApplied,
  factsLoading,
  expandedFactItems,
  setExpandedFactItems,
  handleAnalyze,
  replaceHighlightedText,
  rejectFactCorrection,
  handleResolveAll,
}: FactsAnalysisProps) {
  const toggleFactItem = (key: string) => {
    setExpandedFactItems({ ...expandedFactItems, [key]: !expandedFactItems[key] });
  };

  // Empty State - No Verifiable Claims
  if (localFacts.length === 0) {
    return (
      <div className="no-issues-container">
        <NoIssuesFound
          title="No Issues Found"
          description="No verifiable factual claims were detected in this document that require fact-checking."
        />
        <AnalysisScoreCard
          score={factScore || 100}
          description="Accuracy Score"
          stats={[{ label: 'Claims Found', value: 0 }]}
        />
        <button
          className="analysis-rerun-action-btn"
          onClick={() => handleAnalyze('facts')}
          disabled={factsLoading}
        >
          <RefreshCw size={14} />
          {factsLoading ? 'Rerunning...' : 'Run Again'}
        </button>
      </div>
    );
  }

  // Build stats array
  const stats: Array<{ label: string; value: string | number; color?: string }> = [
    { label: 'Claims Checked', value: localFacts.length },
    { label: 'Total words', value: wordCount },
  ];
  if (correctionsApplied > 0) {
    stats.push({ label: 'Corrections Available', value: correctionsApplied, color: 'blue' });
  }

  return (
    <>
      <AnalysisScoreCard
        score={factScore || 0}
        description="Facts claimed in this document are true"
        stats={stats}
      />

      {/* Fact Issues List */}
      <div className="issues-list-container">
        {localFacts.map((f, idx) => {
          const verdictType = getVerdictType(f.verdict || '');

          // Don't display accurate claims at all
          if (verdictType === 'accurate') return null;

          const key = `fact-${idx}`;
          const isOpen = expandedFactItems[key];
          const statusColor =
            verdictType === 'inaccurate' || verdictType === 'invalid' ? 'red' : 'orange';

          return (
            <div key={key} className={`issue-item-card ${(f as any).status ? 'accepted' : ''}`}>
              <button
                onClick={() => {
                  if (!(f as any).status || (f as any).status === 'pending') {
                    toggleFactItem(key);
                  }
                }}
                className="issue-item-button"
              >
                <div className={`issue-badge-container ${statusColor}`}>
                  <div className={`issue-badge-dot ${statusColor}`} />
                </div>

                <div className="issue-content-wrapper">
                  <div className="issue-header-row">
                    <span className={`issue-verdict-text ${statusColor}`}>{f.verdict}</span>
                    {(f as any).status && (
                      <span
                        className={`issue-status-badge ${
                          (f as any).status === 'accepted' ? 'accepted' : 'pending'
                        }`}
                      >
                        {(f as any).status}
                      </span>
                    )}
                  </div>
                  <p className="issue-text-preview">{truncateText(f.fact.wrongStatement, 100)}</p>
                </div>

                {(!(f as any).status || (f as any).status === 'pending') && (
                  <div className="issue-chevron-wrapper">
                    <ChevronRight size={20} className={`issue-chevron ${isOpen ? 'open' : ''}`} />
                  </div>
                )}
              </button>

              {isOpen && (!(f as any).status || (f as any).status === 'pending') && (
                <div className="issue-details-panel">
                  <div className="issue-detail-row">
                    <div className="issue-detail-item">
                      <p className="issue-detail-label">Confidence</p>
                      <p className="issue-detail-value">
                        {Math.round((f.confidence || 0) * (f.confidence > 1 ? 1 : 100))}%
                      </p>
                    </div>
                    <div className="issue-detail-item">
                      <p className="issue-detail-label">Verdict</p>
                      <p className={`issue-detail-verdict ${statusColor}`}>{f.verdict}</p>
                    </div>
                  </div>

                  {/* Reasoning */}
                  {(f as any).reasoning && (
                    <div className="issue-reasoning-box">
                      <p className="issue-detail-label">Reasoning</p>
                      <p className="issue-reasoning-text">{(f as any).reasoning}</p>
                    </div>
                  )}

                  {/* Sources / Citations */}
                  {f.sources && f.sources.length > 0 && (
                    <SourcesList sources={f.sources} title={`Sources (${f.sources.length})`} />
                  )}

                  {/* Only show corrected statement for inaccurate claims, not invalid */}
                  {f.fact.correctedStatement && verdictType === 'inaccurate' && (
                    <div className="issue-correction-box">
                      <p className="issue-correction-label">Suggested Correction:</p>
                      <p className="issue-correction-text">{f.fact.correctedStatement}</p>
                    </div>
                  )}

                  {/* Only show Accept/Reject for inaccurate claims with corrections */}
                  {verdictType === 'inaccurate' && f.fact.correctedStatement && (
                    <div className="issue-actions-row">
                      <button
                        onClick={() =>
                          replaceHighlightedText(
                            `fact-${idx}`,
                            f.fact.correctedStatement,
                            'fact',
                            idx
                          )
                        }
                        className="issue-action-btn-accept"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectFactCorrection(idx)}
                        className="issue-action-btn-reject"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky-bottom-actions">
        <button
          className="analysis-rerun-action-btn"
          onClick={() => handleAnalyze('facts')}
          disabled={factsLoading}
        >
          <RefreshCw size={16} />
          {factsLoading ? 'Rerunning...' : 'Rerun'}
        </button>
        <button className="analysis-resolve-all-btn" onClick={() => handleResolveAll('facts')}>
          <CheckCircle2 size={16} />
          Resolve All
        </button>
      </div>
    </>
  );
}
