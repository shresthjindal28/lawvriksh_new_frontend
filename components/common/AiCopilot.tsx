'use client';

import { Dispatch, SetStateAction, useState } from 'react';
import '@/styles/common-styles/ai-copilot.css';
import { ChevronRight, FileSearch, Shield, X } from 'lucide-react';
import { ArgumentLogic, Compliance, FactChecker, FactCheckSummary } from '@/types/copilot';
import { truncateText } from '@/lib/utils/helpers';

interface AiCopilotProps {
  percentage: number;
  fact?: FactChecker | FactChecker[] | null;
  compliance?: Compliance | Compliance[] | null;
  argumentLogic?: ArgumentLogic | ArgumentLogic[] | null;
  factSummary?: FactCheckSummary;
  expandedSections: {
    [key: string]: boolean;
  };
  setExpandedSections: Dispatch<
    SetStateAction<{
      [key: string]: boolean;
    }>
  >;
  toggleSection: (section: string) => void;
  setIsCopilotOpen: Dispatch<SetStateAction<boolean>>;
}

export default function AiCopilot({
  fact,
  compliance,
  argumentLogic,
  expandedSections,
  toggleSection,
  percentage,
  setIsCopilotOpen,
}: AiCopilotProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  // Normalize data
  const facts = fact ? (Array.isArray(fact) ? fact : [fact]) : [];
  const compliances = compliance ? (Array.isArray(compliance) ? compliance : [compliance]) : [];
  const argumentLogics = argumentLogic
    ? Array.isArray(argumentLogic)
      ? argumentLogic
      : [argumentLogic]
    : [];

  // Track which inner dropdowns are expanded
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleInner = (key: string) => {
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="document-analysis-container">
      {/* Header with Title */}
      <div className="document-analysis-header">
        <h2 className="document-analysis-title">Quality Score</h2>
        <button className="document-analysis-close-button" onClick={() => setIsCopilotOpen(false)}>
          <X />
        </button>
      </div>

      {/* Circular Progress */}
      <div className="document-analysis-progress-container">
        <svg className="document-analysis-progress-circle" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            className={
              percentage >= 50
                ? 'document-analysis-progress-background'
                : 'document-analysis-progress-background-danger'
            }
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            className={
              percentage >= 50
                ? 'document-analysis-progress-fill'
                : 'document-analysis-progress-fill-danger'
            }
            style={{
              strokeDasharray: `${(percentage / 100) * 282.7} 282.7`,
            }}
          />
        </svg>
        <div
          className="document-analysis-progress-text"
          style={{ color: percentage >= 50 ? '#20FF3A' : '#FF3A3A' }}
        >
          {Math.round(clamped)}%
        </div>
      </div>

      {/* FACT CHECKER SECTION */}
      <div className="document-analysis-section">
        <div
          className={`document-analysis-section-header ${
            expandedSections.factChecker ? 'document-expanded' : ''
          }`}
          onClick={() => toggleSection('factChecker')}
        >
          <div className="document-analysis-section-title">
            <Shield className="document-analysis-icon" />
            <span>Fact Checker</span>
            {facts.length > 0 && <span className="section-badge">{facts.length}</span>}
          </div>
          <ChevronRight
            className={`document-analysis-chevron ${
              expandedSections.factChecker ? 'document-analysis-expanded' : ''
            }`}
          />
        </div>

        {expandedSections.factChecker && (
          <>
            {facts.length > 0 ? (
              facts.map((f, idx) => {
                const key = `fact-${idx}`;
                const isOpen = expandedItems[key];
                return (
                  <div key={key} className="document-inner-dropdown">
                    <div
                      className={`document-inner-header ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleInner(key)}
                    >
                      <span>{truncateText(f.fact.wrongStatement, 40)}</span>

                      <ChevronRight
                        className={`document-inner-chevron ${isOpen ? 'rotate' : ''}`}
                      />
                    </div>

                    {isOpen && (
                      <div className="document-inner-content">
                        <p className="document-analysis-fact-statement">
                          "{truncateText(f.fact.wrongStatement, 100)}"
                        </p>

                        {/* ✅ ADDED: Show corrected statement */}
                        <div className="corrected-statement">
                          <strong>Suggestion:</strong>
                          <p>{f.fact.correctedStatement}</p>
                        </div>

                        <div className="document-analysis-stats-container">
                          <div className="document-analysis-stat">
                            <span className="document-analysis-stat-label">Confidence:</span>
                            <span className="document-analysis-stat-value">
                              {' '}
                              {(f.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="document-analysis-stat">
                            <span className="document-analysis-stat-label">Verdict:</span>
                            <span className="document-analysis-stat-value document-analysis-mixed">
                              {f.verdict}
                            </span>
                          </div>
                        </div>

                        {f.sources?.length > 0 && (
                          <div className="document-analysis-sources-section">
                            <h4 className="document-analysis-sources-title">Sources</h4>
                            {f.sources.map((src, sIdx) => (
                              <div key={sIdx} className="document-analysis-source-item">
                                <a href={src.url} target="_blank" rel="noopener noreferrer">
                                  {src.name}
                                </a>
                                <span>{src.date}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ marginLeft: '1rem' }}>No factual issues detected</p>
            )}
          </>
        )}
      </div>

      {/* COMPLIANCE SECTION - No changes needed */}
      <div className="document-analysis-section">
        <div
          className={`document-analysis-section-header ${
            expandedSections.compliance ? 'document-expanded' : ''
          }`}
          onClick={() => toggleSection('compliance')}
        >
          <div className="document-analysis-section-title">
            <FileSearch className="document-analysis-icon" />
            <span>Compliance</span>
            {compliances.length > 0 && <span className="section-badge">{compliances.length}</span>}
          </div>
          <ChevronRight
            className={`document-analysis-chevron ${
              expandedSections.compliance ? 'document-analysis-expanded' : ''
            }`}
          />
        </div>

        {expandedSections.compliance && (
          <>
            {compliances.length > 0 ? (
              compliances.map((c, idx) => {
                const key = `comp-${idx}`;
                const isOpen = expandedItems[key];
                return (
                  <div key={key} className="document-inner-dropdown">
                    <div
                      className={`document-inner-header ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleInner(key)}
                    >
                      <span>{truncateText(c.statement.wrongStatement, 40)}</span>
                      <ChevronRight
                        className={`document-inner-chevron ${isOpen ? 'rotate' : ''}`}
                      />
                    </div>

                    {isOpen && (
                      <div className="document-inner-content">
                        <p className="document-analysis-fact-statement">
                          "{truncateText(c.statement.wrongStatement, 100)}"
                        </p>

                        <div className="document-analysis-stats-container">
                          <div className="document-analysis-stat">
                            <span className="document-analysis-stat-label">Confidence:</span>
                            <span className="document-analysis-stat-value">
                              {' '}
                              {(c.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="document-analysis-stat">
                            <span className="document-analysis-stat-label">Verdict:</span>
                            <span className="document-analysis-stat-value document-analysis-mixed">
                              {c.verdict}
                            </span>
                          </div>
                        </div>

                        {c.policies?.length > 0 && (
                          <div className="document-analysis-sources-section">
                            <h4 className="document-analysis-sources-title">Policies Violated</h4>
                            {c.policies.map((p, pIdx) => (
                              <div key={pIdx} className="document-analysis-source-item">
                                <span>{p.name}</span>
                                <span>{p.date}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ marginLeft: '1rem' }}>No compliance issues found</p>
            )}
          </>
        )}
      </div>

      <div className="document-analysis-section">
        <div
          className={`document-analysis-section-header ${
            expandedSections.argumentLogic ? 'document-expanded' : ''
          }`}
          onClick={() => toggleSection('argumentLogic')}
        >
          <div className="document-analysis-section-title">
            <FileSearch className="document-analysis-icon" />
            <span>Argument Logic</span>
            {argumentLogics.length > 0 && (
              <span className="section-badge">{argumentLogics.length}</span>
            )}
          </div>
          <ChevronRight
            className={`document-analysis-chevron ${
              expandedSections.argumentLogic ? 'document-analysis-expanded' : ''
            }`}
          />
        </div>

        {expandedSections.argumentLogic && (
          <>
            {argumentLogics.length > 0 ? (
              argumentLogics.map((a, idx) => {
                const key = `arg-${idx}`;
                const isOpen = expandedItems[key];
                // Get first contradiction text for header display
                const firstSet = a.sets?.[0];
                const firstContradiction = firstSet?.contradictions?.[0];
                const headerText = firstContradiction?.line1?.text || `Argument Set ${idx + 1}`;

                return (
                  <div key={key} className="document-inner-dropdown">
                    <div
                      className={`document-inner-header ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleInner(key)}
                    >
                      <span>{truncateText(headerText, 40)}</span>
                      <ChevronRight
                        className={`document-inner-chevron ${isOpen ? 'rotate' : ''}`}
                      />
                    </div>

                    {isOpen && (
                      <div className="document-inner-content">
                        <div className="arguments-container">
                          {a.sets?.map((set, sIdx) => (
                            <div key={set.set_id || sIdx} className="argument">
                              {set.contradictions?.map((c, cIdx) => (
                                <div key={cIdx} style={{ marginBottom: '8px' }}>
                                  <p>{truncateText(c.line1?.text || '', 100)}</p>
                                  {c.line2?.text && (
                                    <p
                                      style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}
                                    >
                                      vs: {truncateText(c.line2.text, 80)}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <div className="argument-contracdiction">
                          <span className="document-analysis-stat-label">Contradiction Score:</span>
                          <span className="document-analysis-stat-value document-analysis-mixed">
                            {a.score}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ marginLeft: '1rem' }}>No contradictions detected</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
