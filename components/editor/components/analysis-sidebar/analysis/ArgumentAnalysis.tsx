'use client';

import { RefreshCw, CheckCircle2 } from 'lucide-react';
import type { ArgumentLogic } from '@/types/copilot';
import { getColorByIndex } from '../utils';
import { NoIssuesFound } from '../shared';

interface ArgumentAnalysisProps {
  localArgumentLogics: ArgumentLogic[];
  argumentScore: number;
  wordCount: number;
  argumentLoading: boolean;
  handleAnalyze: (type: string) => void;
  handleResolveAll: (type: string) => void;
}

export default function ArgumentAnalysis({
  localArgumentLogics,
  argumentScore,
  wordCount,
  argumentLoading,
  handleAnalyze,
  handleResolveAll,
}: ArgumentAnalysisProps) {
  // Calculate total contradictions count
  const highlightableArgumentsCount = Array.isArray(localArgumentLogics)
    ? localArgumentLogics.reduce((acc, logicItem) => {
        if (logicItem.sets) {
          const setsTotal = logicItem.sets.reduce((setAcc, set) => {
            return setAcc + (set.contradictions?.length || 0);
          }, 0);
          return acc + setsTotal;
        }
        // Handle old structure (statements) - Fallback
        if ((logicItem as any).statements) {
          return (
            acc + ((logicItem as any).statements.filter((s: any) => s.wrongStatement).length || 0)
          );
        }
        return acc;
      }, 0)
    : 0;

  return (
    <>
      <div className="argument-score-container">
        <div className="argument-score-main">
          <div className={`argument-score-value ${(argumentScore || 0) >= 50 ? 'green' : 'red'}`}>
            {Math.round(argumentScore || 0)}%
          </div>
          <div className="argument-score-desc">Arguments & logics mentioned makes sense</div>
        </div>

        <div className="argument-stat-card">
          <div className="argument-stat-label">Contradictions</div>
          <div className="argument-stat-value">{highlightableArgumentsCount}</div>
        </div>

        <div className="argument-stat-card">
          <div className="argument-stat-label">Total words</div>
          <div className="argument-stat-value">{wordCount}</div>
        </div>
      </div>

      <div className="argument-list">
        {localArgumentLogics.length > 0 ? (
          (() => {
            // Flatten all contradictions from all sets with their scores
            const allContradictions: Array<{
              contra: any;
              score: number;
              globalIdx: number;
            }> = [];
            let globalIdx = 0;

            localArgumentLogics.forEach((logicItem) => {
              logicItem.sets.forEach((set) => {
                set.contradictions.forEach((contra) => {
                  allContradictions.push({
                    contra,
                    score: contra.contradiction_score || set.score,
                    globalIdx: globalIdx++,
                  });
                });
              });
            });

            return allContradictions.map(({ contra, score, globalIdx }) => {
              const colorHex = getColorByIndex(globalIdx);
              return (
                <div key={`contra-${globalIdx}`} className="argument-item">
                  {/* Header with Score */}
                  <div className="argument-item-header">
                    <div className="argument-score-badge">
                      <div className="argument-dot" style={{ backgroundColor: colorHex }}></div>
                      <h4 className="argument-score-text" style={{ color: colorHex }}>
                        {score}%
                      </h4>
                      <span className="argument-label-text">Contradiction Score</span>
                    </div>
                  </div>

                  {/* Statement 1 */}
                  <div className="argument-statement-wrapper">
                    <div className="argument-statement-box">
                      <div className="argument-number-col">
                        <span className="argument-number" style={{ color: colorHex }}>
                          1
                        </span>
                        <span className="argument-number-label">Statement</span>
                      </div>
                      <div className="argument-text-col">
                        <p className="argument-text">{contra.line1.text}</p>
                      </div>
                    </div>
                  </div>

                  {/* Statement 2 */}
                  <div className="argument-statement-wrapper">
                    <div className="argument-statement-box">
                      <div className="argument-number-col">
                        <span className="argument-number" style={{ color: colorHex }}>
                          2
                        </span>
                        <span className="argument-number-label">Statement</span>
                      </div>
                      <div className="argument-text-col">
                        <p className="argument-text">{contra.line2.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        ) : (
          <NoIssuesFound
            title="No Contradictions Found"
            description="Your document has consistent logic and arguments throughout."
          />
        )}
      </div>

      {/* Rerun Button */}
      <div className="sticky-bottom-actions mt-6">
        <button
          className="analysis-rerun-action-btn"
          onClick={() => handleAnalyze('argumentLogic')}
          disabled={argumentLoading}
        >
          <RefreshCw size={16} />
          {argumentLoading ? 'Rerunning...' : 'Rerun'}
        </button>
        <button
          className="analysis-resolve-all-btn"
          onClick={() => handleResolveAll('argumentLogic')}
        >
          <CheckCircle2 size={16} />
          Resolve All
        </button>
      </div>
    </>
  );
}
