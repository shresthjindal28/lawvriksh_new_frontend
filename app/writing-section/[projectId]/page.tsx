'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Topbar } from '@/components/layout/Topbar.client';
import EditableTitleHeader from '@/components/editor/components/EditableTitleHeader';
import AnalysisSidebar from '@/components/editor/components/analysis-sidebar';
import { EditorToolbar } from '@/components/editor/components/EditorToolbar';
import AIPopup from '@/components/editor/components/AIPopup';
import AIDraftPrompt from '@/components/editor/components/AIDraftPrompt';
import DraftActionCard from '@/components/editor/components/DraftActionCard';
import { useAIWriting } from '@/hooks/writing-hooks';
import { TemplateType } from '@/types/aiWriting';
import { useToast } from '@/lib/contexts/ToastContext';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import {
  useCitationManager,
  useAIDraftingManager,
  useAIPopupManager,
  useAutoSave,
  useScrollHeader,
  useUnsavedChangesWarning,
} from '@/hooks/editor';

import { CopilotResponse } from '@/types/copilot';
import CitePopupCard from '@/components/editor/components/citations/CitePopupCard';
import ReferencesSection from '@/components/editor/components/ReferencesSection';
import { Citation } from '@/types/citations';
import { parseMarkdownToHTML } from '@/components/editor/components/TiptapEditor';
import { editorJsToHtml } from '@/lib/utils/editorHelper';
import { exportContentToPdf, exportContentToDocx } from '@/lib/utils/pdfExport';
import type { AnalysisShortcutActions } from '@/types/analysis-sidebar';
// import { useCitations } from '@/hooks/useCitations';
import { useProjectData } from '@/hooks/writing-hooks';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCitationStore } from '@/store/zustand/useCitationStore';
import SmartSuggestionManager from '@/components/editor/components/SmartSuggestionManager';
import ToolbarShortcut from '@/components/ui/ToolbarShortcut';
import ToolSearchBar from '@/components/ui/ToolSearchBar';
import { useReferenceActions } from '@/app/references/hooks/useReferenceActions';
import { FileText, ShieldCheck, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettings } from '@/lib/contexts/SettingsContext';
import UnsavedChangesModal from '@/components/ui/UnsavedChangesModal';
import Loader from '@/components/ui/Loader';
import '@/styles/writing-page/editor-base.css';
import '@/styles/writing-page/tiptap-editor.css';
import '@/styles/writing-page/editor-layout.css';
import DeleteProjectDialog from '@/components/common/DeleteProjectDialog';
import { useDeleteModalStore } from '@/store/zustand/useDeleteModalStore';

// Helper function to detect page number from editor cursor position
const getPageNumberAtPositionFromEditor = (editor: any, pos: number): number => {
  if (!editor?.view) return 1;

  try {
    const domInfo = editor.view.domAtPos(pos);
    let node: Node | null = domInfo.node;

    // If text node, get parent element
    if (node && node.nodeType === 3 && node.parentElement) {
      node = node.parentElement;
    }

    let current = node as HTMLElement | null;
    let maxDepth = 30;

    while (current && current !== document.body && maxDepth > 0) {
      if (current.classList?.contains('page')) {
        const pageNum = current.getAttribute('data-page-number');
        if (pageNum) return parseInt(pageNum, 10);

        // Fallback: count pages before this one
        const documentContainer = current.closest('.tiptap-document-container') || document;
        const pages = documentContainer.querySelectorAll('.page');
        const pageIndex = Array.from(pages).indexOf(current);
        if (pageIndex >= 0) return pageIndex + 1;
      }

      if (current.classList?.contains('tiptap-page-break')) {
        const pageNum = current.getAttribute('data-page-number');
        if (pageNum) return parseInt(pageNum, 10);
      }

      current = current.parentElement;
      maxDepth--;
    }
  } catch (e) {
    console.warn('Page number detection failed:', e);
  }

  return 1;
};

// Editor Skeleton Component
const EditorSkeleton = () => (
  <div className="max-w-4xl mx-auto p-8 space-y-8">
    <div className="space-y-4">
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  </div>
);

