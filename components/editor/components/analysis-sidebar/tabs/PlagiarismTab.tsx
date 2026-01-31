'use client';

import { X, ChevronRight, RotateCcw, ExternalLink } from 'lucide-react';
import type { PlagiarismView, PlagiarismSource, SimpleSetter } from '@/types/analysis-sidebar';
import VideoLoader from '@/components/ui/VideoLoader';
import { truncateText } from '../utils';
import { AnalysisScoreCard, NoIssuesFound } from '../shared';

interface PlagiarismTabProps {
  plagiarismView: PlagiarismView;
  setPlagiarismView: SimpleSetter<PlagiarismView>;
  wordCount: number;
  handleAnalyze: (type: string) => void;
  handleClear: () => void;
  // Plagiarism Check state
  plagiarismLoading: boolean;
  showPlagiarismResults: boolean;
  plagiarismScore: number;
  plagiarismSources: PlagiarismSource[];
  plagiarismTotalWords: number;
  plagiarismTextWordCounts: number;
  expandedPlagiarismItems: Record<string, boolean>;
  setExpandedPlagiarismItems: SimpleSetter<Record<string, boolean>>;
  plagiarismUnifiedSourcesOpen: boolean;
  setPlagiarismUnifiedSourcesOpen: SimpleSetter<boolean>;
  // AI Detection state
  aiDetectionLoading: boolean;
  showAiDetectionResults: boolean;
  aiDetectionScore: number;
  aiDetectionSources: PlagiarismSource[];
  aiDetectionTotalWords: number;
  aiDetectionTextWordCounts: number;
  expandedAiDetectionItems: Record<string, boolean>;
  setExpandedAiDetectionItems: SimpleSetter<Record<string, boolean>>;
  aiDetectionUnifiedSourcesOpen: boolean;
  setAiDetectionUnifiedSourcesOpen: SimpleSetter<boolean>;
}

