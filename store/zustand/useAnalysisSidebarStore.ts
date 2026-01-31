'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  MainTab,
  AnalysisSubTab,
  PlagiarismView,
  HoverCardPosition,
} from '@/types/analysis-sidebar';

// ========== HOVER CARD STATE ==========

interface HoverCardState {
  type: 'fact' | 'compliance' | 'argument' | 'plagiarism' | null;
  data: any;
  position: HoverCardPosition;
  placement?: 'top' | 'bottom';
  factIndex?: number;
  lineId?: string;
  text?: string;
  suggestion?: string;
}

// ========== UI STATE INTERFACE ==========

interface AnalysisSidebarUIState {
  // Tab navigation
  activeMainTab: MainTab;
  analysisSubTab: AnalysisSubTab;
  plagiarismView: PlagiarismView;

  // Sidebar collapse
  isCollapsed: boolean;

  // Expansion states (UI-only, no server data)
  expandedFactItems: Record<string, boolean>;
  expandedComplianceItems: Record<string, boolean>;
  expandedArgumentItems: Record<string, boolean>;
  expandedPlagiarismItems: Record<string, boolean>;
  expandedAiDetectionItems: Record<string, boolean>;

  // Unified sources open state
  plagiarismUnifiedSourcesOpen: boolean;
  aiDetectionUnifiedSourcesOpen: boolean;

  // Hover card state
  activeHoverCard: HoverCardState | null;
  isHoveringCard: boolean;

  // Discover tab search state
  searchQuery: string;
  showAutocomplete: boolean;
  autocompleteSuggestions: string[];

  // Document search (Documents tab)
  documentSearchQuery: string;

  // Menu state
  openMenuId: string | null;

  // Upload dialog states
  isDocumentUploadOpen: boolean;
  isAnalysisUploadOpen: boolean;
}

// ========== ACTIONS INTERFACE ==========

interface AnalysisSidebarUIActions {
  // Tab navigation
  setActiveMainTab: (tab: MainTab) => void;
  setAnalysisSubTab: (tab: AnalysisSubTab) => void;
  setPlagiarismView: (view: PlagiarismView) => void;

  // Sidebar collapse
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;

  // Expansion toggles
  toggleExpandedFactItem: (id: string) => void;
  toggleExpandedComplianceItem: (id: string) => void;
  toggleExpandedArgumentItem: (id: string) => void;
  toggleExpandedPlagiarismItem: (id: string) => void;
  toggleExpandedAiDetectionItem: (id: string) => void;

  setExpandedFactItems: (items: Record<string, boolean>) => void;
  setExpandedComplianceItems: (items: Record<string, boolean>) => void;
  setExpandedArgumentItems: (items: Record<string, boolean>) => void;
  setExpandedPlagiarismItems: (items: Record<string, boolean>) => void;
  setExpandedAiDetectionItems: (items: Record<string, boolean>) => void;

  // Unified sources
  setPlagiarismUnifiedSourcesOpen: (open: boolean) => void;
  setAiDetectionUnifiedSourcesOpen: (open: boolean) => void;

  // Hover card
  showHoverCard: (state: HoverCardState) => void;
  hideHoverCard: () => void;
  setIsHoveringCard: (hovering: boolean) => void;

  // Search
  setSearchQuery: (query: string) => void;
  setShowAutocomplete: (show: boolean) => void;
  setAutocompleteSuggestions: (suggestions: string[]) => void;
  setDocumentSearchQuery: (query: string) => void;

  // Menu
  setOpenMenuId: (id: string | null) => void;

  // Upload dialogs
  setIsDocumentUploadOpen: (open: boolean) => void;
  setIsAnalysisUploadOpen: (open: boolean) => void;

  // Clear all expansion states
  clearAllExpanded: () => void;

  // Reset store
  reset: () => void;
}

// ========== INITIAL STATE ==========

