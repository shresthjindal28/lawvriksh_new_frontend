'use client';

import type React from 'react';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Search, FileText, Copy, Sparkles, ShieldAlert } from 'lucide-react';
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
import { useAuth } from '@/lib/contexts/AuthContext';
import { useAnalysisDocuments } from '@/hooks/common/useAnalysisDocuments';

// Services
import { analysisService } from '@/lib/api/analysisService';
import CopilotService from '@/lib/api/copilotService';

// Types
import type {
  MainTab,
  AnalysisSubTab,
  PlagiarismView,
  AnalysisSidebarProps,
  PlagiarismSource,
  AnalysisShortcutActions,
} from '@/types/analysis-sidebar';
import type { FactChecker, Compliance, ArgumentLogic, CopilotResponse } from '@/types/copilot';
import type { ExploreItem } from '@/types/explore';

// Local components
import { AnalysisTab, DiscoverTab, DocumentsTab, PlagiarismTab, AITab } from './tabs';
import { extractTextFromHTML, LEGAL_TERMS, calculateViewportSafePosition } from './utils';

export default function AnalysisSidebar({
  wordCount = 0,
  onAnalyze,
  onClear,
  onCollapse,
  projectId,
  projectDocuments,
  uploadDataForAnalysis,
  onGetLatestData,
  percentage,
  fact,
  compliance,
  argumentLogic,
  factSummary,
  expandedSections,
  setExpandedSections,
  toggleSection,
  setIsCopilotOpen,
  analysisLoading,
  editorRef,
  tiptapEditor,
  setIsCollapsed,
  isCollapsed,
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

  // Debug: Log tiptapEditor availability
  console.log('[AnalysisSidebar] tiptapEditor available:', !!tiptapEditor, tiptapEditor);

  // Normalize data
  const facts = useMemo(() => (fact ? (Array.isArray(fact) ? fact : [fact]) : []), [fact]);
  const compliances = useMemo(
    () => (compliance ? (Array.isArray(compliance) ? compliance : [compliance]) : []),
    [compliance]
  );
  const argumentLogics = useMemo(
    () => (argumentLogic ? (Array.isArray(argumentLogic) ? argumentLogic : [argumentLogic]) : []),
    [argumentLogic]
  );

  // ========== STATE ==========
  const [mainTab, setMainTab] = useState<MainTab>('analysis');
  const [analysisSubTab, setAnalysisSubTab] = useState<AnalysisSubTab>('compliances');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFactItems, setExpandedFactItems] = useState<Record<string, boolean>>({});
  const [expandedComplianceItems, setExpandedComplianceItems] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedPlagiarismItems, setExpandedPlagiarismItems] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedArgumentItems, setExpandedArgumentItems] = useState<Record<string, boolean>>({});
  const [plagiarismView, setPlagiarismView] = useState<PlagiarismView>('ai-detection');
  const [plagiarismUnifiedSourcesOpen, setPlagiarismUnifiedSourcesOpen] = useState(false);

  // Loading states
  const [factsLoading, setFactsLoading] = useState(false);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [argumentLoading, setArgumentLoading] = useState(false);
  const [showFactsResults, setShowFactsResults] = useState(false);
  const [showComplianceResults, setShowComplianceResults] = useState(false);
  const [showArgumentResults, setShowArgumentResults] = useState(false);

  // Plagiarism states
  const [plagiarismLoading, setPlagiarismLoading] = useState(false);
  const [showPlagiarismResults, setShowPlagiarismResults] = useState(false);
  const [plagiarismScore, setPlagiarismScore] = useState(0);
  const [plagiarismSources, setPlagiarismSources] = useState<PlagiarismSource[]>([]);
  const [plagiarismSourceCounts, setPlagiarismSourceCounts] = useState(0);
  const [plagiarismTotalWords, setPlagiarismTotalWords] = useState(0);
  const [plagiarismTextWordCounts, setPlagiarismTextWordCounts] = useState(0);

  // AI Detection states
  const [aiDetectionLoading, setAiDetectionLoading] = useState(false);
  const [showAiDetectionResults, setShowAiDetectionResults] = useState(false);
  const [aiDetectionScore, setAiDetectionScore] = useState(0);
  const [aiDetectionSources, setAiDetectionSources] = useState<PlagiarismSource[]>([]);
  const [aiDetectionSourceCounts, setAiDetectionSourceCounts] = useState(0);
  const [aiDetectionTotalWords, setAiDetectionTotalWords] = useState(0);
  const [aiDetectionTextWordCounts, setAiDetectionTextWordCounts] = useState(0);
  const [expandedAiDetectionItems, setExpandedAiDetectionItems] = useState<Record<string, boolean>>(
    {}
  );
  const [aiDetectionUnifiedSourcesOpen, setAiDetectionUnifiedSourcesOpen] = useState(false);

  // Search Autocomplete State
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Local data states
  const [localFacts, setLocalFacts] = useState<FactChecker[]>(facts);
  const [localArgumentLogics, setLocalArgumentLogics] = useState<ArgumentLogic[]>(argumentLogics);
  const [localCompliances, setLocalCompliances] = useState<Compliance[]>(compliances);
  const [correctedContent, setCorrectedContent] = useState<string>('');
  const [correctionsApplied, setCorrectionsApplied] = useState<number>(0);

  // Hover card states
  const [hoverCard, setHoverCard] = useState<{
    data: any;
    position: { x: number; y: number };
    placement?: 'top' | 'bottom';
  } | null>(null);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isCardVisible, setIsCardVisible] = useState(false);

  const [factHoverCard, setFactHoverCard] = useState<{
    data: any;
    position: { x: number; y: number };
    placement?: 'top' | 'bottom';
    factIndex: number;
  } | null>(null);
  const [factHideTimeout, setFactHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isHoveringFactCard, setIsHoveringFactCard] = useState(false);
  const [isFactCardVisible, setIsFactCardVisible] = useState(false);

  const [argumentHoverCard, setArgumentHoverCard] = useState<{
    data: any;
    position: { x: number; y: number };
    placement?: 'top' | 'bottom';
    lineId: string;
    text: string;
    suggestion?: string;
  } | null>(null);
  const argumentHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isHoveringArgumentCard, setIsHoveringArgumentCard] = useState(false);
  const [isArgumentCardVisible, setIsArgumentCardVisible] = useState(false);

  // Analysis Documents Hook
  const [isAnalysisUploadOpen, setIsAnalysisUploadOpen] = useState(false);

  // ========== HOOKS ==========
  const { handleSearch, loading, error, items } = ExploreMoreService();
  const { uploadDocument, uploadMultipleDocuments, getViewUrl, deleteDocument } =
    useLibraryDocuments();
  const { addToast } = useToast();

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lawvriksh_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  // Sync local states with props
  useEffect(() => {
    setLocalFacts((prev) => {
      return facts.map((newFact: FactChecker, i: number) => {
        const prevFact = prev[i];
        if (
          prevFact &&
          prevFact.fact.wrongStatement === newFact.fact.wrongStatement &&
          (prevFact as any).status
        ) {
          return { ...newFact, status: (prevFact as any).status };
        }
        return newFact;
      });
    });
  }, [facts]);

  useEffect(() => {
    setLocalArgumentLogics((prev) => {
      return argumentLogics.map((newItem: ArgumentLogic, i: number) => {
        const prevItem = prev[i];
        if (prevItem && (prevItem as any).status) {
          return { ...newItem, status: (prevItem as any).status };
        }
        return newItem;
      });
    });
  }, [argumentLogics]);

  useEffect(() => {
    setLocalCompliances((prev) => {
      return compliances.map((newComp: Compliance, i: number) => {
        const prevComp = prev[i];
        if (
          prevComp &&
          prevComp.statement.wrongStatement === newComp.statement.wrongStatement &&
          (prevComp as any).status
        ) {
          return { ...newComp, status: (prevComp as any).status };
        }
        return newComp;
      });
    });
  }, [compliances]);

  // ========== HIGHLIGHTING FUNCTIONS ==========

  // Clear TipTap marks
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

  // Global Text Map Strategy for robust matching (V2)
  const highlightTextInTipTapGlobal = useCallback(
    (
      container: HTMLElement,
      textToFind: string,
      attributes: {
        id: string;
        type: 'fact' | 'compliance' | 'argument' | 'plagiarism';
        [key: string]: any;
      },
      color: string
    ) => {
      if (!textToFind || !textToFind.trim() || !tiptapEditor) return false;

      // 1. Build Global Map
      const nodeMap: { start: number; length: number; node: Text }[] = [];
      let fullText = '';
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const tNode = node as Text;
        const content = tNode.textContent || '';
        if (content.length > 0) {
          nodeMap.push({ start: fullText.length, length: content.length, node: tNode });
          fullText += content;
        }
      }

      // Stop words to ignore when building word patterns
      const stopWords = new Set([
        'a',
        'an',
        'the',
        'is',
        'are',
        'was',
        'were',
        'be',
        'been',
        'being',
        'of',
        'and',
        'or',
        'to',
        'in',
        'on',
        'at',
        'for',
        'by',
        'as',
      ]);

      // Helper: Normalize text by removing extra punctuation and normalizing whitespace
      const normalizeForMatch = (text: string) => {
        return text
          .replace(/[""'']/g, '"') // Normalize quotes
          .replace(/[–—]/g, '-') // Normalize dashes
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      };

      // 2. Extract meaningful words
      const normalizedSearch = normalizeForMatch(textToFind);
      const allWords = normalizedSearch.split(/\s+/).filter((w) => w.length > 0);

      // Get content words (non-stop words) for core matching
      const contentWords = allWords.filter((w) => !stopWords.has(w.toLowerCase()) && w.length > 1);

      if (allWords.length === 0) return false;

      // 3. Try multiple matching strategies
      const tryMatch = (candidateWords: string[], allowFlexiblePunctuation: boolean = true) => {
        if (candidateWords.length === 0) return null;
        // Escape special regex characters and allow flexible matching
        const escaped = candidateWords.map((w) => {
          // Remove leading/trailing punctuation for matching but keep core word
          const cleaned = w.replace(/^[^\w\[]+|[^\w\]]+$/g, '');
          if (cleaned.length === 0) return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return cleaned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });

        // Pattern allows: optional punctuation, spaces, and common joining characters between words
        const joiner = allowFlexiblePunctuation ? '[\\s\\W]*' : '\\s*';
        const pattern = escaped.join(joiner);
        const regex = new RegExp(pattern, 'i');
        return fullText.match(regex);
      };

      // Strategy 1: Try full text match
      let match = tryMatch(allWords);

      // Strategy 2: Try without leading/trailing punctuation words
      if (!match && allWords.length > 1) {
        let start = 0;
        let end = allWords.length;
        while (start < end && /^[^\w]+$/.test(allWords[start])) start++;
        while (end > start && /^[^\w]+$/.test(allWords[end - 1])) end--;
        if (start < end && (start > 0 || end < allWords.length)) {
          match = tryMatch(allWords.slice(start, end));
        }
      }

      // Strategy 3: Try content words only (skip stop words)
      if (!match && contentWords.length >= 2) {
        match = tryMatch(contentWords);
      }

      // Strategy 4: Trim End (up to 40%)
      if (!match && allWords.length > 3) {
        const maxTrim = Math.max(1, Math.floor(allWords.length * 0.4));
        for (let i = 1; i <= maxTrim; i++) {
          match = tryMatch(allWords.slice(0, -i));
          if (match) break;
        }
      }

      // Strategy 5: Trim Start (up to 40%)
      if (!match && allWords.length > 3) {
        const maxTrim = Math.max(1, Math.floor(allWords.length * 0.4));
        for (let i = 1; i <= maxTrim; i++) {
          match = tryMatch(allWords.slice(i));
          if (match) break;
        }
      }

      // Strategy 6: Try first N content words (for long texts)
      if (!match && contentWords.length > 4) {
        const firstFew = contentWords.slice(0, Math.min(6, contentWords.length));
        match = tryMatch(firstFew);
      }

      // Strategy 7: Substring search for short/exact phrases
      if (!match && textToFind.length < 80) {
        const searchLower = normalizedSearch.toLowerCase();
        const textLower = fullText.toLowerCase();
        const idx = textLower.indexOf(searchLower);
        if (idx !== -1) {
          match = {
            0: fullText.substring(idx, idx + normalizedSearch.length),
            index: idx,
          } as RegExpMatchArray;
        }
      }

      if (match && match.index !== undefined) {
        const globalStart = match.index;
        const globalEnd = globalStart + match[0].length;
        const tr = tiptapEditor.state.tr;
        let hasChange = false;

        // Map global range to PM ranges
        for (const entry of nodeMap) {
          const entryEnd = entry.start + entry.length;
          if (entryEnd > globalStart && entry.start < globalEnd) {
            const overlapStart = Math.max(globalStart, entry.start);
            const overlapEnd = Math.min(globalEnd, entryEnd);
            const localFrom = overlapStart - entry.start;
            const localTo = overlapEnd - entry.start;

            try {
              const fromPos = tiptapEditor.view.posAtDOM(entry.node, localFrom);
              const toPos = tiptapEditor.view.posAtDOM(entry.node, localTo);

              if (fromPos >= 0 && toPos > fromPos) {
                tr.addMark(
                  fromPos,
                  toPos,
                  tiptapEditor.schema.marks.analysisHighlight.create({ ...attributes, color })
                );
                hasChange = true;
              }
            } catch (e) {
              // Ignore mapping errors
            }
          }
        }

        if (hasChange) {
          tr.setMeta('addToHistory', false);
          tiptapEditor.view.dispatch(tr);
          return true;
        }
      } else {
        // Super fallback: For long texts, try just the first sentence
        if (textToFind.length > 100) {
          const firstSentence = textToFind.split(/[.!?]/)[0];
          if (firstSentence.length > 20 && firstSentence.length < textToFind.length) {
            return highlightTextInTipTapGlobal(container, firstSentence, attributes, color);
          }
        }
      }
      return false;
    },
    [tiptapEditor]
  );

  const highlightFactTextInContent = useCallback(
    (container: HTMLElement, textToFind: string, id: string, factData: any, factIndex: number) => {
      highlightTextInTipTapGlobal(container, textToFind, { id, type: 'fact' }, '#ef4444');
    },
    [highlightTextInTipTapGlobal]
  );

  const highlightComplianceTextInContent = useCallback(
    (container: HTMLElement, textToFind: string, id: string, complianceData: any) => {
      highlightTextInTipTapGlobal(container, textToFind, { id, type: 'compliance' }, '#ff9500');
    },
    [highlightTextInTipTapGlobal]
  );

  const highlightPlagiarismTextInContent = useCallback(
    (
      container: HTMLElement,
      textToFind: string,
      id: string,
      sourceData: any,
      sourceIndex: number
    ) => {
      highlightTextInTipTapGlobal(
        container,
        textToFind,
        { id, type: 'plagiarism', ...sourceData },
        '#ef4444'
      );
    },
    [highlightTextInTipTapGlobal]
  );

  const highlightArgumentLogicTextInContent = useCallback(
    (
      container: HTMLElement,
      textToFind: string,
      id: string,
      contradictionData: any,
      suggestion?: string,
      highlightColor: string = '#22c55e'
    ) => {
      highlightTextInTipTapGlobal(
        container,
        textToFind,
        { id, type: 'argument', ...contradictionData },
        highlightColor
      );
    },
    [highlightTextInTipTapGlobal]
  );

  // Helper to get verdict type
  const getVerdictType = (
    verdict: string
  ): 'accurate' | 'inaccurate' | 'invalid' | 'unverifiable' | 'other' => {
    const v = (verdict || '').toLowerCase().trim();
    if (v === 'accurate' || v.startsWith('accurate ')) return 'accurate';
    if (v.startsWith('inaccurate')) return 'inaccurate';
    if (v.startsWith('invalid')) return 'invalid';
    if (v.startsWith('unverifiable') || v === 'soft_accurate') return 'unverifiable';
    return 'other';
  };

  // ========== HIGHLIGHT EFFECT ON TAB CHANGE ==========
  useEffect(() => {
    if (!tiptapEditor) return;

    clearTipTapHighlights();

    const extractQuotedTexts = (text: string): string[] => {
      const quotedTexts: string[] = [];
      const singleQuoteMatches = text.match(/'([^']+)'/g);
      if (singleQuoteMatches) {
        singleQuoteMatches.forEach((match) => {
          const cleanText = match.slice(1, -1).trim();
          if (cleanText.length > 5) quotedTexts.push(cleanText);
        });
      }
      const doubleQuoteMatches = text.match(/"([^"]+)"/g);
      if (doubleQuoteMatches) {
        doubleQuoteMatches.forEach((match) => {
          const cleanText = match.slice(1, -1).trim();
          if (cleanText.length > 5) quotedTexts.push(cleanText);
        });
      }
      return [...new Set(quotedTexts)];
    };

    const applyHighlights = () => {
      if (mainTab === 'plagiarism') {
        if (plagiarismSources && plagiarismSources.length > 0) {
          plagiarismSources.forEach((source, sourceIndex) => {
            if (source.plagiarism_found && source.plagiarism_found.length > 0) {
              source.plagiarism_found.forEach((item, itemIndex) => {
                if (item.sequence) {
                  highlightPlagiarismTextInContent(
                    tiptapEditor.view.dom,
                    item.sequence,
                    `plag-${sourceIndex}-${itemIndex}`,
                    source,
                    sourceIndex
                  );
                }
              });
            }
          });
        }
        return;
      }

      if (mainTab === 'analysis') {
        if (analysisSubTab === 'facts' && localFacts && localFacts.length > 0) {
          localFacts.forEach((item, index) => {
            const verdictType = getVerdictType((item as any).verdict || '');
            if (
              verdictType === 'accurate' ||
              (item as any).status === 'accepted' ||
              (item as any).status === 'rejected'
            )
              return;
            highlightFactTextInContent(
              tiptapEditor.view.dom,
              item.fact.wrongStatement,
              `fact-${index}`,
              item,
              index
            );
          });
        } else if (
          analysisSubTab === 'compliances' &&
          localCompliances &&
          localCompliances.length > 0
        ) {
          localCompliances.forEach((item, index) => {
            if ((item as any).status === 'accepted' || (item as any).status === 'rejected') return;

            const wrongText = item.statement.wrongStatement;
            const quotedTexts = extractQuotedTexts(wrongText);

            if (quotedTexts.length > 0) {
              quotedTexts.forEach((quotedText, qIndex) => {
                highlightComplianceTextInContent(
                  tiptapEditor.view.dom,
                  quotedText,
                  `compliance-${index}-q${qIndex}`,
                  item
                );
              });
            } else {
              highlightComplianceTextInContent(
                tiptapEditor.view.dom,
                wrongText,
                item.statement.block_id || `compliance-${index}`,
                item
              );
            }
          });
        } else if (
          analysisSubTab === 'argument' &&
          localArgumentLogics &&
          localArgumentLogics.length > 0
        ) {
          const colors = ['#00BFFF', '#A855F7', '#FF00FF', '#FFBF00', '#00E5EE', '#2E5BFF'];
          let colorIdx = 0;

          localArgumentLogics.forEach((argSet) => {
            argSet.sets?.forEach((set) => {
              set.contradictions?.forEach((con) => {
                const color = colors[colorIdx % colors.length];
                colorIdx++;
                if (con.line1?.text) {
                  const suggestion = con.suggestions ? con.suggestions[con.line1.id] : undefined;
                  highlightArgumentLogicTextInContent(
                    tiptapEditor.view.dom,
                    con.line1.text,
                    con.line1.id,
                    con,
                    suggestion,
                    color
                  );
                }
                if (con.line2?.text) {
                  const suggestion = con.suggestions ? con.suggestions[con.line2.id] : undefined;
                  highlightArgumentLogicTextInContent(
                    tiptapEditor.view.dom,
                    con.line2.text,
                    con.line2.id,
                    con,
                    suggestion,
                    color
                  );
                }
              });
            });
          });
        }
      }
    };

    applyHighlights();
    // Retry strategies to catch late DOM updates or race conditions
    const t1 = setTimeout(applyHighlights, 500);
    const t2 = setTimeout(applyHighlights, 1500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [
    mainTab,
    analysisSubTab,
    tiptapEditor,
    localFacts,
    localCompliances,
    localArgumentLogics,
    plagiarismSources,
    clearTipTapHighlights,
    highlightFactTextInContent,
    highlightComplianceTextInContent,
    highlightPlagiarismTextInContent,
    highlightArgumentLogicTextInContent,
  ]);

  // ========== INTERACTION HANDLERS ==========

  const replaceHighlightedText = useCallback(
    (blockId: string, correctedText: string, type: string, factIndex: number) => {
      const highlight = document.querySelector(`[data-highlight-id="${blockId}"]`) as HTMLElement;
      if (!highlight) {
        addToast('Highlighted text not found', 'error');
        return;
      }

      const textNode = document.createTextNode(correctedText);
      highlight.parentNode?.replaceChild(textNode, highlight);

      setLocalFacts((prev) =>
        prev.map((fact, index) =>
          index === factIndex ? { ...fact, status: 'accepted' as const } : fact
        )
      );

      addToast('Statement corrected successfully', 'success');
      if (editorRef && editorRef.current) {
        editorRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
    [addToast, editorRef]
  );

  const rejectFactCorrection = useCallback(
    (factIndex: number) => {
      const factToReject = localFacts[factIndex];
      if (!factToReject) return;

      const highlight = document.querySelector(
        `[data-highlight-id="fact-${factIndex}"]`
      ) as HTMLElement;
      if (highlight) {
        const textNode = document.createTextNode(highlight.textContent || '');
        highlight.parentNode?.replaceChild(textNode, highlight);
      }

      if (tiptapEditor && !tiptapEditor.isDestroyed) {
        const doc = tiptapEditor.state.doc;
        const tr = tiptapEditor.state.tr;
        let hasChanges = false;
        doc.descendants((node, pos) => {
          if (
            node.marks.some(
              (mark) =>
                mark.type.name === 'analysisHighlight' && mark.attrs.id === `fact-${factIndex}`
            )
          ) {
            tr.removeMark(pos, pos + node.nodeSize, tiptapEditor.schema.marks.analysisHighlight);
            hasChanges = true;
          }
          return true;
        });
        if (hasChanges) {
          tr.setMeta('addToHistory', false);
          tiptapEditor.view.dispatch(tr);
        }
      }

      setLocalFacts((prev) =>
        prev.map((fact, index) =>
          index === factIndex ? { ...fact, status: 'rejected' as const } : fact
        )
      );
      addToast('Correction rejected', 'info');
    },
    [localFacts, addToast, tiptapEditor]
  );

  const replaceComplianceText = useCallback(
    (blockId: string, correctedText: string, type: string, complianceIndex: number) => {
      const highlight = document.querySelector(`[data-highlight-id="${blockId}"]`) as HTMLElement;
      if (!highlight) {
        addToast('Highlighted text not found', 'error');
        return;
      }

      const textNode = document.createTextNode(correctedText);
      highlight.parentNode?.replaceChild(textNode, highlight);

      setLocalCompliances((prev) =>
        prev.map((comp, index) =>
          index === complianceIndex ? { ...comp, status: 'accepted' as const } : comp
        )
      );

      addToast('Compliance issue corrected successfully', 'success');
      if (editorRef && editorRef.current) {
        editorRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
    [addToast, editorRef]
  );

  const rejectComplianceCorrection = useCallback(
    (complianceIndex: number) => {
      setLocalCompliances((prev) =>
        prev.map((comp, index) =>
          index === complianceIndex ? { ...comp, status: 'rejected' as const } : comp
        )
      );
      addToast('Compliance correction rejected', 'info');
    },
    [addToast]
  );

  const handleResolveAll = useCallback(
    (type: string) => {
      if (type === 'facts') {
        const appliedIndices: number[] = [];
        localFacts.forEach((f, index) => {
          const verdict = (f.verdict || '').toLowerCase();
          if (
            !f.fact.correctedStatement ||
            verdict === 'accurate' ||
            verdict === 'unverifiable' ||
            (f as any).status === 'accepted' ||
            (f as any).status === 'rejected'
          )
            return;

          const highlightId = `fact-${index}`;
          const highlight = document.querySelector(
            `[data-highlight-id="${highlightId}"]`
          ) as HTMLElement;

          if (highlight && f.fact.correctedStatement) {
            const textNode = document.createTextNode(f.fact.correctedStatement);
            highlight.parentNode?.replaceChild(textNode, highlight);
            appliedIndices.push(index);
          }
        });

        if (appliedIndices.length > 0) {
          setLocalFacts((prev) =>
            prev.map((fact, index) =>
              appliedIndices.includes(index) ? { ...fact, status: 'accepted' as const } : fact
            )
          );
          if (editorRef && editorRef.current)
            editorRef.current.dispatchEvent(new Event('input', { bubbles: true }));
          addToast(`${appliedIndices.length} fact corrections applied`, 'success');
        } else {
          addToast('No applicable fact corrections found', 'info');
        }
      }

      if (type === 'compliances') {
        const appliedIndices: number[] = [];
        localCompliances.forEach((comp, index) => {
          if (
            !comp.statement.correctedStatement ||
            !comp.statement.correctedStatement.trim() ||
            (comp as any).status === 'accepted' ||
            (comp as any).status === 'rejected'
          )
            return;

          const highlightId = `compliance-${index}`;
          const highlights = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
          if (highlights.length > 0 && comp.statement.correctedStatement) {
            highlights.forEach((h) => {
              const textNode = document.createTextNode(comp.statement.correctedStatement!);
              h.parentNode?.replaceChild(textNode, h);
            });
            appliedIndices.push(index);
          }
        });

        if (appliedIndices.length > 0) {
          setLocalCompliances((prev) =>
            prev.map((comp, index) =>
              appliedIndices.includes(index) ? { ...comp, status: 'accepted' as const } : comp
            )
          );
          if (editorRef && editorRef.current)
            editorRef.current.dispatchEvent(new Event('input', { bubbles: true }));
          addToast(`${appliedIndices.length} compliance corrections applied`, 'success');
        } else {
          addToast('No applicable compliance corrections found', 'info');
        }
      }
    },
    [localFacts, localCompliances, addToast, editorRef]
  );

  // Helper functions for showing/hiding cards - MEMOIZED
  const showFactCard = useCallback(
    (event: MouseEvent, factData: any, factIndex: number) => {
      if (analysisSubTab !== 'facts') return;
      const targetElement = event.target as HTMLElement;
      if (targetElement.getAttribute('data-fact-hidden') === 'true') return;

      if (factHideTimeout) {
        clearTimeout(factHideTimeout);
        setFactHideTimeout(null);
      }

      const rect = targetElement.getBoundingClientRect();
      const { x, y, placement } = calculateViewportSafePosition(rect, 400, 320);

      setFactHoverCard({ data: factData, position: { x, y }, factIndex, placement });
      setIsFactCardVisible(true);
      setIsHoveringFactCard(false);
    },
    [analysisSubTab, factHideTimeout]
  );

  const hideFactCardWithDelay = useCallback(() => {
    if (factHideTimeout) clearTimeout(factHideTimeout);
    const timeout = setTimeout(() => {
      setIsHoveringFactCard((current) => {
        if (!current) {
          setFactHoverCard(null);
          setIsFactCardVisible(false);
        }
        return current;
      });
      setFactHideTimeout(null);
    }, 300);
    setFactHideTimeout(timeout);
  }, [factHideTimeout]);

  const showComplianceCard = useCallback(
    (event: MouseEvent, complianceData: any) => {
      if (analysisSubTab !== 'compliances') return;
      const targetElement = event.target as HTMLElement;
      if (targetElement.getAttribute('data-compliance-hidden') === 'true') return;

      if (hideTimeout) {
        clearTimeout(hideTimeout);
        setHideTimeout(null);
      }

      const rect = targetElement.getBoundingClientRect();
      const { x, y, placement } = calculateViewportSafePosition(rect, 320, 250);

      setHoverCard({ data: complianceData, position: { x, y }, placement });
      setIsCardVisible(true);
      setIsHoveringCard(false);
    },
    [analysisSubTab, hideTimeout]
  );

  const hideComplianceCardWithDelay = useCallback(() => {
    if (hideTimeout) clearTimeout(hideTimeout);
    const timeout = setTimeout(() => {
      if (!isHoveringCard) {
        setHoverCard(null);
        setIsCardVisible(false);
        setIsHoveringCard(false);
      }
      setHideTimeout(null);
    }, 150);
    setHideTimeout(timeout);
  }, [hideTimeout, isHoveringCard]);

  const showArgumentCard = useCallback((e: MouseEvent, argData: any) => {
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const { x, y, placement } = calculateViewportSafePosition(rect, 400, 300);
    setArgumentHoverCard({ ...argData, position: { x, y }, placement });
    setIsArgumentCardVisible(true);
  }, []);

  const hideArgumentCardWithDelay = useCallback(() => {
    if (argumentHideTimeoutRef.current) clearTimeout(argumentHideTimeoutRef.current);
    const timeout = setTimeout(() => {
      setIsHoveringArgumentCard((current) => {
        if (!current) {
          setArgumentHoverCard(null);
          setIsArgumentCardVisible(false);
        }
        return current;
      });
      argumentHideTimeoutRef.current = null;
    }, 400);
    argumentHideTimeoutRef.current = timeout;
  }, []);

  // Event Listeners for Hover
  useEffect(() => {
    if (!tiptapEditor || tiptapEditor.isDestroyed || !tiptapEditor.view) return;
    const dom = tiptapEditor.view.dom;

    const handleMouseOver = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      if (target.nodeType === 3 && target.parentElement) target = target.parentElement;

      const isHighlight =
        target.matches('.analysis-highlight') ||
        target.matches('.fact-underline') ||
        target.matches('.compliance-underline') ||
        target.matches('.argument-highlight') ||
        target.closest('.analysis-highlight');

      if (isHighlight) {
        const span =
          target.matches('.analysis-highlight') ||
          target.matches('.fact-underline') ||
          target.matches('.compliance-underline') ||
          target.matches('.argument-highlight')
            ? target
            : ((target.closest('.analysis-highlight') ||
                target.closest('.fact-underline') ||
                target.closest('.compliance-underline')) as HTMLElement);
        if (!span) return;

        let type = span.getAttribute('data-highlight-type');
        const id = span.getAttribute('data-highlight-id') || '';

        if (!type) {
          if (span.classList.contains('fact-underline')) type = 'fact';
          else if (span.classList.contains('compliance-underline')) type = 'compliance';
          else if (span.classList.contains('argument-highlight')) type = 'argument';
          else if (span.classList.contains('plagiarism-underline')) type = 'plagiarism';
        }

        let data = null;
        if (type === 'fact') {
          data = localFacts?.find((f) => f.fact.wrongStatement === id);
          if (!data && id && id.startsWith('fact-')) {
            const index = parseInt(id.replace('fact-', ''));
            if (index >= 0 && index < localFacts.length) data = localFacts[index];
          }
          if (data) showFactCard(e, data, localFacts.indexOf(data));
        } else if (type === 'compliance') {
          data = localCompliances?.find((c) => c.statement.block_id === id);
          if (!data && id && id.startsWith('compliance-')) {
            const index = parseInt(id.replace('compliance-', '').split('-')[0]);
            if (index >= 0 && index < localCompliances.length) data = localCompliances[index];
          }
          if (data) showComplianceCard(e, data);
        } else if (type === 'argument') {
          let foundData = null;
          let foundSuggestion = undefined;
          for (const logic of localArgumentLogics) {
            for (const set of logic.sets || []) {
              for (const con of set.contradictions || []) {
                if (con.line1?.id === id || con.line2?.id === id) {
                  foundData = con;
                  foundSuggestion = con.suggestions ? con.suggestions[id] : undefined;
                  break;
                }
              }
              if (foundData) break;
            }
            if (foundData) break;
          }
          if (foundData) {
            showArgumentCard(e, {
              data: foundData,
              lineId: id,
              text: foundData.line1?.id === id ? foundData.line1.text : foundData.line2?.text,
              suggestion: foundSuggestion,
            });
          }
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      let target = e.target as HTMLElement;
      if (target.nodeType === 3 && target.parentElement) target = target.parentElement;

      const isHighlight =
        target.matches('.analysis-highlight') ||
        target.matches('.fact-underline') ||
        target.matches('.compliance-underline') ||
        target.matches('.argument-highlight');

      if (isHighlight) {
        const span = target;
        let type = span.getAttribute('data-highlight-type');
        if (!type) {
          if (span.classList.contains('fact-underline')) type = 'fact';
          else if (span.classList.contains('compliance-underline')) type = 'compliance';
          else if (span.classList.contains('argument-highlight')) type = 'argument';
        }

        if (type === 'fact') hideFactCardWithDelay();
        else if (type === 'compliance') hideComplianceCardWithDelay();
        else if (type === 'argument') hideArgumentCardWithDelay();
      }
    };

    dom.addEventListener('mouseover', handleMouseOver);
    dom.addEventListener('mouseout', handleMouseOut);

    return () => {
      dom.removeEventListener('mouseover', handleMouseOver);
      dom.removeEventListener('mouseout', handleMouseOut);
    };
  }, [
    tiptapEditor,
    localFacts,
    localCompliances,
    localArgumentLogics,
    showFactCard,
    hideFactCardWithDelay,
    showComplianceCard,
    hideComplianceCardWithDelay,
    showArgumentCard,
    hideArgumentCardWithDelay,
  ]);

  // ========== CALLBACKS ==========

  const saveRecentSearch = useCallback((term: string) => {
    if (!term.trim()) return;
    try {
      const stored = localStorage.getItem('lawvriksh_recent_searches');
      let current = stored ? JSON.parse(stored) : [];
      current = current.filter((t: string) => t.toLowerCase() !== term.toLowerCase());
      current.unshift(term);
      current = current.slice(0, 10);
      localStorage.setItem('lawvriksh_recent_searches', JSON.stringify(current));
      setRecentSearches(current);
    } catch (e) {
      console.error('Failed to save recent search', e);
    }
  }, []);

  // Hover card handlers
  const onComplianceCardEnter = () => {
    if (hideTimeout) clearTimeout(hideTimeout);
    setHideTimeout(null);
    setIsHoveringCard(true);
  };

  const onComplianceCardLeave = () => {
    const t = setTimeout(() => {
      setHoverCard(null);
      setIsCardVisible(false);
      setIsHoveringCard(false);
    }, 500);
    setHideTimeout(t);
  };

  const onFactCardEnter = () => {
    if (factHideTimeout) clearTimeout(factHideTimeout);
    setFactHideTimeout(null);
    setIsHoveringFactCard(true);
  };

  const onFactCardLeave = () => {
    const t = setTimeout(() => {
      setFactHoverCard(null);
      setIsFactCardVisible(false);
      setIsHoveringFactCard(false);
    }, 500);
    setFactHideTimeout(t);
  };

  const onArgumentCardEnter = () => {
    if (argumentHideTimeoutRef.current) {
      clearTimeout(argumentHideTimeoutRef.current);
      argumentHideTimeoutRef.current = null;
    }
    setIsHoveringArgumentCard(true);
  };

  const onArgumentCardLeave = () => {
    const t = setTimeout(() => {
      setArgumentHoverCard(null);
      setIsArgumentCardVisible(false);
      setIsHoveringArgumentCard(false);
    }, 500);
    argumentHideTimeoutRef.current = t;
  };

  const hideComplianceCard = useCallback(() => {
    setHoverCard(null);
    setIsCardVisible(false);
  }, []);

  const hideFactCard = useCallback(() => {
    setFactHoverCard(null);
    setIsFactCardVisible(false);
  }, []);

  const hideArgumentCard = useCallback(() => {
    setArgumentHoverCard(null);
    setIsArgumentCardVisible(false);
  }, []);

  // Search handlers
  const handleSearchClick = useCallback(
    (term?: string) => {
      const query = term || searchQuery;
      if (!query.trim()) return;
      saveRecentSearch(query);
      handleSearch(query);
      setShowAutocomplete(false);
      if (term) setSearchQuery(term);
    },
    [searchQuery, saveRecentSearch, handleSearch]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchQuery(val);

      if (!val.trim()) {
        setSelectedItem(null);
        setShowAutocomplete(false);
        return;
      }

      const allTerms = Array.from(new Set([...recentSearches, ...LEGAL_TERMS]));
      const filtered = allTerms
        .filter((t) => t.toLowerCase().includes(val.toLowerCase()))
        .slice(0, 6);
      setAutocompleteSuggestions(filtered);
      setShowAutocomplete(filtered.length > 0);
    },
    [recentSearches]
  );

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onCollapse?.();
  };

  // Analysis handler
  const handleAnalyze = useCallback(
    async (type: string) => {
      if (!onGetLatestData) return;

      const latestData = await onGetLatestData();
      if (!latestData) {
        addToast('Could not get document content. Please try again.', 'error');
        return;
      }

      const contentText = typeof latestData === 'string' ? extractTextFromHTML(latestData) : '';

      const findBlockIdForText = (textToFind: string): string => '';

      try {
        switch (type) {
          case 'facts':
            setFactsLoading(true);
            const factRequest = analysisService.prepareFactCheckRequest(contentText);
            const factRes = await analysisService.checkFacts(factRequest);

            if (factRes.success && factRes.data) {
              const processed = CopilotService.processFactCheck(factRes.data);
              setShowFactsResults(true);
              toggleSection('factChecker');

              if (processed && processed.factCheckers) {
                processed.factCheckers.forEach((checker: any) => {
                  checker.fact.block_id = findBlockIdForText(checker.fact.wrongStatement);
                });

                const cleanFactCheckers = processed.factCheckers.map((checker: any) => ({
                  ...checker,
                  fact: { ...checker.fact, block_id: undefined },
                }));

                setLocalFacts(processed.factCheckers);

                if (processed.correctedContent) {
                  setCorrectedContent(processed.correctedContent);
                  setCorrectionsApplied(processed.correctionsApplied || 0);
                }

                setCopilotData?.((prev: CopilotResponse | null) => ({
                  ...prev,
                  fact: cleanFactCheckers,
                  factSummary: processed.summary,
                  projectId: projectId,
                  Analysispercentage: percentage,
                  factScore: processed.score,
                  compliance: prev?.compliance || null,
                  argumentLogic: prev?.argumentLogic || null,
                  complianceScore: prev?.complianceScore || 0,
                  argumentScore: prev?.argumentScore || 0,
                }));
              } else {
                setLocalFacts([]);
                setCopilotData?.((prev: CopilotResponse | null) => ({
                  ...prev,
                  fact: [],
                  factSummary: processed?.summary || {
                    totalClaims: 0,
                    verifiedClaims: 0,
                    unverifiableClaims: 0,
                    accuracyScore: 100,
                    confidenceScore: 100,
                    recommendations: ['No verifiable factual claims found'],
                  },
                  projectId: projectId,
                  Analysispercentage: percentage,
                  factScore: processed?.score || 100,
                  compliance: prev?.compliance || null,
                  argumentLogic: prev?.argumentLogic || null,
                  complianceScore: prev?.complianceScore || 0,
                  argumentScore: prev?.argumentScore || 0,
                }));
              }
            }
            break;

          case 'compliances':
            setComplianceLoading(true);
            const compReq = analysisService.prepareComplianceCheckRequest(contentText, projectId);
            const compRes = await analysisService.checkCompliance(compReq);

            if (compRes.success && compRes.data) {
              const { complianceViolations, score } = CopilotService.processCompliance(
                compRes.data
              );

              complianceViolations.forEach((comp: any) => {
                comp.statement.block_id = findBlockIdForText(comp.statement.wrongStatement);
              });

              const cleanComplianceViolations = complianceViolations.map((comp: any) => ({
                ...comp,
                statement: { ...comp.statement, block_id: undefined },
              }));

              setLocalCompliances(complianceViolations);
              setShowComplianceResults(true);
              toggleSection('compliance');

              setCopilotData?.((prev: CopilotResponse | null) => ({
                ...prev,
                compliance: cleanComplianceViolations,
                projectId: projectId,
                Analysispercentage: percentage,
                complianceScore: score,
                fact: prev?.fact || null,
                argumentLogic: prev?.argumentLogic || null,
                factSummary: prev?.factSummary,
                factScore: prev?.factScore || 0,
                argumentScore: prev?.argumentScore || 0,
              }));

              if (complianceViolations.length === 0) {
                addToast('No compliance issues found. Document is fully compliant!', 'success');
              }
            }
            break;

          case 'argumentLogic':
            setArgumentLoading(true);
            const argReq = analysisService.prepareArgumentLogicRequest(contentText, projectId);
            const argApiRes = await analysisService.checkArgumentLogic(argReq);

            if (argApiRes.success && argApiRes.data) {
              const { argumentLogic, score } = await CopilotService.processArgumentLogic(
                argApiRes.data
              );

              const argumentLogicsArray = argumentLogic ? [argumentLogic] : [];
              setLocalArgumentLogics(argumentLogicsArray);
              setShowArgumentResults(true);
              toggleSection('argumentLogic');

              setCopilotData?.((prev: CopilotResponse | null) => ({
                ...prev,
                argumentLogic: argumentLogic,
                projectId: projectId,
                Analysispercentage: percentage,
                argumentScore: score,
                fact: prev?.fact || null,
                compliance: prev?.compliance || null,
                factSummary: prev?.factSummary,
                factScore: prev?.factScore || 0,
                complianceScore: prev?.complianceScore || 0,
              }));

              if (argumentLogicsArray.length === 0) {
                addToast(
                  'No logical contradictions found. Document has consistent arguments!',
                  'success'
                );
              }
            }
            break;

          case 'plagiarism':
            setPlagiarismLoading(true);
            const plagiarismPayload = analysisService.preparePlagiarismCheckRequest(contentText);
            const plagiarismRes = await analysisService.checkPlagiarism(plagiarismPayload);

            if (plagiarismRes.success && plagiarismRes.data) {
              const resData: any = plagiarismRes.data;
              const score = resData?.result?.score ?? 0;
              const sources = Array.isArray(resData?.sources) ? resData.sources : [];

              setPlagiarismScore(score);
              setPlagiarismSources(sources);
              setPlagiarismSourceCounts(resData?.result?.source_counts ?? sources.length);
              setPlagiarismTotalWords(resData?.result?.total_plagiarism_words ?? 0);
              setPlagiarismTextWordCounts(resData?.result?.text_word_counts ?? 0);
              setShowPlagiarismResults(true);

              if (!sources.length) {
                addToast('No plagiarism detected.', 'success');
              }
            }
            break;

          case 'ai-detection':
            setAiDetectionLoading(true);
            const aiContent = extractTextFromHTML(latestData);
            if (!aiContent.trim()) {
              addToast('Document is empty.', 'error');
              setAiDetectionLoading(false);
              return;
            }

            const aiRequest = analysisService.preparePlagiarismCheckRequest(aiContent);
            const aiResponse = await analysisService.checkPlagiarism(aiRequest);

            if (aiResponse.success && aiResponse.data) {
              const resData = aiResponse.data;
              const score = resData.result?.score ?? 0;
              const rawSources = resData.sources || [];
              const sources = rawSources.map((s) => ({
                ...s,
                plagiarism_found: s.plagiarism_found || [],
              }));

              setAiDetectionScore(score);
              setAiDetectionSources(sources);
              setAiDetectionSourceCounts(resData.result.source_counts ?? sources.length);
              setAiDetectionTotalWords(resData.result.total_plagiarism_words ?? 0);
              setAiDetectionTextWordCounts(resData.result.text_word_counts ?? 0);
              setShowAiDetectionResults(true);

              if (score === 0) {
                addToast('No AI content detected.', 'success');
              }
            }
            break;

          default:
            uploadDataForAnalysis?.(latestData, type);
            return;
        }

        addToast(
          `${type.charAt(0).toUpperCase() + type.slice(1)} analysis completed successfully`,
          'success'
        );
      } catch (error) {
        console.error(`Error in ${type} analysis:`, error);
        addToast(`Analysis failed. Please try again.`, 'error');
        uploadDataForAnalysis?.(latestData, type);
      } finally {
        setFactsLoading(false);
        setComplianceLoading(false);
        setArgumentLoading(false);
        setPlagiarismLoading(false);
        setAiDetectionLoading(false);
      }
    },
    [
      onGetLatestData,
      projectId,
      uploadDataForAnalysis,
      setCopilotData,
      addToast,
      percentage,
      toggleSection,
    ]
  );

  const handleClear = useCallback(() => {
    setLocalFacts([]);
    setLocalArgumentLogics([]);
    setLocalCompliances([]);
    setShowFactsResults(false);
    setShowComplianceResults(false);
    setShowArgumentResults(false);
    setShowPlagiarismResults(false);
    setPlagiarismScore(0);
    setPlagiarismSources([]);
    setPlagiarismSourceCounts(0);
    setPlagiarismTotalWords(0);
    setPlagiarismTextWordCounts(0);
    setShowAiDetectionResults(false);
    setAiDetectionScore(0);
    setAiDetectionSources([]);
    setAiDetectionSourceCounts(0);
    setAiDetectionTotalWords(0);
    setAiDetectionTextWordCounts(0);
    setExpandedAiDetectionItems({});
    setAiDetectionUnifiedSourcesOpen(false);
    setExpandedPlagiarismItems({});
    setPlagiarismView('selection');
    setCopilotData?.(null);
    setExpandedSections((prev) => ({
      factChecker: false,
      compliance: false,
      argumentLogic: false,
    }));
  }, [setCopilotData, setExpandedSections]);

  useEffect(() => {
    if (!analysisActionsRef) return;
    const actions: AnalysisShortcutActions = {
      analyzeFacts: () => handleAnalyze('facts'),
      analyzeCompliances: () => handleAnalyze('compliances'),
      analyzeArguments: () => handleAnalyze('argumentLogic'),
      analyzePlagiarism: () => handleAnalyze('plagiarism'),
      analyzeAiDetection: () => handleAnalyze('ai-detection'),
      clearAnalysis: () => handleClear(),
      openAnalysisTab: () => {
        setMainTab('analysis');
      },
      openDiscoverTab: () => {
        setMainTab('discover');
      },
      openDocumentsTab: () => {
        setMainTab('documents');
      },
      openAiTab: () => {
        setMainTab('ai');
      },
      openPlagiarismTab: (view: PlagiarismView = 'ai-detection') => {
        setMainTab('plagiarism');
        setPlagiarismView(view);
      },
      setAnalysisSubTab: (tab: AnalysisSubTab) => {
        setAnalysisSubTab(tab);
      },
      openDocumentUpload: () => {
        setIsOpen(true);
      },
      openAnalysisUpload: () => {
        setIsAnalysisUploadOpen(true);
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
    setMainTab,
    setPlagiarismView,
    setAnalysisSubTab,
    setIsOpen,
    setIsAnalysisUploadOpen,
  ]);

  // Upload handlers for dialogs
  const handleUpload = async (file: File) => {
    try {
      const result = await uploadDocument(file, undefined);
      addToast(`Uploaded ${file.name}`, 'success');
      return result;
    } catch (error) {
      addToast(`Failed to upload ${file.name}`, 'error');
      return null;
    }
  };

  const handleMultipleUpload = async (files: File[]) => {
    try {
      const result = await uploadMultipleDocuments(files, undefined);
      addToast(`Uploaded ${files.length} files`, 'success');
      return result;
    } catch (error) {
      addToast(`Failed to upload files`, 'error');
      return null;
    }
  };

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
          <Copy size={22} />
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
            className={`main-tab ${mainTab === 'analysis' ? 'active' : 'inactive'}`}
            onClick={() => setMainTab('analysis')}
          >
            <Sparkles size={16} strokeWidth={1.5} />
            <span>Analysis</span>
            {mainTab === 'analysis' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-[2px] left-0 right-0 h-0.5 bg-[#b48612]"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            className={`main-tab ${mainTab === 'discover' ? 'active' : 'inactive'}`}
            onClick={() => setMainTab('discover')}
          >
            <Search size={16} strokeWidth={1.5} />
            <span>Discover</span>
            {mainTab === 'discover' && (
              <motion.div
                layoutId="activeTab"
                className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#b48612]"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          <button
            className={`main-tab ${mainTab === 'ai' ? 'active' : 'inactive'}`}
            onClick={() => setMainTab('ai')}
          >
            <Sparkles size={18} strokeWidth={1.5} />
            <span>AI</span>
            {mainTab === 'ai' && (
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
              className={`main-tab ${mainTab === 'plagiarism' ? 'active' : 'inactive'}`}
              onClick={() => {
                setMainTab('plagiarism');
                setPlagiarismView('ai-detection');
              }}
            >
              <ShieldAlert size={16} strokeWidth={1.5} />
              <span>AI detections</span>
              {mainTab === 'plagiarism' && (
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
        {mainTab === 'analysis' && (
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
            factScore={factScore}
            complianceScore={complianceScore}
            argumentScore={argumentScore}
            expandedFactItems={expandedFactItems}
            expandedComplianceItems={expandedComplianceItems}
            expandedArgumentItems={expandedArgumentItems}
            setExpandedFactItems={setExpandedFactItems}
            setExpandedComplianceItems={setExpandedComplianceItems}
            setExpandedArgumentItems={setExpandedArgumentItems}
            correctionsApplied={correctionsApplied}
            replaceHighlightedText={replaceHighlightedText}
            rejectFactCorrection={rejectFactCorrection}
            handleResolveAll={handleResolveAll}
            isAIDrafting={isAIDrafting}
            templateType={templateType}
            setMainTab={setMainTab}
            setPlagiarismView={setPlagiarismView}
            plagiarismView={plagiarismView}
            plagiarismLoading={plagiarismLoading}
            showPlagiarismResults={showPlagiarismResults}
            plagiarismScore={plagiarismScore}
            plagiarismSources={plagiarismSources}
            plagiarismTotalWords={plagiarismTotalWords}
            plagiarismTextWordCounts={plagiarismTextWordCounts}
            expandedPlagiarismItems={expandedPlagiarismItems}
            setExpandedPlagiarismItems={setExpandedPlagiarismItems}
            plagiarismUnifiedSourcesOpen={plagiarismUnifiedSourcesOpen}
            setPlagiarismUnifiedSourcesOpen={setPlagiarismUnifiedSourcesOpen}
            aiDetectionLoading={aiDetectionLoading}
            showAiDetectionResults={showAiDetectionResults}
            aiDetectionScore={aiDetectionScore}
            aiDetectionSources={aiDetectionSources}
            aiDetectionTotalWords={aiDetectionTotalWords}
            aiDetectionTextWordCounts={aiDetectionTextWordCounts}
            expandedAiDetectionItems={expandedAiDetectionItems}
            setExpandedAiDetectionItems={setExpandedAiDetectionItems}
            aiDetectionUnifiedSourcesOpen={aiDetectionUnifiedSourcesOpen}
            setAiDetectionUnifiedSourcesOpen={setAiDetectionUnifiedSourcesOpen}
          />
        )}

        {mainTab === 'discover' && (
          <DiscoverTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearchChange={handleSearchChange}
            handleSearchClick={handleSearchClick}
            loading={loading}
            items={items}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            projectDocuments={projectDocuments}
          />
        )}

        {mainTab === 'ai' && <AITab projectId={projectId} editor={tiptapEditor} />}

        {!isAIDrafting && (mainTab === 'plagiarism' || mainTab === 'plagiarism_check') && (
          <PlagiarismTab
            plagiarismView={plagiarismView}
            setPlagiarismView={setPlagiarismView}
            wordCount={wordCount}
            handleClear={onClear || (() => {})}
            showPlagiarismResults={showPlagiarismResults}
            plagiarismLoading={plagiarismLoading}
            plagiarismScore={plagiarismScore}
            plagiarismSources={plagiarismSources}
            plagiarismTotalWords={plagiarismTotalWords}
            plagiarismTextWordCounts={plagiarismTextWordCounts}
            handleAnalyze={handleAnalyze}
            expandedPlagiarismItems={expandedPlagiarismItems}
            setExpandedPlagiarismItems={setExpandedPlagiarismItems}
            plagiarismUnifiedSourcesOpen={plagiarismUnifiedSourcesOpen}
            setPlagiarismUnifiedSourcesOpen={setPlagiarismUnifiedSourcesOpen}
            // AI Detection props
            showAiDetectionResults={showAiDetectionResults}
            aiDetectionLoading={aiDetectionLoading}
            aiDetectionScore={aiDetectionScore}
            aiDetectionSources={aiDetectionSources}
            aiDetectionTotalWords={aiDetectionTotalWords}
            aiDetectionTextWordCounts={aiDetectionTextWordCounts}
            expandedAiDetectionItems={expandedAiDetectionItems}
            setExpandedAiDetectionItems={setExpandedAiDetectionItems}
            aiDetectionUnifiedSourcesOpen={aiDetectionUnifiedSourcesOpen}
            setAiDetectionUnifiedSourcesOpen={setAiDetectionUnifiedSourcesOpen}
          />
        )}
      </div>

      {/* Hover Cards */}
      {hoverCard && (
        <ComplianceHoverCard
          complianceData={hoverCard.data}
          position={hoverCard.position}
          placement={hoverCard.placement}
          onClose={hideComplianceCard}
          onMouseEnter={onComplianceCardEnter}
          onMouseLeave={onComplianceCardLeave}
        />
      )}

      {factHoverCard && (
        <FactHoverCard
          factData={factHoverCard.data}
          position={factHoverCard.position}
          factIndex={factHoverCard.factIndex}
          placement={factHoverCard.placement}
          onClose={hideFactCard}
          onMouseEnter={onFactCardEnter}
          onMouseLeave={onFactCardLeave}
          onAccept={(idx, correctedText) => {
            const highlightId = `fact-${idx}`;
            const highlight = document.querySelector(
              `[data-highlight-id="${highlightId}"]`
            ) as HTMLElement;

            if (highlight) {
              const textNode = document.createTextNode(correctedText);
              highlight.parentNode?.replaceChild(textNode, highlight);

              setLocalFacts((prev) =>
                prev.map((fact, index) =>
                  index === idx ? { ...fact, status: 'accepted' as const } : fact
                )
              );

              addToast('Statement corrected successfully', 'success');

              if (editorRef && editorRef.current) {
                editorRef.current.dispatchEvent(new Event('input', { bubbles: true }));
              }
            } else {
              addToast('Could not find text to replace', 'error');
            }
          }}
          onDismiss={(idx) => {
            setLocalFacts((prev) =>
              prev.map((fact, index) =>
                index === idx ? { ...fact, status: 'rejected' as const } : fact
              )
            );
            addToast('Correction dismissed', 'info');
          }}
        />
      )}

      {argumentHoverCard && (
        <ArgumentHoverCard
          data={argumentHoverCard.data}
          lineId={argumentHoverCard.lineId}
          text={argumentHoverCard.text}
          suggestion={argumentHoverCard.suggestion}
          position={argumentHoverCard.position}
          placement={argumentHoverCard.placement}
          onClose={hideArgumentCard}
          onMouseEnter={onArgumentCardEnter}
          onMouseLeave={onArgumentCardLeave}
          onAccept={(lineId, correctedContent) => {
            const highlight = document.querySelector(`[data-argument-id="${lineId}"]`);
            if (highlight) {
              const textNode = document.createTextNode(correctedContent);
              highlight.parentNode?.replaceChild(textNode, highlight);
              addToast('Argument correction applied', 'success');
              if (editorRef && editorRef.current) {
                editorRef.current.dispatchEvent(new Event('input', { bubbles: true }));
              }
              hideArgumentCard();
            } else {
              addToast('Original text not found', 'error');
            }
          }}
        />
      )}
    </div>
  );
}
