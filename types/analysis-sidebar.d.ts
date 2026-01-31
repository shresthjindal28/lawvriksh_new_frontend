import type React from 'react';
import type { Editor } from '@tiptap/react';
import type { Document } from '@/lib/validators/library-documents/response';
import type {
  ArgumentLogic,
  Compliance,
  CopilotResponse,
  FactChecker,
  FactCheckSummary,
} from './copilot';
import type { ExploreItem } from './explore';

import type { DocumentType } from './project';

// ========== ANALYSIS SIDEBAR TYPES ==========

export type MainTab =
  | 'analysis'
  | 'discover'
  | 'documents'
  | 'plagiarism'
  | 'plagiarism_check'
  | 'ai';
export type AnalysisSubTab = 'facts' | 'compliances' | 'argument';
export type PlagiarismView = 'selection' | 'ai-detection' | 'check';

export interface AnalysisSidebarProps {
  wordCount?: number;
  onAnalyze?: () => void;
  onClear?: () => void;
  onCollapse?: () => void;
  projectId: string;
  projectDocuments?: Document[];
  documentsLoading: boolean;
  uploadDataForAnalysis?: (data: string, type: string) => void;
  onGetLatestData?: () => Promise<string | null>;
  percentage: number;
  fact?: FactChecker | FactChecker[] | null;
  compliance?: Compliance | Compliance[] | null;
  argumentLogic?: ArgumentLogic | ArgumentLogic[] | null;
  factSummary?: FactCheckSummary;
  onClearFactHighlights?: () => void;
  onRestoreFactHighlights?: () => void;
  expandedSections: {
    [key: string]: boolean;
  };
  setExpandedSections: React.Dispatch<
    React.SetStateAction<{
      [key: string]: boolean;
    }>
  >;
  toggleSection: (section: string) => void;
  setIsCopilotOpen: React.Dispatch<React.SetStateAction<boolean>>;
  analysisLoading?: boolean;
  editorRef?: React.RefObject<HTMLDivElement | null>;
  tiptapEditor?: Editor | null;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isCollapsed: boolean;
  factScore?: number;
  complianceScore?: number;
  argumentScore?: number;
  setCopilotData?: React.Dispatch<React.SetStateAction<CopilotResponse | null>>;
  templateType?: DocumentType;
  analysisActionsRef?: React.MutableRefObject<AnalysisShortcutActions | null>;
}

export interface AnalysisShortcutActions {
  analyzeFacts: () => void;
  analyzeCompliances: () => void;
  analyzeArguments: () => void;
  analyzePlagiarism: () => void;
  analyzeAiDetection: () => void;
  clearAnalysis: () => void;
  openAnalysisTab: () => void;
  openDiscoverTab: () => void;
  openDocumentsTab: () => void;
  openAiTab: () => void;
  openPlagiarismTab: (view?: PlagiarismView) => void;
  setAnalysisSubTab: (tab: AnalysisSubTab) => void;
  openDocumentUpload: () => void;
  openAnalysisUpload: () => void;
}

// ========== PLAGIARISM TYPES ==========

export interface PlagiarismFound {
  sequence: string;
}

export interface PlagiarismSource {
  score: number;
  url: string;
  title: string;
  plagiarism_words: number;
  plagiarism_found: PlagiarismFound[];
}

export interface PlagiarismState {
  loading: boolean;
  showResults: boolean;
  score: number;
  sources: PlagiarismSource[];
  sourceCounts: number;
  totalWords: number;
  textWordCounts: number;
  expandedItems: Record<string, boolean>;
  unifiedSourcesOpen: boolean;
}

// ========== HOVER CARD TYPES ==========

export interface HoverCardPosition {
  x: number;
  y: number;
}

export interface ComplianceHoverCardState {
  data: any;
  position: HoverCardPosition;
  placement?: 'top' | 'bottom';
}

export interface FactHoverCardState {
  data: any;
  position: HoverCardPosition;
  placement?: 'top' | 'bottom';
  factIndex: number;
}

export interface ArgumentHoverCardState {
  data: any;
  position: HoverCardPosition;
  placement?: 'top' | 'bottom';
  lineId: string;
  text: string;
  suggestion?: string;
}

// ========== SETTER TYPE ==========
// Use simplified setter types that work with both React useState and Zustand
export type SimpleSetter<T> = (value: T) => void;

// ========== ANALYSIS TAB PROPS ==========

export interface AnalysisTabProps {
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
}

// ========== DISCOVER TAB PROPS ==========

export interface DiscoverTabProps {
  searchQuery: string;
  setSearchQuery: SimpleSetter<string>;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchClick: (term?: string) => void;
  loading: boolean;
  items: ExploreItem[];
  selectedItem: ExploreItem | null;
  setSelectedItem: SimpleSetter<ExploreItem | null>;
  projectDocuments?: Document[];
}

// ========== DOCUMENTS TAB PROPS ==========

export interface AnalysisDocument {
  id: string;
  fileName: string;
  documentType: 'compliance' | 'general';
  status?: string;
  createdAt: string;
}

export interface DocumentsTabProps {
  documentSearchQuery: string;
  setDocumentSearchQuery: SimpleSetter<string>;
  analysisDocuments: AnalysisDocument[];
  analysisDocsLoading: boolean;
  analysisDocsUploading: boolean;
  openMenuId: string | null;
  setOpenMenuId: SimpleSetter<string | null>;
  setIsAnalysisUploadOpen: SimpleSetter<boolean>;
  viewAnalysisDocument: (id: string) => Promise<string | null>;
  downloadAnalysisDocument: (id: string) => Promise<string | null>;
  deleteAnalysisDocument: (id: string) => Promise<boolean>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// ========== PLAGIARISM TAB PROPS ==========

export interface PlagiarismTabProps {
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

// ========== SHARED COMPONENT PROPS ==========

export interface AnalysisScoreCardProps {
  score: number;
  description: string;
  stats: Array<{ label: string; value: string | number; color?: string }>;
  scoreThreshold?: number; // Score above this is green, below is red (default 50)
  reverseColors?: boolean; // For plagiarism where lower is better
}

export interface IssueItemCardProps {
  statusColor: 'red' | 'orange' | 'green';
  verdictText: string;
  previewText: string;
  isOpen: boolean;
  onToggle: () => void;
  status?: 'accepted' | 'rejected' | 'pending';
  children?: React.ReactNode;
}

export interface NoIssuesFoundProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export interface SourcesListProps {
  sources: Array<{ url: string; title?: string; name?: string }>;
  title?: string;
}
