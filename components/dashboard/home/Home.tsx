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
    <main className="dashboard-main" style={{ position: 'relative' }}>
      <MobileHeader />
      <motion.div
        className="dashboard-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="dashboard-content-inner">
          {/* Header Row - Welcome + Search */}
          <motion.div variants={itemVariants} className="dashboard-header">
            <div className="dashboard-welcome-container">
              <h2 className="dashboard-welcome-title">
                Welcome back, {profile?.name?.split(' ')[0] || profile?.username || 'User'}
              </h2>
              <p className="dashboard-welcome-subtitle">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                • {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>

            {/* Search Bar */}
            <div className="dashboard-search">
              <div className="dashboard-search-icon-left">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search shortcuts or projects..."
                className="dashboard-search-input"
              />
              <div className="dashboard-search-shortcut">
                <span className="dashboard-search-shortcut-label">⌘K</span>
              </div>
            </div>
          </motion.div>

          <div className="dashboard-main-grid">
            {/* Left Column: Stats + Projects */}
            <div className="dashboard-left-column">
              {/* Summary Stats Grid */}
              <motion.div variants={itemVariants} className="dashboard-stats-grid">
                {stats.map((stat, index) => (
                  <div key={index} className="dashboard-stat-card">
                    <div>
                      <h3 className="dashboard-stat-label">{stat.label}</h3>
                    </div>

                    <div className="dashboard-stat-value">
                      <CountUp to={stat.value} />
                    </div>

                    <div className="dashboard-stat-footer">
                      <div className="dashboard-footer-inner">
                        <div className="dashboard-stat-trend">
                          {stat.icon}
                          <span>{stat.trend}</span>
                        </div>

                        {!stat.isStreak && stat.subtext && (
                          <div className="dashboard-stat-subtext">{stat.subtext}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Start a New Project */}
              <motion.div variants={itemVariants} className="dashboard-new-project-section">
                <h3 className="dashboard-section-heading">START A NEW PROJECT</h3>
                <div className="dashboard-new-project-grid">
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
                        className="dashboard-new-project-card"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="dashboard-new-project-icon">
                          <Icon size={24} strokeWidth={1.5} />
                        </div>
                        <span className="dashboard-new-project-label">{config.label}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Most Recent Section */}
              <motion.div variants={itemVariants} className="dashboard-recent-section">
                <div className="dashboard-recent-header">
                  <h3 className="dashboard-section-heading">Recent Projects</h3>
                  {isLoading && !hasFetched.current && (
                    <span className="dashboard-recent-sync">Syncing...</span>
                  )}
                </div>

                {isLoading && !hasFetched.current ? (
                  renderLoadingState()
                ) : !displayProjects || displayProjects.length === 0 ? (
                  <div className="dashboard-recent-empty">
                    <div className="dashboard-recent-empty-icon">
                      <Plus size={20} />
                    </div>
                    <h3 className="dashboard-recent-empty-title">No projects yet</h3>
                    <p className="dashboard-recent-empty-text">
                      Create your first project to get started with LawVriksh.
                    </p>
                    <button
                      onClick={handleCreateFromScratch}
                      className="dashboard-recent-empty-button"
                    >
                      <Plus size={16} />
                      <span>Create Empty Project</span>
                    </button>
                  </div>
                ) : (
                  <motion.div
                    className="dashboard-projects-grid"
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
            <motion.div variants={itemVariants} className="dashboard-right-column">
              <h3 className="dashboard-section-heading">YOUR RESEARCH HUB</h3>
              <p className="dashboard-research-subtitle">Recently Active References</p>

              <div
                className="dashboard-research-container"
                style={{ minWidth: 'auto', width: '100%' }}
              >
                <AnimatePresence mode="wait">
                  {isAnalyticsLoading ? (
                    <motion.div
                      key="research-loading"
                      className="dashboard-research-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="dashboard-research-skeleton">
                        {[0, 1, 2].map((index) => (
                          <div key={`ref-skeleton-${index}`} className="dashboard-ref-skeleton-row">
                            <div className="dashboard-ref-skeleton-avatar" />
                            <div className="dashboard-ref-skeleton-lines">
                              <div className="dashboard-ref-skeleton-line-primary" />
                              <div className="dashboard-ref-skeleton-line-secondary" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : recentReferences.length === 0 ? (
                    <motion.div
                      key="research-empty"
                      className="dashboard-research-empty-state"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                    >
                      <div className="dashboard-research-empty-icon">
                        <BookOpen size={24} strokeWidth={1.5} />
                      </div>
                      <h3 className="dashboard-research-empty-title">No recent references</h3>
                      <p className="dashboard-research-empty-text">
                        Your research hub is waiting. Add references to get started.
                      </p>
                      <button
                        className="dashboard-research-empty-button"
                        onClick={() => router.push(`/dashboard/${role}/reference-manager`)}
                      >
                        <span>Create Your First Reference</span>
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="research-list"
                      className="dashboard-research-list"
                      variants={researchListVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {recentReferences.map((ref: any, index: number) => (
                        <motion.div
                          key={ref.id ?? `recent-ref-${index}`}
                          className="dashboard-reference-item"
                          variants={researchItemVariants}
                        >
                          <div className="dashboard-reference-row">
                            <div className="dashboard-reference-main">
                              <div className="dashboard-reference-icon">
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
                              <div className="dashboard-reference-title-wrapper">
                                <h4 className="dashboard-reference-title" title={ref.title}>
                                  {ref.title || 'Untitled reference'}
                                </h4>
                                {/* Tags display - Final Redesign */}
                                {ref.tags && ref.tags.length > 0 && (
                                  <div
                                    className="dashboard-reference-tags"
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

                            <span className={`dashboard-reference-badge ${ref.statusColor}`}>
                              {ref.status}
                            </span>
                          </div>
                          <p className="dashboard-reference-meta">
                            By: {ref.author} • Uploaded: {ref.uploaded}
                          </p>

                          <div className="dashboard-reference-stats">
                            <div
                              className="dashboard-reference-stat"
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
                            <div className="dashboard-reference-stat">
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
                    className="dashboard-research-footer"
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
