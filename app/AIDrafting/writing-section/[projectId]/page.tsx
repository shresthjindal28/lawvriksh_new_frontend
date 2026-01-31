'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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
import {
  useCitationManager,
  useAIDraftingManager,
  useAIPopupManager,
  useAutoSave,
  useScrollHeader,
  useUnsavedChangesWarning,
  useNewProjectExitWarning,
} from '@/hooks/editor';
import { useToast } from '@/lib/contexts/ToastContext';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { DiscardSaveDialog } from '@/components/ui/DiscardSaveDialog';

import { CopilotResponse } from '@/types/copilot';
import CitePopupCard from '@/components/editor/components/citations/CitePopupCard';
import ReferencesSection from '@/components/editor/components/ReferencesSection';
import { Citation } from '@/types/citations';
import { parseMarkdownToHTML } from '@/components/editor/components/TiptapEditor';
import { exportContentToPdf, exportContentToDocx } from '@/lib/utils/pdfExport';
// import { useCitations } from '@/hooks/useCitations';
import { useProjectData } from '@/hooks/writing-hooks';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCitationStore } from '@/store/zustand/useCitationStore';
import SmartSuggestionManager from '@/components/editor/components/SmartSuggestionManager';
import type { AnalysisShortcutActions } from '@/types/analysis-sidebar';
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
import '@/styles/writing-page/ai-drafting-page.css';
import DeleteProjectDialog from '@/components/common/DeleteProjectDialog';
import { useDeleteModalStore } from '@/store/zustand/useDeleteModalStore';

// Editor Skeleton Component
const EditorSkeleton = () => (
  <div className="ai-drafting-skeleton-container">
    <div className="ai-drafting-skeleton-section ai-drafting-skeleton-section--header">
      <Skeleton style={{ height: '48px', width: '75%' }} />
      <Skeleton style={{ height: '16px', width: '50%' }} />
    </div>
    <div className="ai-drafting-skeleton-section ai-drafting-skeleton-section--content">
      <Skeleton style={{ height: '16px', width: '100%' }} />
      <Skeleton style={{ height: '16px', width: '100%' }} />
      <Skeleton style={{ height: '16px', width: '100%' }} />
      <Skeleton style={{ height: '16px', width: '83%' }} />
    </div>
    <div className="ai-drafting-skeleton-section ai-drafting-skeleton-section--content">
      <Skeleton style={{ height: '16px', width: '100%' }} />
      <Skeleton style={{ height: '16px', width: '100%' }} />
      <Skeleton style={{ height: '16px', width: '80%' }} />
    </div>
  </div>
);

// Dynamically import TiptapEditor to avoid SSR issues with ProseMirror
const TiptapEditor = dynamic(
  () =>
    import('@/components/editor/components/TiptapEditor').then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => <EditorSkeleton />,
  }
);

// Types
type VariableType = 'text' | 'email' | 'number' | 'date' | 'url' | 'currency';

interface TemplateVariable {
  name: string;
  label: string;
  type: VariableType;
  value: string;
  editable: boolean;
}

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
  variables: Record<
    string,
    {
      value: string;
      editable: boolean;
      type: VariableType;
      label: string;
    }
  >;
}

// Demo data - will be replaced by API response
const DEMO_DATA: TemplateData = {
  time: 1678886400000,
  version: '1.0',
  blocks: [],
  variables: {},
};

