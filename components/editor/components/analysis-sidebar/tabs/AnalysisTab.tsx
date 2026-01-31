'use client';

import { X, Lightbulb, ShieldCheck, Copy } from 'lucide-react';
import Image from 'next/image';
import type {
  AnalysisSubTab,
  MainTab,
  PlagiarismView,
  PlagiarismSource,
  SimpleSetter,
} from '@/types/analysis-sidebar';
import type { FactChecker, Compliance, ArgumentLogic } from '@/types/copilot';
import type { DocumentType } from '@/types/project';
import VideoLoader from '@/components/ui/VideoLoader';
import { ComplianceAnalysis, ArgumentAnalysis, FactsAnalysis } from '../analysis';
import PlagiarismTab from './PlagiarismTab';

interface AnalysisTabProps {
  analysisSubTab: AnalysisSubTab;
  setAnalysisSubTab: SimpleSetter<AnalysisSubTab>;
  toggleSection: (section: string) => void;
  wordCount: number;
  showFactsResults: boolean;
  showComplianceResults: boolean;
  showArgumentResults: boolean;
  factsLoading: boolean;
  complianceLoading: boolean;
  argumentLoading: boolean;
  handleAnalyze: (type: string) => void;
  handleClear: () => void;
  localFacts: FactChecker[];
  localCompliances: Compliance[];
  localArgumentLogics: ArgumentLogic[];
  factScore: number;
  complianceScore: number;
  argumentScore: number;
  expandedFactItems: Record<string, boolean>;
  expandedComplianceItems: Record<string, boolean>;
  expandedArgumentItems: Record<string, boolean>;
  setExpandedFactItems: SimpleSetter<Record<string, boolean>>;
  setExpandedComplianceItems: SimpleSetter<Record<string, boolean>>;
  setExpandedArgumentItems: SimpleSetter<Record<string, boolean>>;
  correctionsApplied: number;
  replaceHighlightedText: (
    blockId: string,
    correctedText: string,
    type: string,
    factIndex: number
  ) => void;
  rejectFactCorrection: (factIndex: number) => void;
  handleResolveAll: (type: string) => void;
  isAIDrafting?: boolean;
  templateType?: DocumentType;
  setMainTab?: SimpleSetter<MainTab>;
  // Plagiarism Props
  setPlagiarismView?: SimpleSetter<PlagiarismView>;
  plagiarismView?: PlagiarismView;
  plagiarismLoading?: boolean;
  showPlagiarismResults?: boolean;
  plagiarismScore?: number;
  plagiarismSources?: PlagiarismSource[];
  plagiarismTotalWords?: number;
  plagiarismTextWordCounts?: number;
  expandedPlagiarismItems?: Record<string, boolean>;
  setExpandedPlagiarismItems?: SimpleSetter<Record<string, boolean>>;
  plagiarismUnifiedSourcesOpen?: boolean;
  setPlagiarismUnifiedSourcesOpen?: SimpleSetter<boolean>;
  aiDetectionLoading?: boolean;
  showAiDetectionResults?: boolean;
  aiDetectionScore?: number;
  aiDetectionSources?: PlagiarismSource[];
  aiDetectionTotalWords?: number;
  aiDetectionTextWordCounts?: number;
  expandedAiDetectionItems?: Record<string, boolean>;
  setExpandedAiDetectionItems?: SimpleSetter<Record<string, boolean>>;
  aiDetectionUnifiedSourcesOpen?: boolean;
  setAiDetectionUnifiedSourcesOpen?: SimpleSetter<boolean>;
}

