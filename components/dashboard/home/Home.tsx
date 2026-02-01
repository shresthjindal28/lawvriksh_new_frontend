import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'framer-motion';
import {
  Plus,
  Folder,
  TrendingUp,
  Flame,
  Scale,
  BookOpen,
  FileText,
  GraduationCap,
  Search,
  MessageSquare,
  Bookmark,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EditProjectModal from '@/components/dashboard/EditProjectModal';
import DocumentDraftingModal from './DocumentDraftingModal';
import { useDashboardAnalytics } from '@/hooks/common/useDashboardAnalytics';
// ✅ Phase 3: useReferenceContext removed - no longer needed for dashboard stats
import { WorkspaceProject } from '@/types/workspace';
import { useAuth } from '@/lib/contexts/AuthContext';
// Dashboard styles now in globals.css @layer components
import { useToast } from '@/lib/contexts/ToastContext';
import LoadingModal from '@/components/ui/LoadingModal';
import { ProjectCreationOptions } from '@/lib/config/projectConfig';
import { useDialog } from '@/hooks/common/useDialog';
import StudentDialog from '@/components/ui/StudentDialog';
import { ProjectCategory, ProjectType } from '@/types/project';
import { Privacy } from '@/types/workspace';
import ConfirmModal from '@/components/ui/ConfirmModal';
import projectService from '@/lib/api/projectService';
import { createProjectRequestSchema } from '@/lib/validators/project/project.schemas';
import { ProjectCardSkeletonGrid } from '@/components/ui/skeletons/ProjectCardSkeleton';
import { ErrorState } from '@/components/ui/errors/ErrorState';
import { getUserFriendlyError } from '@/lib/utils/error-messages';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { useQuery } from '@tanstack/react-query';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';
// ✅ Phase 2B: Import TanStack Query workspace hooks
import { useProjects, useDeleteProject, useCreateProject } from '@/lib/api/queries/workspace';
// ✅ Phase 3: Import Zustand store for UI state management
import {
  useDashboardUIStore,
  selectEditModal,
  selectDeleteModal,
  selectDraftingModal,
  selectPreviewModal,
  selectCreateModal,
  selectTagTooltip,
} from '@/store/zustand/useDashboardUIStore';

const ReferencePdfPreviewModal = dynamic(
  () => import('../../reference-manager/client/dialogs/ReferencePdfPreviewModal'),
  { ssr: false }
);

// ✅ Phase 3.1 FIX: Stable empty array references to prevent unnecessary re-renders
const EMPTY_REFERENCES: never[] = [];
const EMPTY_PROJECTS: never[] = [];

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface HomeProps {
  categories: Category[];
  role: 'student' | 'professional';
}

// Animation Component for counting numbers
const CountUp = ({ to }: { to: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
    duration: 2, // Slower duration for visual effect
  });

  useEffect(() => {
    motionValue.set(to);
  }, [motionValue, to]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest).toString();
      }
    });
    return () => unsubscribe();
  }, [springValue]);

  return <span ref={ref}>0</span>;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02, // Faster stagger for immediate visibility
      delayChildren: 0,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const researchListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const researchItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 120,
      damping: 18,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.2 },
  },
};

import { MobileHeader } from '@/components/common/MobileHeader';