const initialState: AnalysisSidebarUIState = {
  activeMainTab: 'analysis',
  analysisSubTab: 'compliances',
  plagiarismView: 'ai-detection',
  isCollapsed: false,
  expandedFactItems: {},
  expandedComplianceItems: {},
  expandedArgumentItems: {},
  expandedPlagiarismItems: {},
  expandedAiDetectionItems: {},
  plagiarismUnifiedSourcesOpen: false,
  aiDetectionUnifiedSourcesOpen: false,
  activeHoverCard: null,
  isHoveringCard: false,
  searchQuery: '',
  showAutocomplete: false,
  autocompleteSuggestions: [],
  documentSearchQuery: '',
  openMenuId: null,
  isDocumentUploadOpen: false,
  isAnalysisUploadOpen: false,
};

// ========== STORE CREATION ==========

export const useAnalysisSidebarStore = create<AnalysisSidebarUIState & AnalysisSidebarUIActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Tab navigation - O(1) updates
    setActiveMainTab: (tab) => set({ activeMainTab: tab }),
    setAnalysisSubTab: (tab) => set({ analysisSubTab: tab }),
    setPlagiarismView: (view) => set({ plagiarismView: view }),

    // Sidebar collapse - O(1)
    setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
    toggleCollapsed: () => set((s) => ({ isCollapsed: !s.isCollapsed })),

    // Expansion toggles - O(1) per toggle
    toggleExpandedFactItem: (id) =>
      set((s) => ({
        expandedFactItems: {
          ...s.expandedFactItems,
          [id]: !s.expandedFactItems[id],
        },
      })),

    toggleExpandedComplianceItem: (id) =>
      set((s) => ({
        expandedComplianceItems: {
          ...s.expandedComplianceItems,
          [id]: !s.expandedComplianceItems[id],
        },
      })),

    toggleExpandedArgumentItem: (id) =>
      set((s) => ({
        expandedArgumentItems: {
          ...s.expandedArgumentItems,
          [id]: !s.expandedArgumentItems[id],
        },
      })),

    toggleExpandedPlagiarismItem: (id) =>
      set((s) => ({
        expandedPlagiarismItems: {
          ...s.expandedPlagiarismItems,
          [id]: !s.expandedPlagiarismItems[id],
        },
      })),

    toggleExpandedAiDetectionItem: (id) =>
      set((s) => ({
        expandedAiDetectionItems: {
          ...s.expandedAiDetectionItems,
          [id]: !s.expandedAiDetectionItems[id],
        },
      })),

    setExpandedFactItems: (items) => set({ expandedFactItems: items }),
    setExpandedComplianceItems: (items) => set({ expandedComplianceItems: items }),
    setExpandedArgumentItems: (items) => set({ expandedArgumentItems: items }),
    setExpandedPlagiarismItems: (items) => set({ expandedPlagiarismItems: items }),
    setExpandedAiDetectionItems: (items) => set({ expandedAiDetectionItems: items }),

    // Unified sources - O(1)
    setPlagiarismUnifiedSourcesOpen: (open) => set({ plagiarismUnifiedSourcesOpen: open }),
    setAiDetectionUnifiedSourcesOpen: (open) => set({ aiDetectionUnifiedSourcesOpen: open }),

    // Hover card - O(1)
    showHoverCard: (state) => set({ activeHoverCard: state, isHoveringCard: false }),
    hideHoverCard: () => set({ activeHoverCard: null, isHoveringCard: false }),
    setIsHoveringCard: (hovering) => set({ isHoveringCard: hovering }),

    // Search - O(1)
    setSearchQuery: (query) => set({ searchQuery: query }),
    setShowAutocomplete: (show) => set({ showAutocomplete: show }),
    setAutocompleteSuggestions: (suggestions) => set({ autocompleteSuggestions: suggestions }),
    setDocumentSearchQuery: (query) => set({ documentSearchQuery: query }),

    // Menu - O(1)
    setOpenMenuId: (id) => set({ openMenuId: id }),

    // Upload dialogs - O(1)
    setIsDocumentUploadOpen: (open) => set({ isDocumentUploadOpen: open }),
    setIsAnalysisUploadOpen: (open) => set({ isAnalysisUploadOpen: open }),

    // Clear all expansion states - O(1)
    clearAllExpanded: () =>
      set({
        expandedFactItems: {},
        expandedComplianceItems: {},
        expandedArgumentItems: {},
        expandedPlagiarismItems: {},
        expandedAiDetectionItems: {},
        plagiarismUnifiedSourcesOpen: false,
        aiDetectionUnifiedSourcesOpen: false,
      }),

    // Reset - O(1)
    reset: () => set(initialState),
  }))
);