export default function AnalysisTab({
  analysisSubTab,
  setAnalysisSubTab,
  toggleSection,
  wordCount,
  showFactsResults,
  showComplianceResults,
  showArgumentResults,
  factsLoading,
  complianceLoading,
  argumentLoading,
  handleAnalyze,
  handleClear,
  localFacts,
  localCompliances,
  localArgumentLogics,
  factScore,
  complianceScore,
  argumentScore,
  expandedFactItems,
  expandedComplianceItems,
  expandedArgumentItems,
  setExpandedFactItems,
  setExpandedComplianceItems,
  setExpandedArgumentItems,
  correctionsApplied,
  replaceHighlightedText,
  rejectFactCorrection,
  handleResolveAll,
  isAIDrafting = false,
  templateType,
  setMainTab,
  setPlagiarismView,
  plagiarismView,
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
}: AnalysisTabProps) {
  // Check if project type excludes compliance
  const showPlagiarismButton =
    templateType && ['research_paper', 'article', 'assignment'].includes(templateType);

  const showEmptyState =
    (analysisSubTab === 'facts' && !showFactsResults) ||
    (analysisSubTab === 'compliances' && !showComplianceResults && !showPlagiarismButton) ||
    (analysisSubTab === 'argument' && !showArgumentResults && localArgumentLogics.length === 0);

  return (
    <div className="analysis-results-container">
      {/* Feature Tabs */}
      <div className="feature-tabs-grid">
        {!isAIDrafting && (
          <button
            className={`feature-tab-btn ${analysisSubTab === 'facts' ? 'active' : 'inactive'}`}
            onClick={() => {
              setAnalysisSubTab('facts');
              toggleSection('factChecker');
            }}
          >
            <ShieldCheck size={24} strokeWidth={1.5} />
            <span className="feature-tab-btn-text">Facts Analysis</span>
          </button>
        )}
        {showPlagiarismButton ? (
          <button
            className={`feature-tab-btn ${
              analysisSubTab === 'compliances' ? 'active' : 'inactive'
            }`}
            onClick={() => {
              setAnalysisSubTab('compliances');
              if (setPlagiarismView) {
                setPlagiarismView('check');
              }
            }}
          >
            <Copy size={24} strokeWidth={1.5} />
            <span className="feature-tab-btn-text">Plagiarism</span>
          </button>
        ) : (
          <button
            className={`feature-tab-btn ${
              analysisSubTab === 'compliances' ? 'active' : 'inactive'
            }`}
            onClick={() => {
              setAnalysisSubTab('compliances');
              toggleSection('compliance');
            }}
          >
            <Image
              src={'/assets/svgs/siren.svg'}
              alt="compliance"
              width={24}
              height={24}
              style={{
                filter: analysisSubTab === 'compliances' ? 'brightness(0) invert(1)' : 'none',
              }}
            />
            <span className="feature-tab-btn-text">Compliances</span>
          </button>
        )}

        <button
          className={`feature-tab-btn ${analysisSubTab === 'argument' ? 'active' : 'inactive'}`}
          onClick={() => {
            setAnalysisSubTab('argument');
            toggleSection('argumentLogic');
          }}
        >
          <Image
            src={'/assets/svgs/brain-circuit.svg'}
            alt="arguments"
            width={24}
            height={24}
            style={{
              filter: analysisSubTab === 'argument' ? 'brightness(0) invert(1)' : 'none',
            }}
          />
          <span className="feature-tab-btn-text">Arguments</span>
        </button>
      </div>

      {showPlagiarismButton && analysisSubTab === 'compliances' ? (
        <PlagiarismTab
          plagiarismView={plagiarismView || 'check'}
          setPlagiarismView={setPlagiarismView || (() => {})}
          wordCount={wordCount}
          handleAnalyze={handleAnalyze}
          handleClear={handleClear}
          plagiarismLoading={plagiarismLoading || false}
          showPlagiarismResults={showPlagiarismResults || false}
          plagiarismScore={plagiarismScore || 0}
          plagiarismSources={plagiarismSources || []}
          plagiarismTotalWords={plagiarismTotalWords || 0}
          plagiarismTextWordCounts={plagiarismTextWordCounts || 0}
          expandedPlagiarismItems={expandedPlagiarismItems || {}}
          setExpandedPlagiarismItems={setExpandedPlagiarismItems || (() => {})}
          plagiarismUnifiedSourcesOpen={plagiarismUnifiedSourcesOpen || false}
          setPlagiarismUnifiedSourcesOpen={setPlagiarismUnifiedSourcesOpen || (() => {})}
          aiDetectionLoading={aiDetectionLoading || false}
          showAiDetectionResults={showAiDetectionResults || false}
          aiDetectionScore={aiDetectionScore || 0}
          aiDetectionSources={aiDetectionSources || []}
          aiDetectionTotalWords={aiDetectionTotalWords || 0}
          aiDetectionTextWordCounts={aiDetectionTextWordCounts || 0}
          expandedAiDetectionItems={expandedAiDetectionItems || {}}
          setExpandedAiDetectionItems={setExpandedAiDetectionItems || (() => {})}
          aiDetectionUnifiedSourcesOpen={aiDetectionUnifiedSourcesOpen || false}
          setAiDetectionUnifiedSourcesOpen={setAiDetectionUnifiedSourcesOpen || (() => {})}
        />
      ) : (
        <>
          {/* Empty State with Document Info and Analyze Button */}
          {showEmptyState && (
            <>
              {/* Current Document Card */}
              <div className="current-doc-card">
                <div className="current-doc-info">
                  <p className="current-doc-title">Current Document</p>
                  <p className="current-doc-subtitle">
                    The entire document content will be analyzed
                  </p>
                </div>
                <div className="current-doc-stats-container">
                  <p className="current-doc-count">{wordCount}</p>
                  <p className="current-doc-unit">words</p>
                </div>
              </div>

              {/* Compliance Tip */}
              {analysisSubTab === 'compliances' && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '10px',
                  }}
                >
                  <Lightbulb size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5', margin: 0 }}>
                    You can add your own rules by uploading the document with Compliance type in the{' '}
                    <strong>Documents</strong> tab.
                  </p>
                </div>
              )}

              {/* Loader Section */}
              {((analysisSubTab === 'compliances' && complianceLoading) ||
                (analysisSubTab === 'argument' && argumentLoading)) && (
                <div className="analysis-center-loader-container">
                  <VideoLoader width={80} height={80} />
                </div>
              )}

              {/* Divider */}
              <div className="sidebar-divider" />

              {/* Action Buttons */}
              <div className="action-btns-container">
                <button onClick={() => handleClear()} className="action-btn-clear">
                  <X size={16} />
                  <span>Clear</span>
                </button>

                {analysisSubTab === 'facts' && (
                  <button
                    className={`action-btn-analyze ${factsLoading ? 'loading' : 'active'}`}
                    disabled={factsLoading}
                    onClick={() => handleAnalyze('facts')}
                  >
                    {factsLoading ? 'Analyzing...' : 'Analyze Document'}
                  </button>
                )}

                {analysisSubTab === 'compliances' && (
                  <button
                    className={`action-btn-analyze ${complianceLoading ? 'loading' : 'active'}`}
                    disabled={complianceLoading}
                    onClick={() => handleAnalyze('compliances')}
                  >
                    {complianceLoading ? 'Analyzing...' : 'Analyze Document'}
                  </button>
                )}

                {analysisSubTab === 'argument' && (
                  <button
                    className={`action-btn-analyze ${argumentLoading ? 'loading' : 'active'}`}
                    disabled={argumentLoading}
                    onClick={() => handleAnalyze('argumentLogic')}
                  >
                    {argumentLoading ? 'Analyzing...' : 'Analyze Document'}
                  </button>
                )}
              </div>
            </>
          )}

          {/* Analysis Results */}
          <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth analysis-tab-content">
            {!isAIDrafting && analysisSubTab === 'facts' && showFactsResults && (
              <FactsAnalysis
                localFacts={localFacts}
                factScore={factScore}
                wordCount={wordCount}
                factsLoading={factsLoading}
                expandedFactItems={expandedFactItems}
                setExpandedFactItems={setExpandedFactItems}
                handleAnalyze={handleAnalyze}
                replaceHighlightedText={replaceHighlightedText}
                rejectFactCorrection={rejectFactCorrection}
                correctionsApplied={correctionsApplied}
                handleResolveAll={handleResolveAll}
              />
            )}

            {analysisSubTab === 'compliances' && showComplianceResults && (
              <ComplianceAnalysis
                localCompliances={localCompliances}
                complianceScore={complianceScore}
                wordCount={wordCount}
                complianceLoading={complianceLoading}
                expandedComplianceItems={expandedComplianceItems}
                setExpandedComplianceItems={setExpandedComplianceItems}
                handleAnalyze={handleAnalyze}
              />
            )}

            {analysisSubTab === 'argument' && showArgumentResults && (
              <ArgumentAnalysis
                localArgumentLogics={localArgumentLogics}
                argumentScore={argumentScore}
                wordCount={wordCount}
                argumentLoading={argumentLoading}
                handleAnalyze={handleAnalyze}
                handleResolveAll={handleResolveAll}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