// Extract variables from template data
// Handles both object format and JSON string format from backend
// Also extracts variables from HTML content if variables object is empty
function extractVariables(templateData: TemplateData): TemplateVariable[] {
  let variables = Object.entries(templateData.variables).map(([name, data]) => {
    // If data is a JSON string, parse it first
    let parsedData = data;
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
        console.log(`✅ Parsed variable from JSON string: ${name}`);
      } catch (e) {
        console.error(`❌ Failed to parse variable ${name}:`, e);
        // Create a fallback structure
        parsedData = {
          value: data,
          editable: true,
          type: 'text',
          label: name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        };
      }
    }

    // Ensure all required fields exist with fallbacks
    return {
      name,
      label: parsedData.label || name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      type: parsedData.type || 'text',
      value: parsedData.value || '',
      editable: parsedData.editable !== false, // Default to true if not specified
    };
  });

  // If variables object is empty but we have HTML content with variable chips, extract them from HTML
  if (variables.length === 0 && templateData.content) {
    const variableChipRegex = /data-var-name="([^"]+)"\s+data-var-label="([^"]+)"/g;
    const foundVariables = new Map<string, { label: string; type: string }>();

    let match;
    while ((match = variableChipRegex.exec(templateData.content)) !== null) {
      const varName = match[1];
      const varLabel = match[2];
      if (!foundVariables.has(varName)) {
        foundVariables.set(varName, {
          label: varLabel,
          type: 'text',
        });
      }
    }

    // Convert found variables to TemplateVariable format
    variables = Array.from(foundVariables.entries()).map(([name, data]) => ({
      name,
      label: data.label,
      type: data.type as VariableType,
      value: '', // Empty value - user will fill it in
      editable: true,
    }));

    console.log(`📝 Extracted ${variables.length} variables from HTML content`);
  }

  return variables;
}

// Get input type for variable
function getInputType(varType: VariableType): string {
  switch (varType) {
    case 'email':
      return 'email';
    case 'date':
      return 'date';
    case 'number':
    case 'currency':
      return 'number';
    default:
      return 'text';
  }
}