// Reusable component for rendering sources in plagiarism/AI detection
const UnifiedSourcesCard = ({
  sources,
  isOpen,
  onToggle,
}: {
  sources: Array<{ url: string; title: string }>;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  if (sources.length === 0) return null;

  return (
    <div className={`issue-item-card ${isOpen ? 'open' : ''}`}>
      <button onClick={onToggle} className="issue-item-button">
        <div className="issue-content-wrapper">
          <div className="issue-header-row">
            <span className="issue-verdict-text green">Sources ({sources.length})</span>
          </div>
          <p className="issue-text-preview">All detected source links</p>
        </div>
        <div className="issue-chevron-wrapper">
          <ChevronRight size={20} className={`issue-chevron ${isOpen ? 'open' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="issue-details-panel">
          <div className="issue-sources-section">
            <div className="issue-sources-list">
              {sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="issue-source-link"
                >
                  <div className="issue-source-content">
                    <ExternalLink size={14} className="issue-source-icon" />
                    <div className="issue-source-text-wrap">
                      <p className="issue-source-name">{src.title}</p>
                      <p className="issue-source-url">{src.url}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable component for rendering issue items
const IssuesList = ({
  sources,
  totalWords,
  expandedItems,
  setExpandedItems,
  keyPrefix,
  emptyTitle,
  emptyDescription,
}: {
  sources: PlagiarismSource[];
  totalWords: number;
  expandedItems: Record<string, boolean>;
  setExpandedItems: SimpleSetter<Record<string, boolean>>;
  keyPrefix: string;
  emptyTitle: string;
  emptyDescription: string;
}) => {
  // Group sources by URL
  const grouped = new Map<
    string,
    {
      url: string;
      title: string;
      sequences: string[];
      score?: number;
      plagiarism_words: number;
    }
  >();

  sources.forEach((s) => {
    const url = s.url || '';
    const title = s.title || 'Source';
    const existing = grouped.get(url);
    const sequences = (s.plagiarism_found || []).map((p) => p.sequence).filter(Boolean);
    const words = s.plagiarism_words || 0;

    if (!existing) {
      grouped.set(url, {
        url,
        title,
        sequences,
        score: typeof s.score === 'number' ? s.score : undefined,
        plagiarism_words: words,
      });
    } else {
      existing.sequences.push(...sequences);
      existing.plagiarism_words += words;
      if (typeof s.score === 'number' && !Number.isNaN(s.score)) {
        const prev = typeof existing.score === 'number' ? existing.score : 0;
        existing.score = Math.max(prev, s.score);
      }
    }
  });

  const items = Array.from(grouped.values())
    .map((g) => {
      const computedScore =
        typeof g.score === 'number' && !Number.isNaN(g.score)
          ? Math.round(g.score)
          : Math.round(((g.plagiarism_words || 0) / totalWords) * 100);
      return { ...g, computedScore };
    })
    .filter((g) => g.computedScore > 0);

  if (items.length === 0) {
    return <NoIssuesFound title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {items.map((g, idx) => {
        const key = `${keyPrefix}-${idx}`;
        const isOpen = expandedItems[key];
        const statusColor = 'red';
        const firstSequence = g.sequences[0] || g.title || 'Content detected';

        return (
          <div key={key} className={`issue-item-card ${isOpen ? 'open' : ''}`}>
            <button
              onClick={() => {
                setExpandedItems({
                  ...expandedItems,
                  [key]: !expandedItems[key],
                });
              }}
              className="issue-item-button"
            >
              <div className={`issue-badge-container ${statusColor}`}>
                <div className={`issue-badge-dot ${statusColor}`} />
              </div>
              <div className="issue-content-wrapper">
                <div className="issue-header-row">
                  <span className={`issue-verdict-text ${statusColor}`}>{g.computedScore}%</span>
                </div>
                <p className="issue-text-preview">{truncateText(firstSequence, 100)}</p>
              </div>
              <div className="issue-chevron-wrapper">
                <ChevronRight size={20} className={`issue-chevron ${isOpen ? 'open' : ''}`} />
              </div>
            </button>
            {isOpen && (
              <div className="issue-details-panel">
                <div className="issue-sources-section">
                  <div className="issue-sources-list">
                    <a
                      href={g.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="issue-source-link"
                    >
                      <div className="issue-source-content">
                        <ExternalLink size={14} className="issue-source-icon" />
                        <div className="issue-source-text-wrap">
                          <p className="issue-source-name">{g.title}</p>
                          <p className="issue-source-url">{g.url}</p>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
                {g.sequences && g.sequences.length > 0 && (
                  <div className="issue-sources-section">
                    {g.sequences.map((seq, i) => (
                      <p key={i} className="issue-text-preview">
                        {truncateText(seq, 180)}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default function PlagiarismTab({
  plagiarismView,
  setPlagiarismView,
  wordCount,
  handleAnalyze,
  handleClear,
  plagiarismLoading,
  showPlagiarismResults,
  plagiarismScore,
  plagiarismSources,
  plagiarismTotalWords,
  plagiarismTextWordCounts,
  expandedPlagiarismItems,
  setExpandedPlagiarismItems,
  plagiarismUnifiedSourcesOpen,
  setPlagiarismUnifiedSourcesOpen,
  aiDetectionLoading,
  showAiDetectionResults,
  aiDetectionScore,
  aiDetectionSources,
  aiDetectionTotalWords,
  aiDetectionTextWordCounts,
  expandedAiDetectionItems,
  setExpandedAiDetectionItems,
  aiDetectionUnifiedSourcesOpen,
  setAiDetectionUnifiedSourcesOpen,
}: PlagiarismTabProps) {
  // Get unique sources for unified display
  const getUniqueSources = (sources: PlagiarismSource[]) => {
    const map = new Map<string, { url: string; title: string }>();
    sources.forEach((s) => {
      if (s.url && !map.has(s.url)) {
        map.set(s.url, { url: s.url, title: s.title || 'Source' });
      }
    });
    return Array.from(map.values());
  };

  return (
    <>
      {plagiarismView === 'ai-detection' ? (
        !showAiDetectionResults ? (
          <>
            <div className="current-doc-card">
              <div className="current-doc-info">
                <p className="current-doc-title">Current Document</p>
                <p className="current-doc-subtitle">The entire document content will be analyzed</p>
              </div>
              <div className="current-doc-stats-container">
                <p className="current-doc-count">{wordCount}</p>
                <p className="current-doc-unit">words</p>
              </div>
            </div>

            {aiDetectionLoading && (
              <div className="analysis-center-loader-container">
                <VideoLoader width={80} height={80} />
              </div>
            )}

            <div className="sidebar-divider" />

            <div className="action-btns-container">
              <button onClick={() => handleClear()} className="action-btn-clear">
                <X size={16} />
                <span>Clear</span>
              </button>
              <button
                className={`action-btn-analyze ${aiDetectionLoading ? 'loading' : 'active'}`}
                disabled={aiDetectionLoading}
                onClick={() => handleAnalyze('ai-detection')}
              >
                {aiDetectionLoading ? 'Analyzing...' : 'Analyze Document'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto analysis-tab-content">
            <AnalysisScoreCard
              score={Number.isNaN(aiDetectionScore) ? 0 : aiDetectionScore}
              description="AI Probability Score"
              stats={[
                { label: 'AI Words', value: aiDetectionTotalWords },
                {
                  label: 'Total Words',
                  value: aiDetectionTextWordCounts || wordCount || 0,
                },
              ]}
              reverseColors={true}
            />

            <UnifiedSourcesCard
              sources={getUniqueSources(aiDetectionSources)}
              isOpen={aiDetectionUnifiedSourcesOpen}
              onToggle={() => setAiDetectionUnifiedSourcesOpen(!aiDetectionUnifiedSourcesOpen)}
            />

            <div className="issues-list-container">
              <IssuesList
                sources={aiDetectionSources}
                totalWords={aiDetectionTextWordCounts || wordCount || 1}
                expandedItems={expandedAiDetectionItems}
                setExpandedItems={setExpandedAiDetectionItems}
                keyPrefix="ai-det"
                emptyTitle="No AI Content Detected"
                emptyDescription="Your document appears to be written by a human."
              />
            </div>

            <div className="sticky-bottom-actions">
              <button
                className="analysis-rerun-action-btn"
                onClick={() => handleAnalyze('ai-detection')}
                disabled={aiDetectionLoading}
              >
                <RotateCcw size={16} />
                {aiDetectionLoading ? 'Rerunning...' : 'Rerun Analysis'}
              </button>
            </div>
          </div>
        )
      ) : !showPlagiarismResults ? (
        <>
          <div className="current-doc-card">
            <div className="current-doc-info">
              <p className="current-doc-title">Current Document</p>
              <p className="current-doc-subtitle">The entire document content will be analyzed</p>
            </div>
            <div className="current-doc-stats-container">
              <p className="current-doc-count">{wordCount}</p>
              <p className="current-doc-unit">words</p>
            </div>
          </div>

          {plagiarismLoading && (
            <div className="analysis-center-loader-container">
              <VideoLoader width={80} height={80} />
            </div>
          )}

          <div className="sidebar-divider" />

          <div className="action-btns-container">
            <button onClick={() => handleClear()} className="action-btn-clear">
              <X size={16} />
              <span>Clear</span>
            </button>
            <button
              className={`action-btn-analyze ${plagiarismLoading ? 'loading' : 'active'}`}
              disabled={plagiarismLoading}
              onClick={() => handleAnalyze('plagiarism')}
            >
              {plagiarismLoading ? 'Analyzing...' : 'Analyze Document'}
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto analysis-tab-content">
          <AnalysisScoreCard
            score={Number.isNaN(plagiarismScore) ? 0 : plagiarismScore}
            description="Plagiarism Score"
            stats={[
              { label: 'Plagiarized Words', value: plagiarismTotalWords },
              {
                label: 'Total Words',
                value: plagiarismTextWordCounts || wordCount || 0,
              },
            ]}
            reverseColors={true}
          />

          <UnifiedSourcesCard
            sources={getUniqueSources(plagiarismSources)}
            isOpen={plagiarismUnifiedSourcesOpen}
            onToggle={() => setPlagiarismUnifiedSourcesOpen(!plagiarismUnifiedSourcesOpen)}
          />

          <div className="issues-list-container">
            <IssuesList
              sources={plagiarismSources}
              totalWords={plagiarismTextWordCounts || wordCount || 1}
              expandedItems={expandedPlagiarismItems}
              setExpandedItems={setExpandedPlagiarismItems}
              keyPrefix="plag"
              emptyTitle="No Plagiarism Detected"
              emptyDescription="Your document does not contain plagiarized content."
            />
          </div>

          <div className="sticky-bottom-actions">
            <button
              className="analysis-rerun-action-btn"
              onClick={() => handleAnalyze('plagiarism')}
              disabled={plagiarismLoading}
            >
              <RotateCcw size={16} />
              {plagiarismLoading ? 'Rerunning...' : 'Rerun to Refresh Score'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