// Dynamically import BlockBasedTiptapEditor for writing-section (block-based editing)
const TiptapEditor = dynamic(
  () =>
    import('@/components/editor/components/BlockBasedTiptapEditor').then(
      (mod) => mod.BlockBasedTiptapEditor
    ),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

// Types

interface Block {
  id: string;
  type: string;
  data: {
    text: string;
    level?: number;
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
}

interface TemplateData {
  time: number;
  version?: string;
  blocks?: Block[];
  content?: string;
  variables: Record<string, any>;
}

// Demo data - will be replaced by API response
const DEMO_DATA: TemplateData = {
  time: 1678886400000,
  version: '1.0',
  blocks: [],
  variables: {},
};

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.projectId as string) || 'default';
  const { deleteProject } = useWorkspace();
  const { openModal, setLoading, closeModal } = useDeleteModalStore();

  const handleBack = () => {
    router.push('/dashboard');
  };
  const { addToast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const analysisActionsRef = useRef<AnalysisShortcutActions | null>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // const [isExportOpen, setIsExportOpen] = useState(false); - Removed
  const [projectData, setProjectData] = useState<any>(null);

  // Analysis state
  const [copilotData, setCopilotData] = useState<CopilotResponse | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    factChecker: true,
    compliance: true,
    argumentLogic: true,
  });
  const [, setIsCopilotOpen] = useState(true);

  // ==================== SHARED HOOKS ====================

  // Citation Manager Hook
  const {
    citePopupVisible,
    citePopupPosition,
    citationSelectedText,
    showAllLibraryReferences,
    handleCite: handleCiteFromHook,
    handleAddCitationToEditor: handleAddCitationFromHook,
    handleCiteFromReferences: handleCiteFromReferencesFromHook,
    closeCitePopup,
  } = useCitationManager();

  // AI Popup Manager Hook
  const {
    isAIPopupVisible,
    selectedTextForAI,
    selectedHtmlForAI,
    aiPopupPosition,
    handleAi: handleAiFromHook,
    handleAIAction: handleAIActionFromHook,
    closeAIPopup,
    isCentered,
  } = useAIPopupManager();

  // AI Drafting Manager Hook
  const {
    isDraftPromptOpen,
    isDraftLoading,
    draftPromptPosition,
    draftRange,
    draftActionPosition,
    isDraftPending,
    draftPromptRef,
    handleSlash: handleSlashFromHook,
    handleDraftSubmit: handleDraftSubmitFromHook,
    handleAcceptDraft: handleAcceptDraftFromHook,
    handleDiscardDraft: handleDiscardDraftFromHook,
    closeDraftPrompt,
    setDraftActionPosition,
  } = useAIDraftingManager();

  // Scroll Header Hook
  const { headersHidden, editorScrollRef } = useScrollHeader();

  // Settings context for autosave preference
  const { settings, toggleSetting } = useSettings();
  const autoSaveEnabled = settings.workspace.autoSave;

  // ==================== END SHARED HOOKS ====================

  // Use useProjectData hook for proper citation API calls and save functionality
  const {
    projectTitle: fetchedProjectTitle,
    updateProjectData,
    citations: blockCitations,
    addCitation,
    references: workspaceReferences,
    addWorkspaceReference,
    deleteWorkspaceReference,
    getAllCitations,
    isLoading: isProjectLoading,
    project,
    profile,
    setProjectTitle,
    templateType,
  } = useProjectData(projectId);

  // Auth context for user ID
  const { user } = useAuth();

  // Citation store for footer updates
  const setCitations = useCitationStore((state) => state.setCitations);

  // Reference actions for smart suggestions
  const { listRefDocuments } = useReferenceActions();

  // Refs for cursor position tracking
  const lastCursorPositionRef = useRef<{ blockId: string; offset: number } | null>(null);

  // Debug: Log draft action state
  useEffect(() => {
    console.log('[DraftAction] State changed:', { isDraftPending, draftActionPosition });
  }, [isDraftPending, draftActionPosition]);

  // AI Writing hook for draft generation
  const { generateParagraph, isLoading: isAILoading } = useAIWriting();

  // Use citations hook for recommendation API calls
  // const { addToLibrary, isAddingToLibrary } = useCitations();

  // Template data state
  const [templateData, setTemplateData] = useState<TemplateData>(DEMO_DATA);
  const [citationStyle, setCitationStyle] = useState('bluebook');
  const [textSize, setTextSize] = useState('normal');
  const [isTranslating, setIsTranslating] = useState(false);

  // Zoom state
  const [zoomLevel, setZoomLevel] = useState(100);
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50));

  // Editor content state (for save functionality)
  const [editorContent, setEditorContent] = useState<string>('');
  const [wordCount, setWordCount] = useState(0);
  // Track initial load to prevent editor unmounting during background validations
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  useEffect(() => {
    if (!isProjectLoading && project) {
      setHasInitialLoad(true);
    }
  }, [isProjectLoading, project]);

  // Helper to count words from HTML string (fallback/initial)
  const countWords = (html: string) => {
    if (!html) return 0;
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text ? text.split(' ').length : 0;
  };

  // Initialize word count from template content
  // Initialize word count from template content
  useEffect(() => {
    if (templateData?.content && wordCount === 0) {
      setWordCount((prev) => (prev === 0 ? countWords(templateData.content || '') : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData?.content]);

  // Right sidebar (Analysis) resize state
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Right sidebar resize handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Calculate new width (move left increases width)
    const delta = startXRef.current - e.clientX;
    const newWidth = Math.max(440, Math.min(800, startWidthRef.current + delta));
    setSidebarWidth(newWidth);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);

    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarWidth;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [sidebarWidth, handleMouseMove, handleMouseUp]
  );

  // Persist sidebar width
  useEffect(() => {
    const savedWidth = localStorage.getItem('writing-section-sidebar-width');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth));
    }
  }, []);

  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem('writing-section-sidebar-width', sidebarWidth.toString());
    }
  }, [sidebarWidth, isResizing]);

  // Note: headersHidden and editorScrollRef are provided by useScrollHeader hook
  // Derive templateData from useProjectData hook's project object
  // This eliminates duplicate API calls - the hook already fetches workspace data
  useEffect(() => {
    if (!project) return;

    console.log('📦 Deriving template data from useProjectData hook');

    // Extract templateData from metadata (check multiple nesting levels)
    const metadataTemplateData =
      (project.metadata as any)?.data?.data?.data?.templateData ||
      (project.metadata as any)?.data?.data?.templateData ||
      (project.metadata as any)?.data?.templateData ||
      (project.metadata as any)?.templateData ||
      {};

    // Extract content from the content field (check multiple nesting levels)
    const contentData =
      (project.content as any)?.data?.data?.data ||
      (project.content as any)?.data?.data ||
      (project.content as any)?.data ||
      {};

    // For NEW projects: content blocks are empty, HTML is in metadata.templateData.content
    // For SAVED projects: HTML content is in contentData.blocks[0].data.text OR we need to convert blocks
    const templateHtmlContent = metadataTemplateData.content || '';

    // Check if blocks array exists and has content
    const hasBlocks =
      contentData.blocks && Array.isArray(contentData.blocks) && contentData.blocks.length > 0;

    // Get HTML content:
    // 1. If blocks exist and first block has HTML text (saved content), use that
    // 2. Otherwise, if blocks exist, convert them to HTML using editorJsToHtml
    // 3. Otherwise, use metadata template content as fallback
    let htmlContent = '';

    if (hasBlocks) {
      const firstBlockText = contentData.blocks?.[0]?.data?.text || '';
      // Check if first block contains HTML (saved content) vs plain text (template blocks)
      const isHtmlContent = firstBlockText.includes('<') && firstBlockText.includes('>');

      if (isHtmlContent) {
        // Saved HTML content in first block
        htmlContent = firstBlockText;
      } else {
        // Convert EditorJS blocks to HTML
        const contentAsOutputData = {
          time: contentData.time || Date.now(),
          blocks: contentData.blocks,
          version: contentData.version || '2.28.0',
        };
        htmlContent = editorJsToHtml(contentAsOutputData);
        console.log('📄 Converted blocks to HTML:', htmlContent.substring(0, 200));
      }
    }

    // Fallback to metadata template content if no valid HTML from blocks
    if (!htmlContent || htmlContent.trim() === '') {
      htmlContent = templateHtmlContent;
    }

    // Default content for empty editor - "Start writing here" with a Heading
    const cleanContent = (htmlContent || '').replace(/<[^>]*>/g, '').trim();
    if (
      !htmlContent ||
      cleanContent === '' ||
      htmlContent === '<p></p>' ||
      htmlContent === '<p class="is-empty"></p>'
    ) {
      htmlContent = '<h1>Heading</h1><p>Start writing here...</p>';
    }

    // Use metadata variables if available, otherwise extract from content
    const templateVariables =
      metadataTemplateData.variables && Object.keys(metadataTemplateData.variables).length > 0
        ? metadataTemplateData.variables
        : contentData.variables || {};

    // Build the template data object
    const parsedTemplate: TemplateData = {
      time: contentData.time || metadataTemplateData.time || Date.now(),
      version: contentData.version || metadataTemplateData.version || '2.0',
      content: htmlContent,
      blocks: contentData.blocks || [],
      variables: templateVariables,
    };

    console.log('📄 Template derived from hook:', {
      hasContent: !!htmlContent,
      contentLength: htmlContent.length,
      variableCount: Object.keys(parsedTemplate.variables).length,
    });

    // Only update state if content or critical metadata has changed
    setTemplateData((prev) => {
      // Simple equality check for content to avoid re-renders
      if (prev.content === parsedTemplate.content) {
        return prev;
      }
      return parsedTemplate;
    });
    // Variables removed
    setProjectData(project); // Set projectData for TitleHeader compatibility
  }, [project]);

  // Load saved sidebar widths from localStorage
  useEffect(() => {
    const savedRightWidth = localStorage.getItem('aidrafting-right-sidebar-width');

    if (savedRightWidth) {
      const width = parseInt(savedRightWidth, 10);
      if (width >= 440 && width <= 700) {
        setSidebarWidth(width);
      }
    }
  }, []);

  // Mobile sidebar states
  const [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen] = useState(false);

  // Note: editorScrollRef is provided by useScrollHeader hook

  // Analysis helpers
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const onGetLatestData = useCallback(async (): Promise<string | null> => {
    // Return current editor content as HTML string
    if (editorInstance) {
      return editorInstance.getHTML();
    }
    return editorContent;
  }, [editorContent, editorInstance]);

  const uploadDataForAnalysis = useCallback(async (data: string, type: string) => {
    console.log('Uploading data for analysis:', type, data && data.substring(0, 50) + '...');
    // Implementation depends on requirements, for now just log
  }, []);

  // Handle content change from editor
  // Use a ref to store the triggerDebouncedSave function to avoid declaration order issues
  const triggerDebouncedSaveRef = useRef<() => void>(() => {});

  const handleContentChange = useCallback((content: string) => {
    // Clean ghost content before updating state
    setEditorContent(content);
    // Trigger debounced autosave via ref
    triggerDebouncedSaveRef.current();
  }, []);

  // ==================== WRAPPER HANDLERS (Call hook methods) ====================

  // Citation handlers - wrap hook methods with required dependencies
  const handleCite = useCallback(() => {
    handleCiteFromHook(editorInstance);
  }, [editorInstance, handleCiteFromHook]);

  // Helper function to extract citations from editor and update citation store
  // Helper function to extract citations from editor and update citation store
  // Model-Based Variant for Stability
  const updateCitationStoreFromEditor = useCallback(() => {
    // 1. Traverse Model to find all citations
    const extractedCitations: Array<{ pageNumber: number; title: string }> = [];

    if (editorInstance?.state?.doc) {
      editorInstance.state.doc.descendants(
        (
          node: {
            isText: boolean;
            marks?: Array<{ type: { name: string }; attrs: Record<string, unknown> }>;
          },
          pos: number
        ) => {
          if (node.isText && node.marks) {
            const citationMark = node.marks.find(
              (m: { type: { name: string } }) => m.type.name === 'citation'
            );
            if (citationMark) {
              const title = (citationMark.attrs.citationTitle ||
                citationMark.attrs.title ||
                'Unknown Citation') as string;

              // Determine Page Number from DOM
              let pageNumber = 1;
              try {
                const domInfo = editorInstance.view.domAtPos(pos + 1);
                let domNode: Node | HTMLElement | null = domInfo.node;
                if (domNode && domNode.nodeType === 3 && (domNode as ChildNode).parentElement) {
                  domNode = (domNode as ChildNode).parentElement;
                }

                let currentElement = domNode as HTMLElement;
                for (let i = 0; i < 20; i++) {
                  if (!currentElement) break;
                  if (currentElement.classList && currentElement.classList.contains('page')) {
                    const data = currentElement.getAttribute('data-page-number');
                    if (data) pageNumber = parseInt(data, 10);
                    break;
                  }
                  if (
                    currentElement.classList &&
                    currentElement.classList.contains('tiptap-page-break')
                  ) {
                    const data = currentElement.getAttribute('data-page-number');
                    if (data) pageNumber = parseInt(data, 10);
                    break;
                  }
                  if (currentElement.parentElement) {
                    currentElement = currentElement.parentElement;
                  } else {
                    break;
                  }
                }
              } catch (e) {
                console.warn('Error fetching citation page', e);
              }
              extractedCitations.push({ pageNumber, title });
            }
          }
        }
      );
    }

    // 2. Update store with Deep Equality Check
    const currentCitations = useCitationStore.getState().citations;
    let hasChanged = false;

    if (extractedCitations.length !== currentCitations.length) {
      hasChanged = true;
    } else {
      for (let i = 0; i < extractedCitations.length; i++) {
        if (
          extractedCitations[i].pageNumber !== currentCitations[i].pageNumber ||
          extractedCitations[i].title !== currentCitations[i].title
        ) {
          hasChanged = true;
          break;
        }
      }
    }

    if (hasChanged) {
      setCitations(extractedCitations);
    }
  }, [editorInstance, setCitations]);

  // Update citation store on editor update - BUT only as fallback when store is empty
  // The primary source of truth is now addCitation() which updates store immediately
  // This listener is only for edge cases like page load or manual DOM edits
  useEffect(() => {
    if (!editorInstance) return;

    // Only run on initial load to populate store from existing citations in editor
    // Don't run on every update - that causes race conditions with addCitation()
    const initialUpdate = setTimeout(() => {
      // Only update if store is currently empty
      const currentCitations = useCitationStore.getState().citations;
      if (currentCitations.length === 0) {
        updateCitationStoreFromEditor();
      }
    }, 1500);

    return () => {
      clearTimeout(initialUpdate);
    };
  }, [editorInstance, updateCitationStoreFromEditor]);

  const handleAddCitationToEditor = useCallback(
    async (citation: Citation) => {
      await handleAddCitationFromHook(
        citation,
        editorInstance,
        addWorkspaceReference,
        addCitation,
        addToast
      );

      // NOTE: Removed setTimeout call to updateCitationStoreFromEditor()
      // The addCitation function now updates the store immediately (before API call)
      // Calling updateCitationStoreFromEditor() was causing a race condition that
      // overwrote the store with stale/incomplete DOM data
    },
    [editorInstance, addWorkspaceReference, addCitation, addToast, handleAddCitationFromHook]
  );

  const handleCiteFromReferences = useCallback(
    async (reference: any) => {
      // Get cursor position BEFORE insertion for page number detection
      const { from } = editorInstance?.state?.selection || { from: 0 };

      // Insert citation HTML into editor
      handleCiteFromReferencesFromHook(reference, editorInstance, addToast);

      // CRITICAL FIX: Also call addCitation() to keep useProjectData state in sync
      // This prevents online citations from overwriting local citations when both
      // call addCitation() since they now share the same state
      try {
        // Detect page number at cursor position
        let pageNumber = 1;
        if (editorInstance) {
          try {
            const domInfo = editorInstance.view.domAtPos(from);
            let node: Node | null = domInfo.node;
            if (node && node.nodeType === 3 && node.parentElement) {
              node = node.parentElement;
            }
            let current = node as HTMLElement | null;
            let maxDepth = 30;
            while (current && current !== document.body && maxDepth > 0) {
              if (current.classList?.contains('page')) {
                const pageNum = current.getAttribute('data-page-number');
                if (pageNum) {
                  pageNumber = parseInt(pageNum, 10);
                  break;
                }
                const pages = document.querySelectorAll('.page');
                const pageIndex = Array.from(pages).indexOf(current);
                if (pageIndex >= 0) {
                  pageNumber = pageIndex + 1;
                  break;
                }
              }
              current = current.parentElement;
              maxDepth--;
            }
          } catch (e) {
            console.warn('Page detection failed for local citation:', e);
          }
        }

        // Create citation object matching the format used by online citations
        const citation = {
          id: `tiptap-doc_${Date.now()}`,
          title: reference.title || '',
          author: reference.author || '',
          source: reference.source || 'Library',
          link: reference.link || '',
          reference_id: reference.id,
          pageNumber: pageNumber,
        };

        // Sync to useProjectData state (this updates Zustand store immediately)
        await addCitation('tiptap-doc', citation);
      } catch (error) {
        console.error('Error syncing local citation to state:', error);
        // Fallback: still try to update store from editor
        setTimeout(() => {
          updateCitationStoreFromEditor();
        }, 300);
      }
    },
    [
      editorInstance,
      addToast,
      handleCiteFromReferencesFromHook,
      addCitation,
      updateCitationStoreFromEditor,
    ]
  );

  // AI Popup handlers
  const handleAi = useCallback(
    (e?: React.MouseEvent) => {
      handleAiFromHook(e, editorInstance, addToast);
    },
    [editorInstance, addToast, handleAiFromHook]
  );

  const handleAIAction = useCallback(
    (action: string, customText?: string) => {
      handleAIActionFromHook(action, customText, editorInstance);
    },
    [editorInstance, handleAIActionFromHook]
  );

  // AI Drafting handlers
  const handleSlash = useCallback(() => {
    handleSlashFromHook(editorInstance);
  }, [editorInstance, handleSlashFromHook]);

  const handleDraftSubmit = useCallback(
    async (prompt: string, templateType: TemplateType, documentTitle?: string) => {
      await handleDraftSubmitFromHook(
        prompt,
        templateType,
        documentTitle || fetchedProjectTitle,
        editorInstance,
        generateParagraph,
        addToast
      );
    },
    [editorInstance, fetchedProjectTitle, generateParagraph, addToast, handleDraftSubmitFromHook]
  );

  const handleAcceptDraft = useCallback(() => {
    handleAcceptDraftFromHook(editorInstance, addToast);
  }, [editorInstance, addToast, handleAcceptDraftFromHook]);

  const handleDiscardDraft = useCallback(() => {
    handleDiscardDraftFromHook(editorInstance, addToast);
  }, [editorInstance, addToast, handleDiscardDraftFromHook]);

  // Close handlers for escape/click-outside
  useEffect(() => {
    if (!isDraftPromptOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDraftPrompt();
        editorInstance?.commands.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (draftPromptRef.current && !draftPromptRef.current.contains(e.target as Node)) {
        closeDraftPrompt();
        editorInstance?.commands.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDraftPromptOpen, editorInstance, closeDraftPrompt, draftPromptRef]);

  // ==================== END WRAPPER HANDLERS ====================

  // Save document using useProjectData hook
  const handleSave = useCallback(
    async (isAutoSave: boolean = false) => {
      if (!editorInstance) return;

      // Don't save if there's pending draft (blue text) - wait for Accept/Discard
      if (isDraftPending) {
        console.log('⏳ Skipping save - pending draft awaiting Accept/Discard');
        return;
      }

      try {
        // Get latest content from Tiptap editor
        let htmlContent = editorInstance.getHTML();

        const jsonContent = editorInstance.getJSON();

        // Strip out any remaining draft content markers (cleanup for edge cases)
        // Create a temporary DOM to remove .ai-draft-content elements
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const draftElements = tempDiv.querySelectorAll('.ai-draft-content');
        draftElements.forEach((el) => el.remove());
        htmlContent = tempDiv.innerHTML;

        // Extract citations from editor with page numbers
        // Get all tiptap-page-break elements - each represents a page container
        const editorDom = editorInstance.view?.dom;

        // Get all page elements from the document container
        // First, find the container that holds all pages by traversing up from editorDom
        const documentContainer =
          editorDom?.closest('.tiptap-document-container') ||
          editorDom?.closest('.ai-drafting-editor-scroll') ||
          editorDom?.parentElement?.closest('.tiptap-document-container') ||
          document;

        // Try to find .page elements first (these are the actual page containers)
        let pageElements: Element[] = Array.from(
          documentContainer?.querySelectorAll('.page') || []
        );

        // Fallback to .tiptap-page-break if .page elements not found
        if (pageElements.length === 0) {
          pageElements = Array.from(
            documentContainer?.querySelectorAll('.tiptap-page-break') ||
              document.querySelectorAll('.tiptap-page-break') ||
              []
          );
        }

        // Get existing citations to preserve page numbers when DOM detection fails
        const existingCitations = getAllCitations();
        // Create maps for both ID and citation number lookups for better matching
        const existingCitationMapById = new Map(existingCitations.map((c) => [c.id, c]));
        const existingCitationMapByNumber = new Map(
          existingCitations.map((c) => [
            c.number || parseInt(c.id.replace('citation_', '')) || 0,
            c,
          ])
        );

        // Extract citations with page number detection using closest() to find containing page
        const citationElements = editorDom?.querySelectorAll('.inline-citation') || [];
        const extractedCitations: Array<{
          number: number;
          title: string;
          id: string;
          link: string;
          pageNumber: number;
        }> = [];

        // Collect all citations with their DOM positions for better page detection
        const citationsWithPosition: Array<{
          el: Element;
          citationNumber: string;
          referenceId: string | null;
          title: string | null;
          link: string | null;
          domPosition: number;
        }> = [];

        citationElements.forEach((el: Element) => {
          const citationNumber = el.getAttribute('data-citation-number');
          const referenceId = el.getAttribute('data-reference-id');
          const title = el.getAttribute('data-citation-title');
          const link = el.getAttribute('data-citation-link');

          // Calculate DOM position (distance from top of document)
          let position = 0;
          let currentEl: Element | null = el;
          while (currentEl) {
            position += (currentEl as HTMLElement).offsetTop || 0;
            currentEl = currentEl.parentElement;
          }

          if (citationNumber) {
            citationsWithPosition.push({
              el,
              citationNumber,
              referenceId,
              title,
              link,
              domPosition: position,
            });
          }
        });

        // Sort by DOM position to determine order
        citationsWithPosition.sort((a, b) => a.domPosition - b.domPosition);

        citationsWithPosition.forEach(({ el, citationNumber, referenceId, title, link }) => {
          // Method 1: Try to find the .page element that contains this citation
          let containingPage = el.closest('.page');

          // Method 2: If not found, try .tiptap-page-break
          if (!containingPage) {
            containingPage = el.closest('.tiptap-page-break');
          }

          // Method 3: Traverse up to find any page ancestor
          if (!containingPage) {
            let parent = el.parentElement;
            let maxDepth = 20; // Prevent infinite loops
            while (parent && parent !== document.body && maxDepth > 0) {
              if (
                parent.classList.contains('page') ||
                parent.classList.contains('tiptap-page-break')
              ) {
                containingPage = parent;
                break;
              }
              parent = parent.parentElement;
              maxDepth--;
            }
          }

          // Method 4: Check if element is inside any page element by checking contains
          if (!containingPage && pageElements.length > 0) {
            for (const pageEl of pageElements) {
              const pageElement = pageEl as Element;
              if (pageElement.contains(el)) {
                containingPage = pageElement;
                break;
              }
            }
          }

          // Find the index of that page in the pageElements array
          let pageIndex = -1;
          if (containingPage) {
            pageIndex = pageElements.indexOf(containingPage);
            // If indexOf fails (different element references), find by comparing DOM nodes
            if (pageIndex === -1) {
              for (let i = 0; i < pageElements.length; i++) {
                const pageElement = pageElements[i] as Element;
                if (pageElement === containingPage || pageElement.contains(el)) {
                  pageIndex = i;
                  break;
                }
              }
            }
          }

          // Calculate page number - use DOM-based detection
          let pageNumber = 1;

          if (pageIndex >= 0) {
            // DOM-based page detection succeeded - use it (most reliable)
            pageNumber = pageIndex + 1;
          } else if (pageElements.length > 0) {
            // If we can't find the page by index, try position-based detection
            const citationRect = (el as HTMLElement).getBoundingClientRect();
            const citationTop = citationRect.top;

            // Find which page's top is closest but above the citation
            let bestPageIndex = 0;
            let minDistance = Infinity;

            for (let i = 0; i < pageElements.length; i++) {
              const pageElement = pageElements[i] as HTMLElement;
              const pageRect = pageElement.getBoundingClientRect();
              const pageTop = pageRect.top;
              const distance = citationTop - pageTop;

              // If citation is below this page's top and distance is smaller
              if (distance >= 0 && distance < minDistance) {
                minDistance = distance;
                bestPageIndex = i;
              }
            }

            pageNumber = bestPageIndex + 1;

            // Fallback: try to use existing citation's page number if position detection fails
            if (pageNumber === 1 && pageElements.length > 1) {
              let existingCitation = null;
              if (referenceId) {
                existingCitation = existingCitationMapById.get(referenceId);
              }
              if (!existingCitation && citationNumber) {
                const citationId = `citation_${citationNumber}`;
                existingCitation = existingCitationMapById.get(citationId);
              }
              const citationNum = citationNumber ? parseInt(citationNumber, 10) : null;
              if (!existingCitation && citationNum !== null) {
                existingCitation = existingCitationMapByNumber.get(citationNum);
              }
              if (existingCitation && existingCitation.pageNumber) {
                pageNumber = existingCitation.pageNumber;
              }
            }
          } else {
            // No pages detected - try to match existing citation
            let existingCitation = null;

            if (referenceId) {
              existingCitation = existingCitationMapById.get(referenceId);
            }

            if (!existingCitation && citationNumber) {
              const citationId = `citation_${citationNumber}`;
              existingCitation = existingCitationMapById.get(citationId);
            }

            const citationNum = citationNumber ? parseInt(citationNumber, 10) : null;
            if (!existingCitation && citationNum !== null) {
              existingCitation = existingCitationMapByNumber.get(citationNum);
            }

            if (existingCitation && existingCitation.pageNumber) {
              pageNumber = existingCitation.pageNumber;
            }
          }

          if (citationNumber) {
            extractedCitations.push({
              number: parseInt(citationNumber, 10),
              title: title || '',
              id: referenceId || '',
              link: link || '',
              pageNumber: pageNumber,
            });
          }
        });

        // Sort citations by number
        extractedCitations.sort((a, b) => a.number - b.number);

        // Convert to OutputData format expected by backend
        const contentData = {
          time: Date.now(),
          blocks: [
            {
              id: 'draft-content',
              type: 'paragraph',
              data: {
                text: htmlContent,
                json: jsonContent,
              },
            },
          ],
          version: '2.0',
        };

        // Prepare updated template data (without citations - they go directly to metadata.citations)
        const updatedTemplateData = {
          ...templateData,
          content: htmlContent, // Save current HTML as template content
          variables: {},
          time: Date.now(),
        };

        // Save citations directly to metadata.citations using saveCitationsToMetadata
        // Convert array to the expected format (keyed by block id with array of citations)
        const citationsForMetadata: { [key: string]: any[] } = {
          'tiptap-doc': extractedCitations.map((c) => ({
            ...c,
            id: c.id || `citation_${c.number}`,
            addedAt: new Date().toISOString(),
          })),
        };

        // Call updateProjectData from the hook with both content and metadata
        await updateProjectData(
          contentData,
          { templateData: updatedTemplateData, citations: citationsForMetadata },
          undefined,
          isAutoSave
        );
      } catch (error) {
        console.error('Error saving document:', error);
        if (!isAutoSave) {
          addToast('Failed to save document', 'error');
        }
        throw error;
      }
    },
    [editorInstance, templateData, updateProjectData, addToast, isDraftPending, getAllCitations]
  );

  // Use auto-save hook for debounced autosave
  const { hasUnsavedChanges, triggerDebouncedSave, markAsSaved } = useAutoSave({
    editorInstance,
    isLoading: isProjectLoading,
    isDraftPending,
    onSave: handleSave,
    autoSaveEnabled,
  });

  // Update the ref with the actual function
  useEffect(() => {
    triggerDebouncedSaveRef.current = triggerDebouncedSave;
  }, [triggerDebouncedSave]);

  // Watch for editor updates and sync citations to store in real-time
  useEffect(() => {
    if (!editorInstance) return;

    const handleEditorUpdate = () => {
      // Debounce to avoid too many updates
      setTimeout(() => {
        updateCitationStoreFromEditor();
      }, 300);
    };

    editorInstance.on('update', handleEditorUpdate);
    editorInstance.on('selectionUpdate', handleEditorUpdate);

    return () => {
      editorInstance.off('update', handleEditorUpdate);
      editorInstance.off('selectionUpdate', handleEditorUpdate);
    };
  }, [editorInstance, updateCitationStoreFromEditor]);

  // Unsaved changes warning hook
  const { showWarningModal, handleSaveAndContinue, handleDiscardChanges, handleCancelNavigation } =
    useUnsavedChangesWarning({
      hasUnsavedChanges,
      autoSaveEnabled,
      onSave: async () => {
        await handleSave(false);
        markAsSaved();
      },
    });

  // Handle autosave toggle
  const handleToggleAutoSave = useCallback(() => {
    toggleSetting('workspace', 'autoSave');
  }, [toggleSetting]);

  // Note: Smart Suggestion functionality is now handled by SmartSuggestionManager component

  // Handle title change from EditableTitleHeader
  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      setProjectTitle(newTitle);

      // Save the new title to the backend
      // Pass newTitle directly to updateProjectData to ensure it's saved immediately
      // (avoids React's async state update timing issue)
      if (onGetLatestData) {
        const content = await onGetLatestData();
        if (content) {
          await updateProjectData(content as any, undefined, newTitle);
        }
      }
    },
    [setProjectTitle, updateProjectData, onGetLatestData]
  );

  const handleTrashClick = useCallback(
    (id: string) => {
      const title = fetchedProjectTitle || 'Untitled Project';

      openModal(id, title, async () => {
        setLoading(true);
        try {
          await deleteProject(id);
          closeModal();
          router.push('/dashboard');
          addToast('Project deleted successfully', 'success');
        } catch (error) {
          console.error('Failed to delete project:', error);
          setLoading(false);
          addToast('Failed to delete project', 'error');
        }
      });
    },
    [fetchedProjectTitle, openModal, setLoading, closeModal, deleteProject, router, addToast]
  );

  const handleMenuAction = useCallback(
    async (action: string) => {
      const filenameBase = (fetchedProjectTitle || 'Document')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();

      const formattedReferences = (workspaceReferences || []).map((ref: any, index: number) => ({
        number: index + 1,
        title: ref.title || 'Untitled',
        link: ref.link || '',
        id: ref.id || undefined,
        author: ref.author || 'Unknown',
        source: ref.source || 'online',
      }));

      if (action === 'export-pdf') {
        if (editorInstance) {
          await exportContentToPdf(editorInstance, `${filenameBase}.pdf`, formattedReferences);
          addToast('Exporting PDF...', 'success');
        } else {
          addToast('Editor not ready', 'error');
        }
      } else if (action === 'export-docx') {
        if (editorInstance) {
          await exportContentToDocx(editorInstance, `${filenameBase}.docx`, formattedReferences);
          addToast('Exporting DOCX...', 'success');
        } else {
          addToast('Editor not ready', 'error');
        }
      }
    },
    [editorInstance, fetchedProjectTitle, addToast, workspaceReferences]
  );

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden"
      style={{ backgroundColor: 'var(--lv-bg-primary, #FCFCF9)' }}
    >
      {/* Headers - hide on scroll down, show on scroll up with smooth animation */}
      <div
        style={{
          maxHeight: headersHidden ? '0px' : '200px',
          opacity: headersHidden ? 0 : 1,
          overflow: 'hidden',
          transition:
            'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'max-height, opacity',
        }}
      >
        {/* Header */}
        <Topbar
          logoText="LawVriksh"
          projectId={projectId}
          onGetLatestData={onGetLatestData}
          updateProjectData={async () => {
            await handleSave();
            markAsSaved();
          }}
          onMenuAction={handleMenuAction}
          showPrimaryButton={false}
          autoSaveEnabled={autoSaveEnabled}
          onToggleAutoSave={handleToggleAutoSave}
          onTrashClick={handleTrashClick}
          centerContent={
            <ToolSearchBar
              editor={editorInstance}
              onCite={handleCite}
              onAi={handleAi}
              analysisActions={analysisActionsRef.current}
              variant="header"
            />
          }
        />

        {/* Secondary Header */}
        {/* Secondary Header - Editable */}
        <EditableTitleHeader
          projectTitle={
            project?.title && project.title !== 'undefined'
              ? project.title
              : fetchedProjectTitle && fetchedProjectTitle !== 'undefined'
                ? fetchedProjectTitle
                : 'Untitled Document'
          }
          project={project || projectData}
          onTitleChange={handleTitleChange}
          isSaving={isProjectLoading}
          onBack={handleBack}
        />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div
          className="flex flex-col flex-1 min-w-0"
          style={{ backgroundColor: 'var(--lv-bg-white, #FFFFFF)' }}
        >
          {/* Toolbar - Global */}
          <div
            className="shrink-0 relative z-20"
            style={{
              overflow: 'visible',
              borderBottom: '1px solid var(--lv-border-light, #F1F3F3)',
              backgroundColor: 'var(--lv-bg-white, #FFFFFF)',
            }}
          >
            <EditorToolbar
              editor={editorInstance}
              onCite={handleCite}
              onAi={handleAi}
              textSize={textSize}
              onTextSizeChange={setTextSize}
              onTranslatingStateChange={setIsTranslating}
              zoomLevel={zoomLevel}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />
            <ToolbarShortcut
              editor={editorInstance}
              onCite={handleCite}
              onAi={handleAi}
              analysisActions={analysisActionsRef.current}
            />
          </div>

          {/* Main Content */}
          <div className="editor-layout-wrapper">
            {/* Document Editor Section */}
            <main className="editor-layout-main">
              {/* AI Popup Backdrop - Blur effect when AI is centered (no text selected) */}
              {isAIPopupVisible && isCentered && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 45,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                  }}
                />
              )}
              {/* Translation Loader Overlay */}
              {isTranslating && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 50,
                    backgroundColor: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Loader message="Translating..." />
                </div>
              )}
              {/* Only show skeleton on INITIAL load */}
              {!hasInitialLoad && isProjectLoading ? (
                <EditorSkeleton />
              ) : (
                <div ref={editorScrollRef} className="editor-scroll-area">
                  <TiptapEditor
                    ref={editorRef}
                    templateData={templateData}
                    variables={[]} // variables removed
                    onContentChange={handleContentChange}
                    onEditorReady={setEditorInstance}
                    citationStyle={citationStyle}
                    textSize={textSize}
                    isAiPopupOpen={isAIPopupVisible}
                    onSlash={handleSlash}
                    onShowAIPopup={handleAi}
                    onCite={handleCite}
                    zoomLevel={zoomLevel}
                  />
                  {/* ReferencesSection placed at end of scrollable content */}
                  <ReferencesSection
                    editor={editorInstance}
                    references={workspaceReferences}
                    citations={blockCitations}
                    onDeleteReference={deleteWorkspaceReference}
                    citationStyle={citationStyle}
                    onStyleChange={setCitationStyle}
                    onCiteReference={handleCiteFromReferences}
                  />
                  {/* AI Draft Prompt - triggered by / command */}
                  {isDraftPromptOpen && draftPromptPosition && (
                    <div
                      ref={draftPromptRef}
                      className="ai-draft-popup-wrapper"
                      style={{
                        position: 'fixed',
                        top: draftPromptPosition.top,
                        left: window.innerWidth < 800 ? '50%' : draftPromptPosition.left,
                        transform: window.innerWidth < 800 ? 'translateX(-50%)' : 'none',
                        zIndex: 1000,
                        width: window.innerWidth < 800 ? '80%' : 'min(550px, calc(100vw - 40px))',
                        maxWidth: '600px',
                      }}
                    >
                      <AIDraftPrompt
                        onSubmit={handleDraftSubmit}
                        isLoading={isDraftLoading}
                        visible={isDraftPromptOpen}
                        documentTitle={fetchedProjectTitle || 'Untitled'}
                        templateType={(templateData as any)?.templateType || 'article'}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Draft Action Card (Accept/Discard) - Fixed position outside scrollable area */}
              {/* DraftActionCard - Rendered in a fixed full-screen overlay for correct positioning and drag */}
              {isDraftPending && draftActionPosition && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    pointerEvents: 'none', // Allow clicks to pass through wrapper
                    zIndex: 1000,
                  }}
                >
                  {/* Container for pointer events auto */}
                  <div style={{ pointerEvents: 'auto' }}>
                    <DraftActionCard
                      onAccept={handleAcceptDraft}
                      onDiscard={handleDiscardDraft}
                      position={draftActionPosition}
                      onPositionChange={setDraftActionPosition}
                    />
                  </div>
                </div>
              )}

              {/* Mobile Floating Buttons */}

              <button
                onClick={() => setIsMobileRightSidebarOpen(!isMobileRightSidebarOpen)}
                className="lg:hidden fixed bottom-24 right-6 z-[9999] rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all"
                style={{ backgroundColor: '#133435', color: '#ffffff' }}
                aria-label="Toggle analysis panel"
              >
                <ShieldCheck size={24} />
              </button>
            </main>
          </div>
        </div>

        {/* Right Sidebar Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          className={`hidden lg:block w-1 shrink-0 cursor-col-resize transition-all z-20 ${
            isResizing ? 'bg-blue-500 w-2' : 'bg-transparent hover:bg-gray-300'
          }`}
          role="separator"
          aria-label="Resize right sidebar"
          aria-orientation="vertical"
        />

        {/* Right Sidebar - Analysis (Desktop) */}
        <aside
          className="hidden lg:flex shrink-0 flex-col overflow-hidden"
          style={{
            width: isSidebarCollapsed ? 60 : sidebarWidth,
            borderLeft: '1px solid var(--lv-border-primary, #E3E3E3)',
            backgroundColor: 'var(--lv-bg-white, #FFFFFF)',
          }}
        >
          <AnalysisSidebar
            projectId={projectId}
            wordCount={wordCount}
            percentage={copilotData?.Analysispercentage || 0}
            fact={copilotData?.fact}
            compliance={copilotData?.compliance}
            argumentLogic={copilotData?.argumentLogic}
            factSummary={copilotData?.factSummary}
            expandedSections={expandedSections}
            setExpandedSections={setExpandedSections}
            toggleSection={toggleSection}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            setIsCopilotOpen={setIsCopilotOpen}
            setCopilotData={setCopilotData}
            onGetLatestData={onGetLatestData}
            uploadDataForAnalysis={uploadDataForAnalysis}
            editorRef={editorRef}
            tiptapEditor={editorInstance}
            documentsLoading={false}
            factScore={copilotData?.factScore}
            complianceScore={copilotData?.complianceScore}
            argumentScore={copilotData?.argumentScore}
            templateType={templateType}
            analysisActionsRef={analysisActionsRef}
          />
        </aside>

        {/* Mobile Right Sidebar Modal */}
        {isMobileRightSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-90 lg:hidden"
              onClick={() => setIsMobileRightSidebarOpen(false)}
            />
            <div className="fixed bottom-0 right-0 left-0 top-20 bg-white z-100 lg:hidden overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Analysis</h2>
                <button
                  onClick={() => setIsMobileRightSidebarOpen(false)}
                  className="text-gray-600 hover:text-gray-900 text-2xl leading-none"
                >
                  <X size={24} />
                </button>
              </div>
              <AnalysisSidebar
                projectId={projectId}
                wordCount={wordCount}
                percentage={copilotData?.Analysispercentage || 0}
                fact={copilotData?.fact}
                compliance={copilotData?.compliance}
                argumentLogic={copilotData?.argumentLogic}
                factSummary={copilotData?.factSummary}
                expandedSections={expandedSections}
                setExpandedSections={setExpandedSections}
                toggleSection={toggleSection}
                isCollapsed={false}
                setIsCollapsed={() => {}}
                setIsCopilotOpen={setIsCopilotOpen}
                setCopilotData={setCopilotData}
                onGetLatestData={onGetLatestData}
                uploadDataForAnalysis={uploadDataForAnalysis}
                editorRef={editorRef}
                tiptapEditor={editorInstance}
                documentsLoading={false}
                factScore={copilotData?.factScore}
                complianceScore={copilotData?.complianceScore}
                argumentScore={copilotData?.argumentScore}
                templateType={templateType}
                analysisActionsRef={analysisActionsRef}
              />
            </div>
          </>
        )}

        <CitePopupCard
          isVisible={citePopupVisible}
          position={citePopupPosition}
          selectedText={citationSelectedText}
          blockId="tiptap-selection"
          showAllLibrary={showAllLibraryReferences}
          onClose={closeCitePopup}
          onAddCitation={handleAddCitationToEditor}
          citations={getAllCitations()}
        />
        <AIPopup
          isVisible={isAIPopupVisible}
          selectedText={selectedTextForAI}
          selectedHtml={selectedHtmlForAI}
          position={aiPopupPosition}
          onClose={closeAIPopup}
          onAction={handleAIAction}
          projectId={projectId}
        />
        {/* Smart Suggestion Manager - handles ghost text, keyboard shortcuts, and hover tooltip */}
        <SmartSuggestionManager
          editorInstance={editorInstance}
          projectId={projectId}
          userId={profile?.user_id || user?.user_id || ''}
          templateContent={templateData?.content || ''}
          listRefDocuments={listRefDocuments}
          isDrafting={isDraftPromptOpen || isDraftPending}
        />

        {/* Unsaved Changes Warning Modal */}
        <UnsavedChangesModal
          isOpen={showWarningModal}
          onSaveAndContinue={handleSaveAndContinue}
          onDiscardChanges={handleDiscardChanges}
          onCancel={handleCancelNavigation}
        />

        <DeleteProjectDialog />
      </div>
    </div>
  );
}