export default function TemplateEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = (params?.projectId as string) || 'default';
  const { addToast } = useToast();
  const { deleteProject } = useWorkspace();
  const { openModal, setLoading, closeModal } = useDeleteModalStore();

  // Citation store setter and clearer
  const setCitations = useCitationStore((state) => state.setCitations);
  const clearCitations = useCitationStore((state) => state.clearCitations);

  // Clear citations on mount to prevent showing stale citations from other pages
  useEffect(() => {
    clearCitations();
  }, [clearCitations]);

  // Discard/Save Dialog state
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const isNewProject = searchParams?.get('new') === 'true';

  const handleBack = () => {
    if (isNewProject) {
      setIsDiscardDialogOpen(true);
    } else {
      router.push('/dashboard');
    }
  };

  const handleDiscard = async () => {
    try {
      await deleteProject(projectId, true);
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to discard project', error);
      addToast('Failed to discard project', 'error');
    }
  };

  const handleDialogSave = () => {
    // Navigate to dashboard. Auto-save should have handled the saving.
    router.push('/dashboard');
  };

  // New Project Exit Warning Hook
  const { handleConfirmSave, handleConfirmDiscard } = useNewProjectExitWarning({
    isNewProject,
    onDiscard: handleDiscard,
    onSave: handleDialogSave,
    isOpen: isDiscardDialogOpen,
    setIsOpen: setIsDiscardDialogOpen,
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const analysisActionsRef = useRef<AnalysisShortcutActions | null>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // const [isExportOpen, setIsExportOpen] = useState(false); - Removed
  const [projectData, setProjectData] = useState<any>(null);

  // Analysis state
  const [copilotData, setCopilotData] = useState<CopilotResponse | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [wordCount, setWordCount] = useState(0);
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
  } = useProjectData(projectId);

  // Auth context for user ID
  const { user } = useAuth();

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
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 50));

  // Variables state
  const [variables, setVariables] = useState<TemplateVariable[]>(() => extractVariables(DEMO_DATA));

  // Editor content state (for save functionality)
  const [editorContent, setEditorContent] = useState<string>('');

  // Helper to count words from HTML string (fallback/initial)
  const countWords = (html: string) => {
    if (!html) return 0;
    const text = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text ? text.split(' ').length : 0;
  };

  // Right sidebar (Analysis) resize state
  const [sidebarWidth, setSidebarWidth] = useState(500);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Left sidebar (Variables) resize state
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(320);
  const [isLeftResizing, setIsLeftResizing] = useState(false);
  const leftStartXRef = useRef(0);
  const leftStartWidthRef = useRef(0);

  // Left sidebar visibility toggle
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  // Mobile sidebar states
  const [isMobileLeftSidebarOpen, setIsMobileLeftSidebarOpen] = useState(false);
  const [isMobileRightSidebarOpen, setIsMobileRightSidebarOpen] = useState(false);

  // Note: headersHidden and scroll refs are now provided by useScrollHeader hook

  // Derive templateData from useProjectData hook's project object
  // This eliminates duplicate API calls - the hook already fetches workspace data
  useEffect(() => {
    if (!project) return;

    console.log('📦 Deriving template data from useProjectData hook');

    // Extract templateData from metadata (has extra nesting: data.data.data.templateData)
    const metadataTemplateData =
      (project.metadata as any)?.data?.data?.data?.templateData ||
      (project.metadata as any)?.data?.data?.templateData ||
      (project.metadata as any)?.templateData ||
      {};

    // Extract content from the content field (contains the actual HTML and blocks)
    const contentData =
      (project.content as any)?.data?.data || (project.content as any)?.data || {};

    // For NEW projects: content blocks are empty, HTML is in metadata.templateData.content
    // For SAVED projects: HTML content is in contentData.blocks[0].data.text
    const savedHtmlContent = contentData.blocks?.[0]?.data?.text || '';
    const templateHtmlContent = metadataTemplateData.content || '';

    // Prioritize saved content (if exists), otherwise use template content from metadata
    let htmlContent = savedHtmlContent || templateHtmlContent;

    // Check if blocks array is effectively empty
    const hasBlocks =
      contentData.blocks && Array.isArray(contentData.blocks) && contentData.blocks.length > 0;

    // Default content for empty editor - "Start writing here" with a Heading
    // Trigger if: no htmlContent OR htmlContent is empty OR no blocks (unless it's a template)
    // Aggressive check: strip ALL tags. If result is empty string, consider it empty.
    const cleanContent = (htmlContent || '').replace(/<[^>]*>/g, '').trim();
    // Also catch specific literal cases just to be safe
    if (
      (!htmlContent ||
        cleanContent === '' ||
        htmlContent === '<p></p>' ||
        htmlContent === '<p class="is-empty"></p>') &&
      !hasBlocks
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

    // Use a timeout to avoid synchronous state updates during render
    const timer = setTimeout(() => {
      setTemplateData(parsedTemplate);
      setVariables(extractVariables(parsedTemplate));
      setProjectData(project); // Set projectData for TitleHeader compatibility
    }, 0);
    return () => clearTimeout(timer);
  }, [project]);

  // Initialize word count from template content
  // Initialize word count from template content
  useEffect(() => {
    if (templateData?.content && wordCount === 0) {
      const count = countWords(templateData.content);
      // Use functional update to avoid dependency on wordCount if possible, or just suppression if logical
      setWordCount((prev) => (prev === 0 ? count : prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData?.content]);

  // Load saved sidebar widths from localStorage
  useEffect(() => {
    const savedRightWidth = localStorage.getItem('aidrafting-right-sidebar-width');
    const savedLeftWidth = localStorage.getItem('aidrafting-left-sidebar-width');
    const savedLeftOpen = localStorage.getItem('aidrafting-left-sidebar-open');

    if (savedRightWidth) {
      const width = parseInt(savedRightWidth, 10);
      if (width >= 440 && width <= 700) {
        setTimeout(() => setSidebarWidth(width), 0);
      }
    }
    if (savedLeftWidth) {
      const width = parseInt(savedLeftWidth, 10);
      if (width >= 200 && width <= 500) {
        // Defer or initial state should handle this, avoiding setState in effect if possible, but here wrapping in timeout or checks
        setTimeout(() => setLeftSidebarWidth(width), 0);
      }
    }
    if (savedLeftOpen !== null) {
      setTimeout(() => setIsLeftSidebarOpen(savedLeftOpen === 'true'), 0);
    }
  }, []);

  // Note: editorScrollRef and headersHidden are now provided by useScrollHeader hook

  // Right sidebar resize start handler
  const handleResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = sidebarWidth;
    },
    [sidebarWidth]
  );

  // Left sidebar resize start handler
  const handleLeftResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsLeftResizing(true);
      leftStartXRef.current = e.clientX;
      leftStartWidthRef.current = leftSidebarWidth;
    },
    [leftSidebarWidth]
  );

  // Handle resize mouse move and up for right sidebar
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(440, Math.min(800, startWidthRef.current - delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem('aidrafting-right-sidebar-width', sidebarWidth.toString());
    };

    // Only change cursor during active resize
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      // Always reset cursor when effect cleans up
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  // Handle resize mouse move and up for left sidebar
  useEffect(() => {
    if (!isLeftResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - leftStartXRef.current;
      const newWidth = Math.max(200, Math.min(500, leftStartWidthRef.current + delta));
      setLeftSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsLeftResizing(false);
      localStorage.setItem('aidrafting-left-sidebar-width', leftSidebarWidth.toString());
    };

    // Only change cursor during active resize
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      // Always reset cursor when effect cleans up
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isLeftResizing, leftSidebarWidth]);

  // Toggle left sidebar visibility
  const toggleLeftSidebar = useCallback(() => {
    setIsLeftSidebarOpen((prev) => {
      const newValue = !prev;
      localStorage.setItem('aidrafting-left-sidebar-open', newValue.toString());
      return newValue;
    });
  }, []);

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

  // Handle variable change from sidebar
  const handleVariableChange = useCallback((variableName: string, newValue: string) => {
    setVariables((prev) =>
      prev.map((v) => (v.name === variableName ? { ...v, value: newValue } : v))
    );
  }, []);

  // Handle content change from editor
  // Use a ref to store the triggerDebouncedSave function to avoid declaration order issues
  const triggerDebouncedSaveRef = useRef<() => void>(() => {});

  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content);
    setTemplateData((prev) => ({
      ...prev,
      content: content,
    }));
    // Trigger debounced autosave via ref
    triggerDebouncedSaveRef.current();
  }, []);

  // Handle variable click from editor
  const handleVariableClick = useCallback((variableName: string) => {
    // 1. Open sidebar if closed
    setIsLeftSidebarOpen(true);
    if (window.innerWidth < 1024) {
      setIsMobileLeftSidebarOpen(true);
    }

    // 2. Wait for render (if sidebar was closed), then find and focus
    setTimeout(() => {
      const inputId = `variable-input-${variableName}`;
      const mobileInputId = `mobile-${variableName}`;

      let element = document.getElementById(inputId);
      // Fallback to mobile input if desktop input not found (e.g. valid on mobile view)
      if (!element) {
        element = document.getElementById(mobileInputId);
      }

      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();

        // Add a temporary highlight effect
        element.style.transition = 'box-shadow 0.3s ease';
        const originalBoxShadow = element.style.boxShadow;
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.4)'; // blue ring

        setTimeout(() => {
          element!.style.boxShadow = originalBoxShadow;
        }, 1500);
      } else {
        console.warn(`Variable input not found: ${variableName}`);
      }
    }, 100); // Short delay to allow sidebar transition/render
  }, []);

  // ==================== WRAPPER HANDLERS (Call hook methods) ====================

  // Citation handlers - wrap hook methods with required dependencies
  const handleCite = useCallback(() => {
    handleCiteFromHook(editorInstance);
  }, [editorInstance, handleCiteFromHook]);

  // Helper function to extract citations from editor and update citation store
  // Model-Based Variant for Stability
  const updateCitationStoreFromEditorNew = useCallback(() => {
    // 1. Traverse Model to find all citations
    const extractedCitations: Array<{ pageNumber: number; title: string }> = [];

    if (editorInstance?.state?.doc) {
      editorInstance.state.doc.descendants((node: any, pos: any) => {
        if (node.isText && node.marks) {
          const citationMark = node.marks.find((m: any) => m.type.name === 'citation');
          if (citationMark) {
            const title =
              citationMark.attrs.citationTitle || citationMark.attrs.title || 'Unknown Citation';

            // Determine Page Number from DOM
            let pageNumber = 1;
            try {
              const domInfo = editorInstance.view.domAtPos(pos + 1);
              let domNode: Node | null = domInfo.node;
              if (domNode?.nodeType === 3 && domNode.parentElement) {
                domNode = domNode.parentElement;
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
      });
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

  const updateCitationStoreFromEditor = useCallback(() => {
    // Redirect to new implementation
    updateCitationStoreFromEditorNew();
  }, [updateCitationStoreFromEditorNew]); // KEEP OLD SIGNATURE BUT REDIRECT

  // Track Word Count
  useEffect(() => {
    if (!editorInstance) return;

    const updateWordCount = () => {
      const text = editorInstance.getText();
      // Split by whitespace and filter empty strings
      const count = text
        .trim()
        .split(/\s+/)
        .filter((w: any) => w.length > 0).length;
      setWordCount(count);
    };

    // Debounce citation updates to prevent flickering
    let timeoutId: NodeJS.Timeout;
    const debouncedCitationUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        updateCitationStoreFromEditor();
      }, 1000);
    };

    editorInstance.on('update', updateWordCount);
    editorInstance.on('update', debouncedCitationUpdate);

    // Initial updates
    updateWordCount();
    // Use timeout to allow DOM to render
    setTimeout(updateCitationStoreFromEditor, 1000);

    return () => {
      editorInstance.off('update', updateWordCount);
      editorInstance.off('update', debouncedCitationUpdate);
      clearTimeout(timeoutId);
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

      // Update citation store after a short delay to allow DOM to update
      setTimeout(() => {
        updateCitationStoreFromEditor();
      }, 500);
    },
    [
      editorInstance,
      addWorkspaceReference,
      addCitation,
      addToast,
      handleAddCitationFromHook,
      updateCitationStoreFromEditor,
    ]
  );

  const handleCiteFromReferences = useCallback(
    (reference: any) => {
      handleCiteFromReferencesFromHook(reference, editorInstance, addToast);
    },
    [editorInstance, addToast, handleCiteFromReferencesFromHook]
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

  // Close handlers for escape/click-outside (use hook's closeDraftPrompt)
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

        // Get all page elements from the document container (page breaks are PARENT wrappers, not children of editorDom)
        // First, find the container that holds all pages by traversing up from editorDom
        const documentContainer =
          editorDom?.closest('.tiptap-document-container') ||
          editorDom?.closest('.ai-drafting-editor-scroll') ||
          editorDom?.parentElement?.closest('.tiptap-document-container');

        // Query page elements from the container or document if container not found
        const pageElements: Element[] = Array.from(
          documentContainer?.querySelectorAll('.tiptap-page-break') ||
            document.querySelectorAll('.tiptap-page-break') ||
            []
        );

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

        const extractedCitations: Array<{
          number: number;
          title: string;
          id: string;
          link: string;
          pageNumber: number;
        }> = [];

        citationsWithPosition.forEach(({ el, citationNumber, referenceId, title, link }) => {
          // Method 1: Try closest page break (most reliable)
          let containingPage = el.closest('.tiptap-page-break');

          // Method 2: If closest fails, traverse up to find any page break ancestor
          if (!containingPage) {
            let parent = el.parentElement;
            while (parent && parent !== document.body) {
              if (parent.classList.contains('tiptap-page-break')) {
                containingPage = parent;
                break;
              }
              parent = parent.parentElement;
            }
          }

          // Method 3: Check if element is inside any page element by checking contains
          if (!containingPage && pageElements.length > 0) {
            for (const pageEl of pageElements) {
              if (pageEl.contains(el)) {
                containingPage = pageEl;
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
                if (pageElements[i] === containingPage || pageElements[i].contains(el)) {
                  pageIndex = i;
                  break;
                }
              }
            }
          }

          // Calculate page number with multiple fallback strategies
          let pageNumber = 1;
          const citationNum = citationNumber ? parseInt(citationNumber, 10) : null;

          if (pageIndex >= 0) {
            // DOM-based page detection succeeded - use it (most reliable)
            pageNumber = pageIndex + 1;
          } else if (pageElements.length > 0) {
            // DOM detection failed but pages exist - use intelligent fallback
            let existingCitation = null;

            // Try to find existing citation
            if (referenceId) {
              existingCitation = existingCitationMapById.get(referenceId);
            }

            if (!existingCitation && citationNumber) {
              const citationId = `citation_${citationNumber}`;
              existingCitation = existingCitationMapById.get(citationId);
            }

            if (!existingCitation && citationNum !== null) {
              existingCitation = existingCitationMapByNumber.get(citationNum);
            }

            // PRIORITY: If we have multiple pages, use citation number to determine page
            // This fixes the issue where citation_2 should be on page 2, not page 1
            if (pageElements.length >= 2 && citationNum && citationNum > 1) {
              // Force citation_2+ to be on page 2+ when we have multiple pages
              pageNumber = Math.min(citationNum, pageElements.length);
            } else if (
              pageElements.length >= 2 &&
              citationsWithPosition.length >= 2 &&
              citationNum
            ) {
              // Multiple pages and citations - distribute by citation number
              pageNumber = Math.min(citationNum, pageElements.length);
            } else if (
              existingCitation &&
              existingCitation.pageNumber &&
              pageElements.length === 1
            ) {
              // Only use existing page number if we have a single page
              pageNumber = existingCitation.pageNumber;
            } else if (citationNum && citationNum > 1 && pageElements.length >= citationNum) {
              // Fallback: citation number suggests which page
              pageNumber = Math.min(citationNum, pageElements.length);
            } else if (existingCitation && existingCitation.pageNumber) {
              // Last resort: use existing page number
              pageNumber = existingCitation.pageNumber;
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

            if (!existingCitation && citationNum !== null) {
              existingCitation = existingCitationMapByNumber.get(citationNum);
            }

            if (existingCitation && existingCitation.pageNumber) {
              pageNumber = existingCitation.pageNumber;
            }
          }

          if (citationNumber) {
            // Debug logging for page number assignment
            console.log(`📄 Citation ${citationNumber}:`, {
              citationNum,
              pageIndex,
              pageElementsLength: pageElements.length,
              calculatedPageNumber: pageNumber,
              domDetectionWorked: pageIndex >= 0,
            });

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

        // Reconstruct template variables object from current state
        const variablesRecord: Record<string, any> = {};
        variables.forEach((v) => {
          variablesRecord[v.name] = {
            value: v.value,
            editable: v.editable,
            type: v.type,
            label: v.label,
          };
        });

        // Prepare updated template data (without citations - they go directly to metadata.citations)
        const updatedTemplateData = {
          ...templateData,
          content: htmlContent, // Save current HTML as template content
          variables: variablesRecord,
          time: Date.now(),
        };

        // Save citations directly to metadata.citations
        // Convert array to the expected format (keyed by block id with array of citations)
        const citationsForMetadata: { [key: string]: any[] } = {
          'tiptap-doc': extractedCitations.map((c) => ({
            ...c,
            id: c.id || `citation_${c.number}`,
            addedAt: new Date().toISOString(),
          })),
        };

        // Update citation store immediately with extracted citations (before saving)
        const setCitationStore = useCitationStore.getState().setCitations;
        const citationItems = extractedCitations
          .filter((c) => c.pageNumber !== undefined && c.title)
          .map((c) => ({
            pageNumber: c.pageNumber,
            title: c.title,
          }));
        if (citationItems.length > 0) {
          setCitationStore(citationItems);
        }

        // Call updateProjectData from the hook with both content and metadata
        await updateProjectData(
          contentData,
          { templateData: updatedTemplateData, citations: citationsForMetadata },
          undefined,
          isAutoSave
        );

        console.log('✅ Document and template data saved successfully');
        console.log('📚 Citations saved:', extractedCitations.length);
      } catch (error) {
        console.error('Error saving document:', error);
        if (!isAutoSave) {
          addToast('Failed to save document', 'error');
        }
        throw error;
      }
    },
    [
      editorInstance,
      variables,
      templateData,
      updateProjectData,
      addToast,
      isDraftPending,
      getAllCitations,
    ]
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

  // Unsaved changes warning hook
  const { showWarningModal, handleSaveAndContinue, handleDiscardChanges, handleCancelNavigation } =
    useUnsavedChangesWarning({
      hasUnsavedChanges: isNewProject ? false : hasUnsavedChanges,
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

  // Separate editable and readonly variables for display
  const editableVariables = variables.filter((v) => v.editable);

  const readonlyVariables = variables.filter((v) => !v.editable);

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

  /* Fix: Map workspaceReferences to match CitationData interface expected by export functions */
  const handleMenuAction = useCallback(
    async (action: string) => {
      const filenameBase = (fetchedProjectTitle || 'Document')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();

      // Map workspace references to CitationData format (requires 'number')
      const formattedReferences = (workspaceReferences || []).map((ref: any, index: number) => ({
        ...ref,
        number: index + 1,
        title: ref.title || 'Untitled',
        link: ref.link || '',
        author: ref.author || 'Unknown',
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
    <div className="ai-drafting-page">
      {/* Headers - hide on scroll down, show on scroll up with smooth animation */}
      <div
        className={`ai-drafting-headers ${headersHidden ? 'ai-drafting-headers--hidden' : 'ai-drafting-headers--visible'}`}
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
              onAi={handleAi}
              onCite={handleCite}
              onToggleVariables={toggleLeftSidebar}
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

      <div className="ai-drafting-layout">
        <div className="ai-drafting-content-wrapper">
          {/* Toolbar - Global */}
          <div className="ai-drafting-toolbar">
            <EditorToolbar
              editor={editorInstance}
              onCite={handleCite}
              onAi={handleAi}
              onToggleVariables={toggleLeftSidebar}
              isVariablesPanelOpen={isLeftSidebarOpen}
              textSize={textSize}
              onTextSizeChange={setTextSize}
              onTranslatingStateChange={setIsTranslating}
              zoomLevel={zoomLevel}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />
            <ToolbarShortcut
              editor={editorInstance}
              onAi={handleAi}
              onCite={handleCite}
              onToggleVariables={toggleLeftSidebar}
              analysisActions={analysisActionsRef.current}
            />
          </div>

          {/* Main Content */}
          <div className="ai-drafting-main-content">
            {/* Left Sidebar - Variable Input Fields */}
            <aside
              className={`ai-drafting-left-sidebar ${isLeftSidebarOpen ? 'ai-drafting-left-sidebar--open' : 'ai-drafting-left-sidebar--closed'}`}
              style={{
                width: isLeftSidebarOpen ? `${leftSidebarWidth}px` : '0px',
              }}
            >
              {isLeftSidebarOpen && (
                <div className="ai-drafting-left-sidebar-content">
                  <h2 className="ai-drafting-left-sidebar-title">
                    <span className="ai-drafting-left-sidebar-title-icon">(x)</span>
                    Template Fields
                  </h2>
                  <p className="ai-drafting-left-sidebar-description">
                    Fill in the required details for your legal document.
                  </p>

                  {/* Editable Fields */}
                  <div className="ai-drafting-variables-section">
                    {editableVariables.map((variable) => (
                      <div key={variable.name} className="ai-drafting-variable-group">
                        <label
                          htmlFor={`variable-input-${variable.name}`}
                          className="ai-drafting-variable-label"
                        >
                          {variable.label}:
                        </label>
                        <input
                          type={getInputType(variable.type)}
                          id={`variable-input-${variable.name}`}
                          value={variable.value}
                          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          placeholder={`Enter ${variable.label.toLowerCase()}...`}
                          className="ai-drafting-variable-input"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Read-only Fields */}
                  {readonlyVariables.length > 0 && (
                    <>
                      <h3 className="ai-drafting-readonly-section-title">Read-only Fields</h3>
                      <div className="ai-drafting-readonly-fields">
                        {readonlyVariables.map((variable) => (
                          <div key={variable.name} className="ai-drafting-variable-group">
                            <label className="ai-drafting-readonly-label">{variable.label}:</label>
                            <input
                              type="text"
                              value={variable.value}
                              disabled
                              className="ai-drafting-readonly-input"
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Help Section - Updated to theme colors */}
                  <div className="ai-drafting-help-section">
                    <h4 className="ai-drafting-help-title">
                      <svg
                        className="ai-drafting-help-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      Tips
                    </h4>
                    <ul className="ai-drafting-help-list">
                      <li>• Edit text directly in the document</li>
                      <li>• Use the toolbar for formatting</li>
                      <li>• Changes in sidebar update the document</li>
                      <li>• Click Save to preserve your changes</li>
                    </ul>
                  </div>
                </div>
              )}
            </aside>

            {/* Left Sidebar Resize Handle */}
            {isLeftSidebarOpen && (
              <div
                onMouseDown={handleLeftResizeStart}
                className={`ai-drafting-resize-handle ${isLeftResizing ? 'ai-drafting-resize-handle--active' : ''}`}
                style={{ left: `${leftSidebarWidth}px` }}
                role="separator"
                aria-label="Resize left sidebar"
                aria-orientation="vertical"
              />
            )}

            {/* Document Editor Section */}
            <main className="ai-drafting-editor-section">
              {/* AI Popup Backdrop - Blur effect when AI is centered (no text selected) */}
              {isAIPopupVisible && isCentered && <div className="ai-drafting-popup-backdrop" />}
              {/* Translation Loader Overlay */}
              {isTranslating && (
                <div
                  className="ai-drafting-translation-overlay"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Loader message="Translating..." />
                </div>
              )}
              {isProjectLoading ? (
                <EditorSkeleton />
              ) : (
                <div ref={editorScrollRef} className="ai-drafting-editor-scroll">
                  <TiptapEditor
                    ref={editorRef}
                    templateData={{ ...templateData, content: templateData.content || '<p></p>' }}
                    variables={variables}
                    onContentChange={handleContentChange}
                    onEditorReady={setEditorInstance}
                    citationStyle={citationStyle}
                    textSize={textSize}
                    isAiPopupOpen={isAIPopupVisible}
                    onSlash={handleSlash}
                    onShowAIPopup={handleAi}
                    onCite={handleCite}
                    onVariableClick={handleVariableClick}
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
                onClick={() => setIsMobileLeftSidebarOpen(!isMobileLeftSidebarOpen)}
                className="ai-drafting-mobile-btn ai-drafting-mobile-btn--left"
                aria-label="Toggle variables panel"
              >
                <div className="ai-drafting-mobile-btn-icon">(x)</div>
              </button>
              <button
                onClick={() => setIsMobileRightSidebarOpen(!isMobileRightSidebarOpen)}
                className="ai-drafting-mobile-btn ai-drafting-mobile-btn--right"
                aria-label="Toggle analysis panel"
              >
                <ShieldCheck size={24} />
              </button>
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
            </main>
          </div>
        </div>

        {/* Right Sidebar Resize Handle */}
        <div
          onMouseDown={handleResizeStart}
          className={`ai-drafting-resize-handle-right ${
            isResizing ? 'ai-drafting-resize-handle-right--active' : ''
          }`}
          role="separator"
          aria-label="Resize right sidebar"
          aria-orientation="vertical"
        />

        {/* Right Sidebar - Analysis (Desktop) */}
        <aside
          className="ai-drafting-right-sidebar"
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
            analysisActionsRef={analysisActionsRef}
          />
        </aside>

        {/* Mobile Left Sidebar Modal */}
        {isMobileLeftSidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-90 lg:hidden"
              onClick={() => setIsMobileLeftSidebarOpen(false)}
            />
            <div className="fixed bottom-0 right-0 left-0 top-20 bg-white z-100 lg:hidden overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Template Fields</h2>
                <button
                  onClick={() => setIsMobileLeftSidebarOpen(false)}
                  className="text-gray-600 hover:text-gray-900 text-2xl leading-none"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {editableVariables.map((variable) => (
                    <div key={variable.name} className="flex flex-col gap-1">
                      <label
                        htmlFor={`mobile-${variable.name}`}
                        className="text-xs font-medium text-gray-600"
                      >
                        {variable.label}:
                      </label>
                      <input
                        type={getInputType(variable.type)}
                        id={`mobile-${variable.name}`}
                        value={variable.value}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        placeholder={`Enter ${variable.label.toLowerCase()}...`}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

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
          isDrafting={isDraftPromptOpen || isDraftLoading || isAILoading || isDraftPending}
        />

        {/* Discard/Save Dialog for New Projects */}
        <DiscardSaveDialog
          isOpen={isDiscardDialogOpen}
          onDiscard={handleConfirmDiscard}
          onSave={handleConfirmSave}
          onCancel={() => setIsDiscardDialogOpen(false)}
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