// ========== SELECTOR HOOKS FOR OPTIMIZED RENDERING ==========

/**
 * Select active tab state only - prevents re-renders from other state changes
 */
export const useAnalysisTabs = () =>
  useAnalysisSidebarStore((s) => ({
    activeMainTab: s.activeMainTab,
    analysisSubTab: s.analysisSubTab,
    plagiarismView: s.plagiarismView,
  }));

/**
 * Select tab actions only
 */
export const useAnalysisTabActions = () =>
  useAnalysisSidebarStore((s) => ({
    setActiveMainTab: s.setActiveMainTab,
    setAnalysisSubTab: s.setAnalysisSubTab,
    setPlagiarismView: s.setPlagiarismView,
  }));

/**
 * Select expanded items for a specific analysis type
 */
export const useFactExpansion = () =>
  useAnalysisSidebarStore((s) => ({
    expandedFactItems: s.expandedFactItems,
    toggleExpandedFactItem: s.toggleExpandedFactItem,
    setExpandedFactItems: s.setExpandedFactItems,
  }));

export const useComplianceExpansion = () =>
  useAnalysisSidebarStore((s) => ({
    expandedComplianceItems: s.expandedComplianceItems,
    toggleExpandedComplianceItem: s.toggleExpandedComplianceItem,
    setExpandedComplianceItems: s.setExpandedComplianceItems,
  }));

export const useArgumentExpansion = () =>
  useAnalysisSidebarStore((s) => ({
    expandedArgumentItems: s.expandedArgumentItems,
    toggleExpandedArgumentItem: s.toggleExpandedArgumentItem,
    setExpandedArgumentItems: s.setExpandedArgumentItems,
  }));

export const usePlagiarismExpansion = () =>
  useAnalysisSidebarStore((s) => ({
    expandedPlagiarismItems: s.expandedPlagiarismItems,
    toggleExpandedPlagiarismItem: s.toggleExpandedPlagiarismItem,
    setExpandedPlagiarismItems: s.setExpandedPlagiarismItems,
    plagiarismUnifiedSourcesOpen: s.plagiarismUnifiedSourcesOpen,
    setPlagiarismUnifiedSourcesOpen: s.setPlagiarismUnifiedSourcesOpen,
  }));

export const useAiDetectionExpansion = () =>
  useAnalysisSidebarStore((s) => ({
    expandedAiDetectionItems: s.expandedAiDetectionItems,
    toggleExpandedAiDetectionItem: s.toggleExpandedAiDetectionItem,
    setExpandedAiDetectionItems: s.setExpandedAiDetectionItems,
    aiDetectionUnifiedSourcesOpen: s.aiDetectionUnifiedSourcesOpen,
    setAiDetectionUnifiedSourcesOpen: s.setAiDetectionUnifiedSourcesOpen,
  }));

/**
 * Select hover card state
 */
export const useHoverCard = () =>
  useAnalysisSidebarStore((s) => ({
    activeHoverCard: s.activeHoverCard,
    isHoveringCard: s.isHoveringCard,
    showHoverCard: s.showHoverCard,
    hideHoverCard: s.hideHoverCard,
    setIsHoveringCard: s.setIsHoveringCard,
  }));

/**
 * Select search state for Discover tab
 */
export const useDiscoverSearch = () =>
  useAnalysisSidebarStore((s) => ({
    searchQuery: s.searchQuery,
    setSearchQuery: s.setSearchQuery,
    showAutocomplete: s.showAutocomplete,
    setShowAutocomplete: s.setShowAutocomplete,
    autocompleteSuggestions: s.autocompleteSuggestions,
    setAutocompleteSuggestions: s.setAutocompleteSuggestions,
  }));

/**
 * Select collapse state
 */
export const useSidebarCollapse = () =>
  useAnalysisSidebarStore((s) => ({
    isCollapsed: s.isCollapsed,
    setIsCollapsed: s.setIsCollapsed,
    toggleCollapsed: s.toggleCollapsed,
  }));
