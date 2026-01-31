'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Search, Sparkles, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// External imports
import ComplianceHoverCard from '../ComplianceHoverCard';
import FactHoverCard from '../FactHoverCard';
import ArgumentHoverCard from '../ArgumentHoverCard';

// Hooks
import { ExploreMoreService } from '@/features/explore-more/services/ExploreMore';
import { useLibraryDocuments } from '@/hooks/common/useLibraryDocuments';
import { useToast } from '@/lib/contexts/ToastContext';

// Store & Queries
import {
  useAnalysisSidebarStore,
  useAnalysisTabs,
  useAnalysisTabActions,
  useHoverCard,
  useSidebarCollapse,
  useDiscoverSearch,
} from '@/store/zustand/useAnalysisSidebarStore';
import {
  useFactsAnalysis,
  useComplianceAnalysis,
  useArgumentAnalysis,
  usePlagiarismAnalysis,
  useAiDetectionAnalysis,
} from '@/lib/api/queries/analysis';

// Types
import type {
  AnalysisSidebarProps,
  AnalysisShortcutActions,
  PlagiarismView,
  AnalysisSubTab,
} from '@/types/analysis-sidebar';
import type { FactChecker, Compliance, ArgumentLogic, CopilotResponse } from '@/types/copilot';

// Local components
import { AnalysisTab, DiscoverTab, PlagiarismTab, AITab } from './tabs';
import { extractTextFromHTML, LEGAL_TERMS, calculateViewportSafePosition } from './utils';

/**
 * AnalysisSidebar - Refactored with Zustand + TanStack Query
 *
 * Architecture:
 * - UI State: Zustand store (tabs, expansion, hover cards)
 * - Server/AI State: TanStack Query hooks
 * - No prop drilling for analysis results
 * - O(1) tab switching
 * - Request deduplication and caching
 */
