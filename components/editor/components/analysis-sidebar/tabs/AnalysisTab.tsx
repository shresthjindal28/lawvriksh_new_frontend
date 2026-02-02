'use client';

import { X, Lightbulb, ShieldCheck, Copy, Brain } from 'lucide-react';
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
  aiDetectionSources: aiDetectionSourcesProp,
  aiDetectionTotalWords,
  aiDetectionTextWordCounts,
  expandedAiDetectionItems,
  setExpandedAiDetectionItems,
  aiDetectionUnifiedSourcesOpen,
  setAiDetectionUnifiedSourcesOpen,
}: AnalysisTabProps) {
  // Always show Plagiarism for this new UI if it's the writing section
  const showPlagiarismButton = true;
  //   templateType && ['research_paper', 'article', 'assignment'].includes(templateType);

  const showEmptyState =
    (analysisSubTab === 'facts' && !showFactsResults) ||
    (analysisSubTab === 'compliances' && !showComplianceResults && !showPlagiarismButton) ||
    (analysisSubTab === 'argument' && !showArgumentResults && localArgumentLogics.length === 0);

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 flex flex-col border border-gray-100 rounded-2xl p-4 bg-white overflow-hidden">
        {/* Feature Tabs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 ${
              analysisSubTab === 'facts'
                ? 'bg-[#6B8E7E] text-white shadow-sm'
                : 'bg-[#F5F5F7] text-gray-500 hover:bg-gray-200/50'
            }`}
            onClick={() => {
              setAnalysisSubTab('facts');
              toggleSection('factChecker');
            }}
          >
            <div
              className={`p-2 rounded-lg ${analysisSubTab === 'facts' ? 'bg-white/20' : 'bg-white'}`}
            >
              <ShieldCheck
                size={20}
                strokeWidth={1.5}
                className={analysisSubTab === 'facts' ? 'text-white' : 'text-gray-500'}
              />
            </div>
            <span className="text-dashboard-xs font-medium text-center">Facts Analysis</span>
          </button>

          <button
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 ${
              analysisSubTab === 'compliances'
                ? 'bg-[#6B8E7E] text-white shadow-sm'
                : 'bg-[#F5F5F7] text-gray-500 hover:bg-gray-200/50'
            }`}
            onClick={() => {
              setAnalysisSubTab('compliances');
              if (showPlagiarismButton && setPlagiarismView) {
                setPlagiarismView('check');
              } else {
                toggleSection('compliance');
              }
            }}
          >
            <div
              className={`p-2 rounded-lg ${analysisSubTab === 'compliances' ? 'bg-white/20' : 'bg-white'}`}
            >
              {showPlagiarismButton ? (
                <Copy
                  size={20}
                  strokeWidth={1.5}
                  className={analysisSubTab === 'compliances' ? 'text-white' : 'text-gray-500'}
                />
              ) : (
                <Image
                  src={'/assets/svgs/siren.svg'}
                  alt="compliance"
                  width={20}
                  height={20}
                  className={analysisSubTab === 'compliances' ? '' : 'opacity-50 grayscale'}
                />
              )}
            </div>
            <span className="text-dashboard-xs font-medium text-center">
              {showPlagiarismButton ? 'Plagiarism' : 'Compliances'}
            </span>
          </button>

          <button
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 ${
              analysisSubTab === 'argument'
                ? 'bg-[#6B8E7E] text-white shadow-sm'
                : 'bg-[#F5F5F7] text-gray-500 hover:bg-gray-200/50'
            }`}
            onClick={() => {
              setAnalysisSubTab('argument');
              toggleSection('argumentLogic');
            }}
          >
            <div
              className={`p-2 rounded-lg ${analysisSubTab === 'argument' ? 'bg-white/20' : 'bg-white'}`}
            >
              <Brain
                size={20}
                strokeWidth={1.5}
                className={analysisSubTab === 'argument' ? 'text-white' : 'text-gray-500'}
              />
            </div>
            <span className="text-dashboard-xs font-medium text-center">Arguments</span>
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
              <div className="flex flex-col flex-1">
                {/* Current Document Card */}
                <div className="bg-[#F5F5F7] rounded-xl p-5 flex flex-col mb-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col items-start text-left max-w-[70%]">
                      <p className="text-[17px] font-bold text-gray-900">Current Document</p>
                      <p className="text-dashboard-section-heading text-gray-500 mt-1 leading-relaxed">
                        The entire document content will be analyzed
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <p className="text-[28px] font-bold text-gray-900 leading-none">
                        {wordCount}
                      </p>
                      <p className="text-dashboard-section-heading text-gray-500 font-medium mt-1">
                        words
                      </p>
                    </div>
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
                      You can add your own rules by uploading the document with Compliance type in
                      the <strong>Documents</strong> tab.
                    </p>
                  </div>
                )}

                {/* Loader Section */}
                {((analysisSubTab === 'compliances' && complianceLoading) ||
                  (analysisSubTab === 'argument' && argumentLoading)) && (
                  <div className="flex justify-center my-8">
                    <VideoLoader width={80} height={80} />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-auto flex gap-3 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => handleClear()}
                    className="flex-1 h-[48px] px-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 bg-white"
                  >
                    <X size={18} />
                    <span>Clear</span>
                  </button>

                  {analysisSubTab === 'facts' && (
                    <button
                      className={`flex-[1.2] h-[48px] px-4 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        factsLoading ? 'bg-black/80 cursor-wait' : 'bg-black hover:bg-black/90'
                      }`}
                      disabled={factsLoading}
                      onClick={() => handleAnalyze('facts')}
                    >
                      {factsLoading ? 'Analyzing...' : 'Analyze Document'}
                    </button>
                  )}

                  {analysisSubTab === 'compliances' && (
                    <button
                      className={`flex-[1.2] h-[48px] px-4 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        complianceLoading ? 'bg-black/80 cursor-wait' : 'bg-black hover:bg-black/90'
                      }`}
                      disabled={complianceLoading}
                      onClick={() => handleAnalyze('compliances')}
                    >
                      {complianceLoading ? 'Analyzing...' : 'Analyze Document'}
                    </button>
                  )}

                  {analysisSubTab === 'argument' && (
                    <button
                      className={`flex-[1.2] h-[48px] px-4 rounded-xl text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        argumentLoading ? 'bg-black/80 cursor-wait' : 'bg-black hover:bg-black/90'
                      }`}
                      disabled={argumentLoading}
                      onClick={() => handleAnalyze('argumentLogic')}
                    >
                      {argumentLoading ? 'Analyzing...' : 'Analyze Document'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {!showEmptyState && (
              <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth">
                {analysisSubTab === 'facts' && showFactsResults && (
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