export default function Home({ categories, role }: HomeProps) {
  // ✅ Phase 3: Zustand store selectors for UI state (replaces useState)
  // Each selector creates an isolated subscription - component only re-renders
  // when the specific slice it subscribes to changes
  const editModal = useDashboardUIStore(selectEditModal);
  const deleteModal = useDashboardUIStore(selectDeleteModal);
  const draftingModal = useDashboardUIStore(selectDraftingModal);
  const previewModal = useDashboardUIStore(selectPreviewModal);
  const createModal = useDashboardUIStore(selectCreateModal);
  const tagTooltip = useDashboardUIStore(selectTagTooltip);

  // ✅ Phase 3.1 FIX: Access actions via getState() to avoid full-store subscription
  // Actions are stable references and don't need reactive subscriptions
  // This prevents re-renders when unrelated state slices change
  const openEditModal = useDashboardUIStore.getState().openEditModal;
  const closeEditModal = useDashboardUIStore.getState().closeEditModal;
  const openDeleteModal = useDashboardUIStore.getState().openDeleteModal;
  const closeDeleteModal = useDashboardUIStore.getState().closeDeleteModal;
  const setDeleteLoading = useDashboardUIStore.getState().setDeleteLoading;
  const openDraftingModal = useDashboardUIStore.getState().openDraftingModal;
  const closeDraftingModal = useDashboardUIStore.getState().closeDraftingModal;
  const setDraftingGenerating = useDashboardUIStore.getState().setDraftingGenerating;
  const openPreviewModal = useDashboardUIStore.getState().openPreviewModal;
  const closePreviewModal = useDashboardUIStore.getState().closePreviewModal;
  const openCreateModal = useDashboardUIStore.getState().openCreateModal;
  const closeCreateModal = useDashboardUIStore.getState().closeCreateModal;
  const setCreateCategory = useDashboardUIStore.getState().setCreateCategory;
  const showTagTooltip = useDashboardUIStore.getState().showTagTooltip;
  const hideTagTooltip = useDashboardUIStore.getState().hideTagTooltip;

  // ✅ Phase 3: Backward compatibility aliases (preserves existing variable names)
  const isEditProjectModalOpen = editModal.isOpen;
  const editingProject = editModal.project;
  const category = createModal.category;
  const deleteModalState = deleteModal;
  const isDraftingModalOpen = draftingModal.isOpen;
  const isGeneratingDraft = draftingModal.isGenerating;
  const isPreviewOpen = previewModal.isOpen;
  const previewTitle = previewModal.title;
  const previewDocumentId = previewModal.documentId;

  const router = useRouter();
  const { addToast } = useToast();
  const { isOpen, open, close } = useDialog();
  const { profile } = useAuth();

  // Dashboard Analytics Hook
  const { data: analyticsData, isLoading: isAnalyticsLoading } = useDashboardAnalytics();
  const documentsCreatedThisMonth = analyticsData?.stats?.documentsCreatedThisMonth || 0;
  const referencesCreatedThisWeek = analyticsData?.stats?.referencesCreatedThisWeek || 0;
  // ✅ Phase 3.1 FIX: Use stable empty array reference instead of creating new [] on each render
  const recentReferences = analyticsData?.recentReferences ?? EMPTY_REFERENCES;
  const totalReferencesCount = recentReferences.length;

  // ✅ Phase 2B: Replace WorkspaceContext with TanStack Query hooks
  const {
    data: studentProjects,
    isLoading,
    error: projectsError,
    refetch: fetchStudentProjects,
  } = useProjects();

  const deleteProjectMutation = useDeleteProject();
  const createProjectMutation = useCreateProject();

  // ✅ Phase 3.1 FIX: Use stable empty array reference
  const projects = studentProjects ?? EMPTY_PROJECTS;
  const fetchProjects = fetchStudentProjects;
  const refetch = fetchStudentProjects; // ✅ Alias for compatibility
  const isRefetching = isLoading;
  const error = projectsError ? String(projectsError) : null;
  const isCreating = createProjectMutation.isPending; // ✅ From mutation state

  // ✅ Phase 2B: Wrapper for StudentDialog onSubmit compatibility
  const createProject = useCallback(
    async (data: any) => {
      await createProjectMutation.mutateAsync(data);
    },
    [createProjectMutation]
  );

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchProjects();
    }
  }, [fetchProjects]);

  // Listen for keyboard shortcut to open create dialog
  useEffect(() => {
    const handleOpenCreateDialog = () => {
      open(); // Opens the StudentDialog
    };
    window.addEventListener('open-create-dialog', handleOpenCreateDialog);
    return () => window.removeEventListener('open-create-dialog', handleOpenCreateDialog);
  }, [open]);

  const handleDeleteProject = useCallback(
    async (projectId: string) => {
      const project = studentProjects?.find((p) => p.id === projectId);
      if (project) {
        // ✅ Phase 3: Use Zustand action instead of setState
        openDeleteModal(projectId, project.title);
      }
    },
    [studentProjects, openDeleteModal]
  );

  const handleConfirmDelete = async () => {
    if (!deleteModalState.projectId) return;

    // ✅ Phase 3: Use Zustand action
    setDeleteLoading(true);
    try {
      // ✅ Phase 2B: Use TanStack Query mutation
      await deleteProjectMutation.mutateAsync({
        projectId: deleteModalState.projectId,
        permanent: false,
      });
      // ✅ Phase 3: Use Zustand action
      closeDeleteModal();
    } catch (error) {
      console.error('Failed to delete project:', error);
      // ✅ Phase 3: Use Zustand action
      setDeleteLoading(false);
    }
  };

  const handleExportProject = useCallback(async (projectId: string) => {
    alert('Export functionality will be available soon.');
  }, []);

  const handleShareProject = useCallback((projectId: string) => {
    const url = `${window.location.origin}/writing-section/${projectId}`;
    navigator.clipboard.writeText(url);
    alert('Project link copied to clipboard!');
  }, []);

  const handleEditProject = useCallback(
    (project: any) => {
      // ✅ Phase 3: Use Zustand action
      openEditModal(project);
    },
    [openEditModal]
  );

  const handleNewProject = useCallback(
    (categoryId: string) => {
      // If "ideation" (AI Legal Drafting), open the drafting modal
      if (categoryId === 'ideation') {
        // ✅ Phase 3: Use Zustand action
        openDraftingModal();
      } else {
        // For other categories, open the regular dialog
        // ✅ Phase 3: Use Zustand action
        setCreateCategory(categoryId as ProjectCategory);
        open();
      }
    },
    [open, openDraftingModal, setCreateCategory]
  );

  // Handler for AI Legal Drafting creation
  const handleDraftCreation = useCallback(
    async (data: any, projectName: string) => {
      // ✅ Phase 3: Use Zustand action
      setDraftingGenerating(true);

      try {
        // Step 1: API call is already done in Modal, we just use the data
        const draftResponse = {
          success: true,
          data: data,
          message: 'Success',
        };

        if (!draftResponse.success || !draftResponse.data) {
          throw new Error(draftResponse.message || 'Failed to generate draft');
        }

        // Step 2: Parse the template JSON from API response
        let templateJson;
        try {
          templateJson =
            typeof draftResponse.data.template_json === 'string'
              ? JSON.parse(draftResponse.data.template_json)
              : draftResponse.data.template_json;
        } catch (e) {
          console.error('Error parsing template JSON', e);
          templateJson = {};
        }

        // Step 3: Extract variables directly from templateJson
        // The variables are in templateJson.variables which is typically an array of objects
        // We need to convert this array into a map/object keyed by variable_name for the editor to work correctly
        const safeTemplateJson = templateJson || {};
        const variablesArray = safeTemplateJson.variables || [];
        const variablesMap: Record<string, any> = {};

        if (Array.isArray(variablesArray)) {
          variablesArray.forEach((v: any) => {
            if (v.variable_name) {
              variablesMap[v.variable_name] = {
                value: v.value || '',
                editable: v.editable !== false,
                type: v.type || 'text',
                label: v.label || v.variable_name,
              };
            }
          });
        }

        // Robustness: Scan content for {{variable}} patterns and add any missing variables
        // This handles cases where the API returns variables that don't match the content placeholders
        const htmlContent = draftResponse.data.html_content || '';
        const variableRegex = /{{([^}]+)}}/g;
        let match;
        const extractedVariables = new Set<string>();

        while ((match = variableRegex.exec(htmlContent)) !== null) {
          const varName = match[1].trim();
          if (varName && !variablesMap[varName] && !extractedVariables.has(varName)) {
            // Add missing variable found in text
            variablesMap[varName] = {
              value: '',
              editable: true,
              type: 'text',
              label: varName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()), // Title Case Label
            };
            extractedVariables.add(varName);
            console.log(`[Auto-Extract] Added missing variable from content: ${varName}`);
          }
        }

        // Step 4: Create project with content containing everything needed
        const requestData = {
          title: projectName,
          category: 'draft' as const,
          access_type: Privacy.PRIVATE,
          content: {
            data: {
              blocks: [
                {
                  id: 'draft-content',
                  type: 'paragraph',
                  data: {
                    text: draftResponse.data.html_content, // Save HTML content in blocks
                  },
                },
              ],
              variables: variablesMap, // Store variables as a map
              time: Date.now(),
              version: '2.0',
            },
          },
          metadata: {
            data: {
              data: {
                type: ProjectType.TEMPLATE,
                aiGenerated: true,
                prompt: 'AI Generated Draft',
                docMetadata: draftResponse.data.doc_metadata,
                generationMetrics: draftResponse.data.pipeline_metrics,
                citations: {},
              },
            },
          },
        };

        const validatedData = createProjectRequestSchema.safeParse(requestData);
        if (!validatedData.success) {
          throw new Error(validatedData.error.message);
        }

        const projectResponse = await projectService.createProject(validatedData.data);

        if (!projectResponse.success || !projectResponse.data?.workspace) {
          throw new Error(projectResponse.message || 'Failed to create project');
        }

        const projectId = projectResponse.data.workspace.id;

        if (!projectId) {
          throw new Error('Project ID not returned from server');
        }

        // Close modals and redirect
        // ✅ Phase 3: Use Zustand action
        closeDraftingModal();
        addToast('AI Draft created successfully!', 'success');
        router.push(
          `/AIDrafting/writing-section/${projectId}?title=${encodeURIComponent(projectName)}&new=true`
        );
      } catch (error) {
        console.error('Draft creation error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to create draft';
        addToast(errorMessage, 'error');
      } finally {
        // ✅ Phase 3: Use Zustand action
        setDraftingGenerating(false);
      }
    },
    [addToast, router, closeDraftingModal, setDraftingGenerating]
  );

  // Handler for "Create from scratch" - just open the default StudentDialog
  const handleCreateFromScratch = useCallback(() => {
    // ✅ Phase 3: Use Zustand action
    closeDraftingModal();
    open();
  }, [open, closeDraftingModal]);

  // --- Stats Calculation ---
  const categoryConfig: Record<string, { label: string; icon: any }> = {
    ideation: { label: 'Legal Drafting', icon: Scale },
    research_paper: { label: 'Research Paper', icon: BookOpen },
    article: { label: 'Article', icon: FileText },
    assignment: { label: 'College Assignment', icon: GraduationCap },
  };

  // ✅ Phase 3: Removed unused useReferenceContext() - now using recentReferences from analytics API

  // Helper for time ago - moved up before useMemo hooks
  const getTimeAgo = useCallback((dateStr: string) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay}d ago`;
  }, []);

  // ✅ Phase 3: OPTIMIZED O(1) document stats - uses API value directly
  const docStats = useMemo(() => {
    // Use API-provided value directly (O(1) - no iteration needed)
    const displayValue = documentsCreatedThisMonth;

    // For trend, we don't have last month data from API currently
    // So we show a simple message (future: add last_month_count to API)
    const trend = displayValue > 0 ? 'Keep up the momentum!' : 'Start creating today';

    // For subtext, use the first project from the already-sorted list (O(1))
    let subtext = 'No documents yet';
    if (projects.length > 0) {
      const mostRecentDoc = projects[0]; // Projects are sorted by updated_at desc from API
      const maxLen = 12;
      const title = mostRecentDoc.title || 'Untitled';
      const truncatedTitle = title.length > maxLen ? title.substring(0, maxLen) + '...' : title;
      const timeAgo = getTimeAgo(
        mostRecentDoc.created_at || mostRecentDoc.updated_at || new Date().toISOString()
      );
      subtext = `${truncatedTitle} • ${timeAgo}`;
    }

    return { value: displayValue, trend, subtext };
  }, [documentsCreatedThisMonth, projects, getTimeAgo]);

  // ✅ Phase 3: OPTIMIZED O(1) reference stats - uses API value directly
  const refStats = useMemo(() => {
    // Use API-provided value directly (O(1) - no iteration needed)
    const displayValue = referencesCreatedThisWeek;

    // For trend, we don't have last week data from API currently
    const trend = displayValue > 0 ? 'Great research progress!' : 'Add your first reference';

    // For subtext, use the first recent reference from API (O(1))
    let subtext = 'No references yet';
    if (recentReferences.length > 0) {
      const latestRef = recentReferences[0];
      const maxLen = 12;
      const title = latestRef.title || 'Untitled';
      const truncatedTitle = title.length > maxLen ? title.substring(0, maxLen) + '...' : title;
      // ✅ Phase 3: Use 'uploaded' which is already formatted by the analytics hook
      const timeStr = latestRef.uploaded || 'Recently added';
      subtext = `${truncatedTitle} • ${timeStr}`;
    }

    return { value: displayValue, trend, subtext };
  }, [referencesCreatedThisWeek, recentReferences]);

  const stats = [
    {
      label: 'DOCUMENTS\nCREATED THIS MONTH',
      value: docStats.value,
      trend: docStats.trend,
      subtext: docStats.subtext,
      icon: <TrendingUp size={14} className="dashboard-stat-icon-positive" />,
      isStreak: false,
    },
    {
      label: 'REFERENCES\nCOLLECTED THIS WEEK',
      value: refStats.value,
      trend: refStats.trend,
      subtext: refStats.subtext,
      icon: <TrendingUp size={14} className="dashboard-stat-icon-positive" />,
      isStreak: false,
    },
    {
      label: 'WRITING STREAK',
      value: 1,
      trend: 'Keep it going!',
      icon: <Flame size={14} className="dashboard-stat-icon-streak" />,
      isStreak: true,
    },
  ];

  const displayProjects = projects;

  const isMissingWorkspacesError =
    error?.includes('expected array, received undefined') ||
    error?.includes('workspaces') ||
    error?.includes('Invalid input');

  // Render loading structure instead of simple loader for better UX
  const renderLoadingState = () => <ProjectCardSkeletonGrid count={6} />;

  // ✅ Phase 3: Tag tooltip handlers now use Zustand store
  const handleTagMouseEnter = (e: React.MouseEvent, tags: any[]) => {
    const rect = e.currentTarget.getBoundingClientRect();
    showTagTooltip(rect.left + rect.width / 2, rect.bottom + 8, tags);
  };

  const handleTagMouseLeave = () => {
    hideTagTooltip();
  };

  const handleViewFile = async (reference: any) => {
    // Check if reference has a document attached (s3_key, file_url, or web_url)
    // Or if it has annotations/notes, we assume there's something to view
    const hasDocument = reference.s3_key || reference.file_url || reference.web_url;

    if (!hasDocument && reference.annotations === 0 && reference.notes === 0) {
      return;
    }

    const documentId = reference.documentId || reference.id;

    // ✅ Phase 3: Use Zustand action (openPreviewModal sets all state)
    openPreviewModal(documentId || '', reference.title || 'Preview');
  };

  const previewQuery = useQuery({
    queryKey: previewDocumentId ? referenceKeys.preview(previewDocumentId) : referenceKeys.all,
    enabled: Boolean(previewDocumentId) && isPreviewOpen,
    queryFn: async () => {
      if (!previewDocumentId) return null as string | null;
      const response = await referenceManagerService.previewDocument(previewDocumentId);
      const url = (response as any)?.data?.preview_url;
      return typeof url === 'string' && url.length > 0
        ? `/proxy-pdf?url=${encodeURIComponent(url)}`
        : null;
    },
    staleTime: 1000 * 60 * 10,
  });

  const previewUrl = previewQuery.data ?? null;
  const isPreviewLoading = previewQuery.isLoading;
  const previewError =
    previewDocumentId && !isPreviewLoading && (previewQuery.isError || previewQuery.isSuccess)
      ? previewUrl
        ? null
        : 'Failed to fetch preview URL'
      : null;

  if (error) {
    const { message, type, canRetry } = getUserFriendlyError(error);
    return (
      <div className="dashboard-home-container">
        <MobileHeader />
        <ErrorState
          type={type}
          message={message}
          onRetry={canRetry ? refetch : undefined}
          isRetrying={isRefetching}
          className="dashboard-error-state"
        />
      </div>
    );
  }

  return (
    <main
      className="flex-1 overflow-y-auto overflow-x-hidden w-full relative bg-[#fafafa]"
      style={{
        backgroundImage: "url('/assets/images/dashboard/LawVriksh%201.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'auto 100vh',
        backgroundAttachment: 'fixed',
      }}
    >
      <MobileHeader />
      <motion.div
        className="flex w-full max-w-[1920px] min-h-auto justify-center items-start gap-dashboard-lg bg-transparent mx-auto py-10 px-[60px] max-xl:py-10 max-xl:px-10 max-xl:gap-10 max-lg:py-6 max-lg:px-6 max-lg:gap-6 max-md:py-5 max-md:px-4 max-md:gap-8 max-md:flex-col max-md:items-stretch"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex w-full max-w-[1790px] flex-col justify-start items-center gap-12 shrink-0">
          {/* Header Row - Welcome + Search */}
          <motion.div
            variants={itemVariants}
            className="flex justify-between items-start self-stretch max-md:flex-col max-md:gap-5 max-md:items-stretch"
          >
            <div className="flex w-[292.288px] flex-col items-start gap-1 max-md:w-full">
              <h2
                className="text-[#133435] text-4xl font-normal leading-[45px] m-0 font-serif max-md:text-[28px] max-md:leading-normal"
                style={{ fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif" }}
              >
                Welcome back, {profile?.name?.split(' ')[0] || profile?.username || 'User'}
              </h2>
              <p
                className="text-[#627c7d] text-sm font-normal leading-[21px]"
                style={{ fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif" }}
              >
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                • {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-[494px] max-lg:w-[350px] max-md:w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search shortcuts or projects..."
                className="flex w-full h-10 py-2.5 px-3 items-center rounded-[10px] border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-900 transition-all duration-200 focus:outline-none focus:border-gray-400 focus:shadow-[0_0_0_1px_#e5e7eb] max-md:h-9 max-md:text-[0.8125rem]"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-xs text-gray-400 bg-gray-50 py-0.5 px-1.5 rounded-full border border-gray-200">
                  ⌘K
                </span>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-wrap items-start gap-8 w-full">
            {/* Left Column: Stats + Projects */}
            <div className="flex flex-col gap-12 w-full xl:flex-1 xl:min-w-[600px]">
              {/* Summary Stats Grid */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 self-stretch w-full"
              >
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex min-h-dashboard-project-card w-full p-5 flex-col justify-between gap-4 rounded-[14px] border border-dashboard-border-lighter bg-white shadow-[0_2px_8px_rgba(19,52,53,0.04)] box-border hover:shadow-[0_4px_12px_rgba(19,52,53,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out"
                  >
                    <div>
                      <h3
                        className="text-[#133435] text-dashboard-section-heading font-semibold leading-[19.5px] tracking-[1.04px] uppercase wrap-break-word"
                        style={{
                          fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif",
                        }}
                      >
                        {stat.label}
                      </h3>
                    </div>

                    <div
                      className="self-stretch text-[#133435] text-right text-dashboard-stat-value font-normal leading-[26px] max-md:text-[40px]"
                      style={{
                        fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif",
                      }}
                    >
                      <CountUp to={stat.value} />
                    </div>

                    <div className="flex pt-3 mt-auto items-center self-stretch border-t border-dashboard-border-light">
                      <div className="flex justify-between items-center w-full min-w-0 gap-3">
                        <div className="flex items-center gap-1 shrink-0 [&>span]:text-[#627c7d] [&>span]:text-xs [&>span]:font-normal">
                          {stat.icon}
                          <span>{stat.trend}</span>
                        </div>

                        {!stat.isStreak && stat.subtext && (
                          <div
                            className="text-dashboard-text-muted text-dashboard-xs italic font-normal whitespace-nowrap overflow-hidden text-ellipsis min-w-0 text-right flex-1"
                            title={stat.subtext}
                          >
                            {stat.subtext}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Start a New Project */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-start gap-5 self-stretch"
              >
                <h3
                  className="text-[#133435] text-dashboard-section-heading font-semibold leading-[19.5px] tracking-[1.04px] uppercase"
                  style={{
                    fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif",
                  }}
                >
                  START A NEW PROJECT
                </h3>
                <div className="grid grid-cols-4 gap-dashboard-xs self-stretch w-full max-lg:grid-cols-2 max-md:flex max-md:flex-col max-md:gap-4">
                  {ProjectCreationOptions.map((option) => {
                    const config = categoryConfig[option.id] || {
                      label: option.name,
                      icon: Folder,
                    };
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={option.id}
                        onClick={() => handleNewProject(option.id)}
                        className="flex h-dashboard-project-card w-full flex-col justify-center items-center gap-3 rounded-[14px] border border-dashboard-border-light bg-[#fcfcf9] cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-[0_4px_12px_rgba(19,52,53,0.08)] hover:-translate-y-1 hover:border-[rgba(19,52,53,0.15)] max-sm:h-[200px] max-sm:flex-none"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex w-12 h-12 pt-3 px-3 flex-col items-start shrink-0 rounded-full bg-white">
                          <Icon size={24} strokeWidth={1.5} />
                        </div>
                        <span
                          className="text-sm font-medium text-[#133435] pb-0.5 border-b border-gray-400 transition-colors duration-150 group-hover:border-[#1a2e29]"
                          style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
                        >
                          {config.label}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Most Recent Section */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col items-start gap-[21px] self-stretch"
              >
                <div className="flex justify-between items-center w-full">
                  <h3
                    className="text-[#133435] text-dashboard-section-heading font-semibold leading-[19.5px] tracking-[1.04px] uppercase"
                    style={{
                      fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif",
                    }}
                  >
                    Recent Projects
                  </h3>
                  {isLoading && !hasFetched.current && (
                    <span className="text-xs text-gray-400 animate-pulse">Syncing...</span>
                  )}
                </div>

                {isLoading && !hasFetched.current ? (
                  renderLoadingState()
                ) : !displayProjects || displayProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-6 rounded-[14px] border border-dashed border-[rgba(19,52,53,0.15)] bg-[rgba(19,52,53,0.02)] w-full">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Plus size={20} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">No projects yet</h3>
                    <p className="text-sm text-gray-500 max-w-[280px] text-center mb-6">
                      Create your first project to get started with LawVriksh.
                    </p>
                    <button
                      onClick={handleCreateFromScratch}
                      className="inline-flex items-center gap-2 py-2 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm transition-all duration-150 hover:bg-gray-50 hover:border-gray-300 hover:shadow-md"
                    >
                      <Plus size={16} />
                      <span>Create Empty Project</span>
                    </button>
                  </div>
                ) : (
                  <motion.div
                    className="grid grid-cols-3 gap-5 self-stretch w-full max-lg:grid-cols-2 max-md:grid-cols-1 max-md:gap-4 max-sm:gap-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {displayProjects.map((project: any) => (
                      <motion.div key={project.id} variants={itemVariants}>
                        <ProjectCard
                          project={project}
                          onDelete={handleDeleteProject}
                          onEdit={handleEditProject}
                          onExport={handleExportProject}
                          onShare={handleShareProject}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Right Column: Research Hub */}
            <motion.div
              variants={itemVariants}
              className="flex h-auto flex-col items-start gap-2 relative top-0 w-full xl:w-[367px] xl:shrink-0 xl:sticky xl:top-6 xl:self-start xl:h-[calc(100vh-120px)] xl:max-h-[800px]"
            >
              <h3
                className="text-[#133435] text-dashboard-section-heading font-semibold leading-[19.5px] tracking-[1.04px] uppercase"
                style={{ fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif" }}
              >
                YOUR RESEARCH HUB
              </h3>
              <p
                className="text-[#627c7d] text-xs font-normal leading-[18px]"
                style={{ fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif" }}
              >
                Recently Active References
              </p>

              <div
                className="flex h-[589.6px] min-w-[367px] pt-6 px-6 pb-0 flex-col justify-start items-stretch gap-0 shrink-0 self-stretch rounded-2xl border border-dashboard-border-lighter bg-white shadow-sm max-md:min-w-0 max-md:w-full max-md:h-auto max-md:min-h-[400px] max-md:p-4"
                style={{ minWidth: 'auto', width: '100%' }}
              >
                <AnimatePresence mode="wait">
                  {isAnalyticsLoading ? (
                    <motion.div
                      key="research-loading"
                      className="flex flex-col items-start self-stretch flex-1 overflow-y-auto"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="w-full">
                        {[0, 1, 2].map((index) => (
                          <div
                            key={`ref-skeleton-${index}`}
                            className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
                          >
                            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                            <div className="flex-1 flex flex-col gap-2">
                              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                              <div className="h-2 w-1/2 bg-gray-100 rounded animate-pulse" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : recentReferences.length === 0 ? (
                    <motion.div
                      key="research-empty"
                      className="flex flex-col items-center justify-center py-12 px-6 flex-1 w-full text-center"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
                        <BookOpen size={24} strokeWidth={1.5} />
                      </div>
                      <h3
                        className="text-sm font-semibold text-gray-900 mb-1"
                        style={{
                          fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif",
                        }}
                      >
                        No recent references
                      </h3>
                      <p
                        className="text-sm text-gray-500 max-w-[240px] mb-6 leading-relaxed"
                        style={{
                          fontFamily: "var(--font-instrument-sans), 'Instrument Sans', sans-serif",
                        }}
                      >
                        Your research hub is waiting. Add references to get started.
                      </p>
                      <button
                        className="inline-flex items-center justify-center py-2 px-4 rounded-lg bg-[#133435] text-white text-sm font-medium border-none cursor-pointer transition-all duration-200 hover:bg-[#0d2526] hover:-translate-y-px hover:shadow-lg"
                        onClick={() => router.push(`/dashboard/${role}/reference-manager`)}
                      >
                        <span>Create Your First Reference</span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="research-list"
                      className="flex flex-col items-start self-stretch flex-1 overflow-y-auto"
                      variants={researchListVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {recentReferences.map((ref: any, index: number) => (
                        <motion.div
                          key={ref.id ?? `recent-ref-${index}`}
                          className="flex h-dashboard-reference-item min-w-[303px] py-4 px-2 flex-col justify-between items-start self-stretch rounded-[10px] border-b border-dashboard-border-lighter cursor-pointer transition-all duration-150 hover:bg-gray-50 hover:shadow-[inset_2px_0_0_rgba(37,99,235,0.2)] hover:-translate-y-px max-md:min-w-0 max-md:w-full max-md:h-auto max-md:py-3 max-md:px-2 group"
                          variants={researchItemVariants}
                        >
                          <div className="flex justify-between items-start w-full mb-1">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="mt-0.5 text-gray-400 transition-colors duration-150 shrink-0 group-hover:text-gray-500">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                >
                                  <path
                                    d="M5.00065 18.3337C4.55862 18.3337 4.1347 18.1581 3.82214 17.8455C3.50958 17.5329 3.33398 17.109 3.33398 16.667V3.33366C3.33398 2.89163 3.50958 2.46771 3.82214 2.15515C4.1347 1.84259 4.55862 1.66699 5.00065 1.66699H11.6673C11.9311 1.66657 12.1924 1.71833 12.4361 1.8193C12.6798 1.92027 12.9011 2.06846 13.0873 2.25533L16.0773 5.24533C16.2647 5.43158 16.4133 5.65312 16.5146 5.89713C16.6158 6.14114 16.6677 6.4028 16.6673 6.66699V16.667C16.6673 17.109 16.4917 17.5329 16.1792 17.8455C15.8666 18.1581 15.4427 18.3337 15.0007 18.3337H5.00065Z"
                                    stroke="#133435"
                                    strokeWidth="1.25"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M11.666 1.66699V5.83366C11.666 6.05467 11.7538 6.26663 11.9101 6.42291C12.0664 6.57919 12.2783 6.66699 12.4993 6.66699H16.666"
                                    stroke="#133435"
                                    strokeWidth="1.25"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M8.33268 7.5H6.66602"
                                    stroke="#133435"
                                    strokeWidth="1.25"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M13.3327 10.833H6.66602"
                                    stroke="#133435"
                                    strokeWidth="1.25"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M13.3327 14.167H6.66602"
                                    stroke="#133435"
                                    strokeWidth="1.25"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <h4
                                  className="text-[#133435] text-sm font-semibold leading-[21px] transition-colors duration-150 overflow-hidden text-ellipsis whitespace-nowrap group-hover:text-blue-600"
                                  title={ref.title}
                                  style={{
                                    fontFamily:
                                      "var(--font-instrument-sans), 'Instrument Sans', sans-serif",
                                  }}
                                >
                                  {ref.title || 'Untitled reference'}
                                </h4>
                                {/* Tags display - Final Redesign */}
                                {ref.tags && ref.tags.length > 0 && (
                                  <div
                                    className="flex items-center gap-2 mt-2 min-h-[24px]"
                                    style={{ marginTop: '0px', flexShrink: 0 }}
                                  >
                                    <div
                                      className="relative group mt-1"
                                      style={{ position: 'relative', display: 'inline-block' }}
                                      onMouseEnter={(e) => handleTagMouseEnter(e, ref.tags)}
                                      onMouseLeave={handleTagMouseLeave}
                                    >
                                      {/* Trigger */}
                                      <div
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'center',
                                          cursor: 'pointer',
                                          gap: '2px',
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: 'flex',
                                            gap: '2px',
                                            alignItems: 'center',
                                          }}
                                        >
                                          <div
                                            style={{
                                              width: '14px',
                                              height: '14px',
                                              borderRadius: '50%',
                                              backgroundColor: ref.tags[0].color || '#eee',
                                            }}
                                          />
                                          {ref.tags.length > 1 && (
                                            <div
                                              style={{
                                                width: '14px',
                                                height: '14px',
                                                borderRadius: '50%',
                                                backgroundColor: '#f3f4f6',
                                                border: '1px solid #e5e7eb',
                                                color: '#6b7280',
                                                fontSize: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 600,
                                              }}
                                            >
                                              +{ref.tags.length - 1}
                                            </div>
                                          )}
                                        </div>
                                        <span
                                          style={{ fontSize: '9px', color: '#666', lineHeight: 1 }}
                                        >
                                          Tag
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ref.statusColor}`}
                            >
                              {ref.status}
                            </span>
                          </div>
                          <p
                            className="mt-0.5 text-[#627c7d] text-xs font-normal leading-[18px]"
                            style={{
                              fontFamily:
                                "var(--font-instrument-sans), 'Instrument Sans', sans-serif",
                            }}
                          >
                            By: {ref.author} • Uploaded: {ref.uploaded}
                          </p>

                          <div
                            className="flex items-center gap-3 mt-2 text-[#627c7d] text-dashboard-xs font-normal leading-[16.5px]"
                            style={{
                              fontFamily:
                                "var(--font-instrument-sans), 'Instrument Sans', sans-serif",
                            }}
                          >
                            <div
                              className="flex items-center gap-1"
                              style={{
                                cursor:
                                  ref.s3_key || ref.file_url || ref.web_url ? 'pointer' : 'default',
                              }}
                              onClick={(e) => {
                                if (ref.s3_key || ref.file_url || ref.web_url) {
                                  e.stopPropagation();
                                  handleViewFile(ref);
                                }
                              }}
                              title={
                                ref.s3_key || ref.file_url || ref.web_url
                                  ? 'Click to view document and annotations'
                                  : 'No document attached'
                              }
                            >
                              <MessageSquare size={12} />
                              <span>
                                {ref.annotations}{' '}
                                {ref.annotations === 1 ? 'annotation' : 'annotations'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bookmark size={12} />
                              <span>
                                {ref.notes} {ref.notes === 1 ? 'note' : 'notes'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {recentReferences.length > 0 && (
                  <button
                    className="flex w-full h-12 py-3 px-5 justify-center items-center shrink-0 mt-auto border-t border-dashboard-border-light bg-transparent cursor-pointer transition-all duration-150 text-black text-center text-xs font-normal leading-[19.5px] hover:text-gray-900 hover:tracking-wider"
                    onClick={() => router.push(`/dashboard/${role}/reference-manager`)}
                  >
                    View all references ({totalReferencesCount > 0 ? totalReferencesCount : '0'}) →
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* New Project Modal */}
      <StudentDialog
        isOpen={isOpen}
        onClose={close}
        onSubmit={createProject}
        isLoading={isCreating}
        category={category as ProjectCategory}
        dialogKey="home"
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => {
          // ✅ Phase 3: Use Zustand action
          closeEditModal();
        }}
        project={editingProject}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => {
          // ✅ Phase 3: Use Zustand action
          closeDeleteModal();
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteModalState.projectTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteModalState.isLoading}
      />

      {/* Document Drafting Modal - for AI Legal Drafting */}
      <DocumentDraftingModal
        isOpen={isDraftingModalOpen}
        onClose={() => {
          // ✅ Phase 3: Use Zustand action
          closeDraftingModal();
        }}
        onDraftSuccess={handleDraftCreation}
        onCreateFromScratch={handleCreateFromScratch}
        onUpload={() => {
          /* Add upload logic here */
        }}
        isLoading={isGeneratingDraft}
      />

      {/* Tag Tooltip Portal - Fixed Position to avoid clipping */}
      <AnimatePresence>
        {tagTooltip && tagTooltip.visible && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              left: tagTooltip.x, // Centered horizontally
              top: tagTooltip.y,
              transform: 'translateX(-50%)', // Clean center alignment
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '10px 12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #f0f0f0',
              zIndex: 9999, // Ensure it's on top of everything
              minWidth: '140px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              pointerEvents: 'none', // Prevent interference
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#133435',
                borderBottom: '1px solid #f0f0f0',
                paddingBottom: '4px',
              }}
            >
              Tags
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tagTooltip.tags.map((tag: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: tag.color || '#eee',
                      flexShrink: 0,
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                    {tag.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Modal for AI Draft Generation */}
      <LoadingModal isOpen={isGeneratingDraft} message="Generating your legal document..." />

      {/* Reference Preview Modal */}
      <ReferencePdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          // ✅ Phase 3: Use Zustand action
          closePreviewModal();
        }}
        title={previewTitle}
        url={previewUrl}
        isLoading={isPreviewLoading}
        error={previewError}
      />
    </main>
  );
}