export default function AnalysisSidebarRefactored({
  wordCount = 0,
  onCollapse,
  projectId,
  projectDocuments,
  uploadDataForAnalysis,
  onGetLatestData,
  percentage,
  fact,
  compliance,
  argumentLogic,
  expandedSections,
  setExpandedSections,
  toggleSection,
  setIsCopilotOpen,
  editorRef,
  tiptapEditor,
  setIsCollapsed: setIsCollapsedProp,
  isCollapsed: isCollapsedProp,
  factScore = 0,
  complianceScore = 0,
  argumentScore = 0,
  setCopilotData,
  templateType,
  analysisActionsRef,
}: AnalysisSidebarProps) {
  // Path detection
  const pathname = usePathname();
  const isAIDrafting = pathname?.includes('/AIDrafting') || false;

  // ========== ZUSTAND UI STATE ==========
  const { activeMainTab, analysisSubTab, plagiarismView } = useAnalysisTabs();
  const { setActiveMainTab, setAnalysisSubTab, setPlagiarismView } = useAnalysisTabActions();
  const { isCollapsed, setIsCollapsed, toggleCollapsed } = useSidebarCollapse();
  const { activeHoverCard, isHoveringCard, showHoverCard, hideHoverCard, setIsHoveringCard } =
    useHoverCard();
  const {
    searchQuery,
    setSearchQuery,
    showAutocomplete,
    setShowAutocomplete,
    autocompleteSuggestions,
    setAutocompleteSuggestions,
  } = useDiscoverSearch();

  // Get expansion state from store
  const expandedFactItems = useAnalysisSidebarStore((s) => s.expandedFactItems);
  const expandedComplianceItems = useAnalysisSidebarStore((s) => s.expandedComplianceItems);
  const expandedArgumentItems = useAnalysisSidebarStore((s) => s.expandedArgumentItems);
  const expandedPlagiarismItems = useAnalysisSidebarStore((s) => s.expandedPlagiarismItems);
  const expandedAiDetectionItems = useAnalysisSidebarStore((s) => s.expandedAiDetectionItems);
  const plagiarismUnifiedSourcesOpen = useAnalysisSidebarStore(
    (s) => s.plagiarismUnifiedSourcesOpen
  );
  const aiDetectionUnifiedSourcesOpen = useAnalysisSidebarStore(
    (s) => s.aiDetectionUnifiedSourcesOpen
  );

  // Get expansion actions
  const setExpandedFactItems = useAnalysisSidebarStore((s) => s.setExpandedFactItems);
  const setExpandedComplianceItems = useAnalysisSidebarStore((s) => s.setExpandedComplianceItems);
  const setExpandedArgumentItems = useAnalysisSidebarStore((s) => s.setExpandedArgumentItems);
  const setExpandedPlagiarismItems = useAnalysisSidebarStore((s) => s.setExpandedPlagiarismItems);
  const setExpandedAiDetectionItems = useAnalysisSidebarStore((s) => s.setExpandedAiDetectionItems);
  const setPlagiarismUnifiedSourcesOpen = useAnalysisSidebarStore(
    (s) => s.setPlagiarismUnifiedSourcesOpen
  );
  const setAiDetectionUnifiedSourcesOpen = useAnalysisSidebarStore(
    (s) => s.setAiDetectionUnifiedSourcesOpen
  );
  const clearAllExpanded = useAnalysisSidebarStore((s) => s.clearAllExpanded);

  // ========== TANSTACK QUERY HOOKS ==========
  const { addToast } = useToast();

  const factsQuery = useFactsAnalysis({
    projectId,
    onSuccess: (data) => {
      toggleSection('factChecker');
      setCopilotData?.((prev: CopilotResponse | null) => ({
        ...prev,
        fact: data.facts,
        factSummary: data.summary,
        projectId,
        Analysispercentage: percentage,
        factScore: data.score,
        compliance: prev?.compliance || null,
        argumentLogic: prev?.argumentLogic || null,
        complianceScore: prev?.complianceScore || 0,
        argumentScore: prev?.argumentScore || 0,
      }));
      addToast('Facts analysis completed successfully', 'success');
    },
    onError: (error) => {
      addToast(`Facts analysis failed: ${error.message}`, 'error');
    },
  });

  const complianceQuery = useComplianceAnalysis({
    projectId,
    onSuccess: (data) => {
      toggleSection('compliance');
      setCopilotData?.((prev: CopilotResponse | null) => ({
        ...prev,
        compliance: data.violations,
        projectId,
        Analysispercentage: percentage,
        complianceScore: data.score,
        fact: prev?.fact || null,
        argumentLogic: prev?.argumentLogic || null,
        factSummary: prev?.factSummary,
        factScore: prev?.factScore || 0,
        argumentScore: prev?.argumentScore || 0,
      }));
      if (data.violations.length === 0) {
        addToast('No compliance issues found. Document is fully compliant!', 'success');
      } else {
        addToast('Compliance analysis completed successfully', 'success');
      }
    },
    onError: (error) => {
      addToast(`Compliance analysis failed: ${error.message}`, 'error');
    },
  });

  const argumentQuery = useArgumentAnalysis({
    projectId,
    onSuccess: (data) => {
      toggleSection('argumentLogic');
      setCopilotData?.((prev: CopilotResponse | null) => ({
        ...prev,
        argumentLogic: data.argumentLogics[0] || null,
        projectId,
        Analysispercentage: percentage,
        argumentScore: data.score,
        fact: prev?.fact || null,
        compliance: prev?.compliance || null,
        factSummary: prev?.factSummary,
        factScore: prev?.factScore || 0,
        complianceScore: prev?.complianceScore || 0,
      }));
      if (data.argumentLogics.length === 0) {
        addToast('No logical contradictions found. Document has consistent arguments!', 'success');
      } else {
        addToast('Argument analysis completed successfully', 'success');
      }
    },
    onError: (error) => {
      addToast(`Argument analysis failed: ${error.message}`, 'error');
    },
  });

  const plagiarismQuery = usePlagiarismAnalysis({
    projectId,
    onSuccess: (data) => {
      if (data.sources.length === 0) {
        addToast('No plagiarism detected.', 'success');
      } else {
        addToast('Plagiarism check completed successfully', 'success');
      }
    },
    onError: (error) => {
      addToast(`Plagiarism check failed: ${error.message}`, 'error');
    },
  });

  const aiDetectionQuery = useAiDetectionAnalysis({
    projectId,
    onSuccess: (data) => {
      if (data.score === 0) {
        addToast('No AI content detected.', 'success');
      } else {
        addToast('AI detection completed successfully', 'success');
      }
    },
    onError: (error) => {
      addToast(`AI detection failed: ${error.message}`, 'error');
    },
  });

  // ========== DERIVED STATE ==========
  // Merge props with query results (props take precedence for backward compatibility)
  const localFacts = useMemo(() => {
    const queryFacts = factsQuery.facts;
    const propFacts = fact ? (Array.isArray(fact) ? fact : [fact]) : [];
    return queryFacts.length > 0 ? queryFacts : propFacts;
  }, [factsQuery.facts, fact]);

  const localCompliances = useMemo(() => {
    const queryViolations = complianceQuery.violations;
    const propCompliances = compliance
      ? Array.isArray(compliance)
        ? compliance
        : [compliance]
      : [];
    return queryViolations.length > 0 ? queryViolations : propCompliances;
  }, [complianceQuery.violations, compliance]);

  const localArgumentLogics = useMemo(() => {
    const queryArgs = argumentQuery.argumentLogics;
    const propArgs = argumentLogic
      ? Array.isArray(argumentLogic)
        ? argumentLogic
        : [argumentLogic]
      : [];
    return queryArgs.length > 0 ? queryArgs : propArgs;
  }, [argumentQuery.argumentLogics, argumentLogic]);

  // Loading states
  const factsLoading = factsQuery.isLoading;
  const complianceLoading = complianceQuery.isLoading;
  const argumentLoading = argumentQuery.isLoading;
  const plagiarismLoading = plagiarismQuery.isLoading;
  const aiDetectionLoading = aiDetectionQuery.isLoading;

  // Result visibility
  const showFactsResults = factsQuery.isSuccess || localFacts.length > 0;
  const showComplianceResults = complianceQuery.isSuccess || localCompliances.length > 0;
  const showArgumentResults = argumentQuery.isSuccess || localArgumentLogics.length > 0;
  const showPlagiarismResults = plagiarismQuery.isSuccess;
  const showAiDetectionResults = aiDetectionQuery.isSuccess;

  // ========== HOOKS ==========
  const { handleSearch, loading, items } = ExploreMoreService();
  const { uploadDocument, uploadMultipleDocuments } = useLibraryDocuments();

  // Recent searches
  const recentSearchesRef = useRef<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lawvriksh_recent_searches');
      if (stored) {
        recentSearchesRef.current = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  // Sync collapse state with prop
  useEffect(() => {
    if (isCollapsedProp !== isCollapsed) {
      setIsCollapsed(isCollapsedProp);
    }
  }, [isCollapsedProp, isCollapsed, setIsCollapsed]);

  // ========== HIGHLIGHTING FUNCTIONS ==========
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all TipTap highlights
  const clearTipTapHighlights = useCallback(() => {
    if (!tiptapEditor) return;

    const tr = tiptapEditor.state.tr;
    const doc = tiptapEditor.state.doc;
    let hasChanges = false;

    doc.descendants((node, pos) => {
      if (node.marks.some((mark) => mark.type.name === 'analysisHighlight')) {
        tr.removeMark(pos, pos + node.nodeSize, tiptapEditor.schema.marks.analysisHighlight);
        hasChanges = true;
      }
      return true;
    });

    if (hasChanges) {
      tr.setMeta('addToHistory', false);
      tiptapEditor.view.dispatch(tr);
    }
  }, [tiptapEditor]);

  // ========== ANALYSIS HANDLERS ==========
  const handleAnalyze = useCallback(
    async (type: string) => {
      if (!onGetLatestData) return;

      const latestData = await onGetLatestData();
      if (!latestData) {
        addToast('Could not get document content. Please try again.', 'error');
        return;
      }

      const contentText = typeof latestData === 'string' ? extractTextFromHTML(latestData) : '';

      if (!contentText.trim()) {
        addToast('Document is empty.', 'error');
        return;
      }

      try {
        switch (type) {
          case 'facts':
            await factsQuery.analyze(contentText);
            break;
          case 'compliances':
            await complianceQuery.analyze(contentText);
            break;
          case 'argumentLogic':
            await argumentQuery.analyze(contentText);
            break;
          case 'plagiarism':
            await plagiarismQuery.analyze(contentText);
            break;
          case 'ai-detection':
            await aiDetectionQuery.analyze(contentText);
            break;
          default:
            uploadDataForAnalysis?.(latestData, type);
        }
      } catch (error) {
        console.error(`Error in ${type} analysis:`, error);
        uploadDataForAnalysis?.(latestData, type);
      }
    },
    [
      onGetLatestData,
      factsQuery,
      complianceQuery,
      argumentQuery,
      plagiarismQuery,
      aiDetectionQuery,
      uploadDataForAnalysis,
      addToast,
    ]
  );

  const handleClear = useCallback(() => {
    // Clear TanStack Query results
    factsQuery.clear();
    complianceQuery.clear();
    argumentQuery.clear();
    plagiarismQuery.clear();
    aiDetectionQuery.clear();

    // Clear Zustand expansion state
    clearAllExpanded();

    // Clear parent copilot data
    setCopilotData?.(null);

    // Clear expanded sections
    setExpandedSections((prev) => ({
      factChecker: false,
      compliance: false,
      argumentLogic: false,
    }));

    // Clear highlights
    clearTipTapHighlights();
  }, [
    factsQuery,
    complianceQuery,
    argumentQuery,
    plagiarismQuery,
    aiDetectionQuery,
    clearAllExpanded,
    setCopilotData,
    setExpandedSections,
    clearTipTapHighlights,
  ]);

  // ========== SEARCH HANDLERS ==========
  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    try {
      let current = [...recentSearchesRef.current];
      current = current.filter((t: string) => t.toLowerCase() !== term.toLowerCase());
      current.unshift(term);
      current = current.slice(0, 10);
      localStorage.setItem('lawvriksh_recent_searches', JSON.stringify(current));
      recentSearchesRef.current = current;
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  }, []);

  const handleSearchClick = useCallback(
    (term?: string) => {
      const query = term || searchQuery;
      if (!query.trim()) return;
      saveRecentSearch(query);
      handleSearch(query);
      setShowAutocomplete(false);
      if (term) setSearchQuery(term);
    },
    [searchQuery, saveRecentSearch, handleSearch, setShowAutocomplete, setSearchQuery]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchQuery(val);

      if (!val.trim()) {
        setShowAutocomplete(false);
        return;
      }

      const allTerms = Array.from(new Set([...recentSearchesRef.current, ...LEGAL_TERMS]));
      const filtered = allTerms
        .filter((t) => t.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 6);
      setAutocompleteSuggestions(filtered);
      setShowAutocomplete(filtered.length > 0);
    },
    [setSearchQuery, setShowAutocomplete, setAutocompleteSuggestions]
  );

  const handleCollapse = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    setIsCollapsedProp(newCollapsed);
    onCollapse?.();
  }, [isCollapsed, setIsCollapsed, setIsCollapsedProp, onCollapse]);

  // ========== HOVER CARD HANDLERS ==========
  const onHoverCardEnter = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsHoveringCard(true);
  }, [setIsHoveringCard]);

  const onHoverCardLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      hideHoverCard();
    }, 500);
  }, [hideHoverCard]);

  // ========== SHORTCUT ACTIONS ==========
  useEffect(() => {
    if (!analysisActionsRef) return;

    const actions: AnalysisShortcutActions = {
      analyzeFacts: () => handleAnalyze('facts'),
      analyzeCompliances: () => handleAnalyze('compliances'),
      analyzeArguments: () => handleAnalyze('argumentLogic'),
      analyzePlagiarism: () => handleAnalyze('plagiarism'),
      analyzeAiDetection: () => handleAnalyze('ai-detection'),
      clearAnalysis: () => handleClear(),
      openAnalysisTab: () => setActiveMainTab('analysis'),
      openDiscoverTab: () => setActiveMainTab('discover'),
      openDocumentsTab: () => setActiveMainTab('documents'),
      openAiTab: () => setActiveMainTab('ai'),
      openPlagiarismTab: (view: PlagiarismView = 'ai-detection') => {
        setActiveMainTab('plagiarism');
        setPlagiarismView(view);
      },
      setAnalysisSubTab: (tab: AnalysisSubTab) => setAnalysisSubTab(tab),
      openDocumentUpload: () => {
        // Trigger document upload
      },
      openAnalysisUpload: () => {
        // Trigger analysis upload
      },
    };

    analysisActionsRef.current = actions;

    return () => {
      if (analysisActionsRef.current === actions) {
        analysisActionsRef.current = null;
      }
    };
  }, [
    analysisActionsRef,
    handleAnalyze,
    handleClear,
    setActiveMainTab,
    setPlagiarismView,
    setAnalysisSubTab,
  ]);

  // ========== ABORT ON UNMOUNT ==========
  useEffect(() => {
    return () => {
      factsQuery.abort();
      complianceQuery.abort();
      argumentQuery.abort();
      plagiarismQuery.abort();
      aiDetectionQuery.abort();
    };
  }, [factsQuery, complianceQuery, argumentQuery, plagiarismQuery, aiDetectionQuery]);

  // ========== RENDER ==========
  if (isCollapsed) {
    return (
      <div className="analysis-sidebar-collapsed">
        <button className="collapse-btn collapsed" onClick={handleCollapse}>
          <ChevronLeft size={16} />
        </button>
        <div className="analysis-sidebar-header-collapsed">
          <Image src={'/assets/svgs/analysis.svg'} alt="analysis" width={22} height={22} />
          <Search size={22} />
          <Image src={'/assets/svgs/file-2.svg'} alt="discover" width={22} height={22} />
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-sidebar">
      {/* Header with main tabs */}
      <div className="analysis-sidebar-header">
        <div className={`main-tabs ${isAIDrafting ? 'drafting-mode' : ''}`}>
          <button
            className={`main-tab ${activeMainTab === 'analysis' ? 'active' : 'inactive'}`}
            onClick={() => setActiveMainTab('analysis')}
          >
            <Sparkles size={16} strokeWidth={1.5} />
            <span>Analysis</span>
            {activeMainTab === 'analysis' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-[2px] left-0 right-0 h-0.5 bg-[#b48612]"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            className={`main-tab ${activeMainTab === 'discover' ? 'active' : 'inactive'}`}
            onClick={() => setActiveMainTab('discover')}
          >
            <Search size={16} strokeWidth={1.5} />
            <span>Discover</span>
            {activeMainTab === 'discover' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#b48612]"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            className={`main-tab ${activeMainTab === 'ai' ? 'active' : 'inactive'}`}
            onClick={() => setActiveMainTab('ai')}
          >
            <Sparkles size={18} strokeWidth={1.5} />
            <span>AI</span>
            {activeMainTab === 'ai' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-[2px] left-0 right-0 h-0.5 bg-[#b48612]"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          {!isAIDrafting && (
            <button
              className={`main-tab ${activeMainTab === 'plagiarism' ? 'active' : 'inactive'}`}
              onClick={() => {
                setActiveMainTab('plagiarism');
                setPlagiarismView('ai-detection');
              }}
            >
              <ShieldAlert size={16} strokeWidth={1.5} />
              <span>AI detections</span>
              {activeMainTab === 'plagiarism' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-[2px] left-0 right-0 h-0.5 bg-[#b48612]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="analysis-sidebar-content">
        {activeMainTab === 'analysis' && (
          <AnalysisTab
            analysisSubTab={analysisSubTab}
            setAnalysisSubTab={setAnalysisSubTab}
            toggleSection={toggleSection}
            wordCount={wordCount}
            showFactsResults={showFactsResults}
            showComplianceResults={showComplianceResults}
            showArgumentResults={showArgumentResults}
            factsLoading={factsLoading}
            complianceLoading={complianceLoading}
            argumentLoading={argumentLoading}
            handleAnalyze={handleAnalyze}
            handleClear={handleClear}
            localFacts={localFacts}
            localCompliances={localCompliances}
            localArgumentLogics={localArgumentLogics}
            factScore={factsQuery.score || factScore}
            complianceScore={complianceQuery.score || complianceScore}
            argumentScore={argumentQuery.score || argumentScore}
            expandedFactItems={expandedFactItems}
            expandedComplianceItems={expandedComplianceItems}
            expandedArgumentItems={expandedArgumentItems}
            setExpandedFactItems={setExpandedFactItems}
            setExpandedComplianceItems={setExpandedComplianceItems}
            setExpandedArgumentItems={setExpandedArgumentItems}
            correctionsApplied={factsQuery.correctionsApplied}
            replaceHighlightedText={() => {}}
            rejectFactCorrection={() => {}}
            handleResolveAll={() => {}}
            isAIDrafting={isAIDrafting}
            templateType={templateType}
            setMainTab={setActiveMainTab}
            setPlagiarismView={setPlagiarismView}
            plagiarismView={plagiarismView}
            plagiarismLoading={plagiarismLoading}
            showPlagiarismResults={showPlagiarismResults}
            plagiarismScore={plagiarismQuery.score}
            plagiarismSources={plagiarismQuery.sources}
            plagiarismTotalWords={plagiarismQuery.totalWords}
            plagiarismTextWordCounts={plagiarismQuery.textWordCounts}
            expandedPlagiarismItems={expandedPlagiarismItems}
            setExpandedPlagiarismItems={setExpandedPlagiarismItems}
            plagiarismUnifiedSourcesOpen={plagiarismUnifiedSourcesOpen}
            setPlagiarismUnifiedSourcesOpen={setPlagiarismUnifiedSourcesOpen}
            aiDetectionLoading={aiDetectionLoading}
            showAiDetectionResults={showAiDetectionResults}
            aiDetectionScore={aiDetectionQuery.score}
            aiDetectionSources={aiDetectionQuery.sources}
            aiDetectionTotalWords={aiDetectionQuery.totalWords}
            aiDetectionTextWordCounts={aiDetectionQuery.textWordCounts}
            expandedAiDetectionItems={expandedAiDetectionItems}
            setExpandedAiDetectionItems={setExpandedAiDetectionItems}
            aiDetectionUnifiedSourcesOpen={aiDetectionUnifiedSourcesOpen}
            setAiDetectionUnifiedSourcesOpen={setAiDetectionUnifiedSourcesOpen}
          />
        )}

        {activeMainTab === 'discover' && (
          <DiscoverTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearchChange={handleSearchChange}
            handleSearchClick={handleSearchClick}
            loading={loading}
            items={items}
            selectedItem={null}
            setSelectedItem={() => {}}
            projectDocuments={projectDocuments}
          />
        )}

        {activeMainTab === 'ai' && <AITab projectId={projectId} editor={tiptapEditor} />}

        {!isAIDrafting &&
          (activeMainTab === 'plagiarism' || activeMainTab === 'plagiarism_check') && (
            <PlagiarismTab
              plagiarismView={plagiarismView}
              setPlagiarismView={setPlagiarismView}
              wordCount={wordCount}
              handleClear={handleClear}
              showPlagiarismResults={showPlagiarismResults}
              plagiarismLoading={plagiarismLoading}
              plagiarismScore={plagiarismQuery.score}
              plagiarismSources={plagiarismQuery.sources}
              plagiarismTotalWords={plagiarismQuery.totalWords}
              plagiarismTextWordCounts={plagiarismQuery.textWordCounts}
              handleAnalyze={handleAnalyze}
              expandedPlagiarismItems={expandedPlagiarismItems}
              setExpandedPlagiarismItems={setExpandedPlagiarismItems}
              plagiarismUnifiedSourcesOpen={plagiarismUnifiedSourcesOpen}
              setPlagiarismUnifiedSourcesOpen={setPlagiarismUnifiedSourcesOpen}
              showAiDetectionResults={showAiDetectionResults}
              aiDetectionLoading={aiDetectionLoading}
              aiDetectionScore={aiDetectionQuery.score}
              aiDetectionSources={aiDetectionQuery.sources}
              aiDetectionTotalWords={aiDetectionQuery.totalWords}
              aiDetectionTextWordCounts={aiDetectionQuery.textWordCounts}
              expandedAiDetectionItems={expandedAiDetectionItems}
              setExpandedAiDetectionItems={setExpandedAiDetectionItems}
              aiDetectionUnifiedSourcesOpen={aiDetectionUnifiedSourcesOpen}
              setAiDetectionUnifiedSourcesOpen={setAiDetectionUnifiedSourcesOpen}
            />
          )}
      </div>

      {/* Hover Cards */}
      {activeHoverCard?.type === 'compliance' && (
        <ComplianceHoverCard
          complianceData={activeHoverCard.data}
          position={activeHoverCard.position}
          placement={activeHoverCard.placement}
          onClose={hideHoverCard}
          onMouseEnter={onHoverCardEnter}
          onMouseLeave={onHoverCardLeave}
        />
      )}

      {activeHoverCard?.type === 'fact' && (
        <FactHoverCard
          factData={activeHoverCard.data}
          position={activeHoverCard.position}
          factIndex={activeHoverCard.factIndex || 0}
          placement={activeHoverCard.placement}
          onClose={hideHoverCard}
          onMouseEnter={onHoverCardEnter}
          onMouseLeave={onHoverCardLeave}
          onAccept={() => {}}
          onDismiss={() => {}}
        />
      )}

      {activeHoverCard?.type === 'argument' && (
        <ArgumentHoverCard
          data={activeHoverCard.data}
          lineId={activeHoverCard.lineId || ''}
          text={activeHoverCard.text || ''}
          suggestion={activeHoverCard.suggestion}
          position={activeHoverCard.position}
          placement={activeHoverCard.placement}
          onClose={hideHoverCard}
          onMouseEnter={onHoverCardEnter}
          onMouseLeave={onHoverCardLeave}
          onAccept={() => {}}
        />
      )}
    </div>
  );
}
