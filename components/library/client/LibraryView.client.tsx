'use client';

import { FolderX, Plus, Search, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { filterButtons, type FilterType } from '@/lib/constants/library';
import ProjectCard from '@/components/dashboard/ProjectCard';
import StudentDialog from '@/components/ui/StudentDialog';
import { ProjectCategory } from '@/types/project';
import { SkeletonLoader } from '@/components/ui/Loader';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { MobileHeader } from '@/components/common/MobileHeader';
import { useCreateProject, useDeleteProject, useProjects } from '@/lib/api/queries/workspace';
import { useToast } from '@/lib/contexts/ToastContext';
import { useLibraryUIStore } from '@/store/zustand/library/useLibraryUIStore';

const MemoizedProjectCard = memo(ProjectCard);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 50,
      damping: 15,
    },
  },
};

function normalizeProject(project: any) {
  if (project?.metadata?.data?.data) {
    return {
      ...project,
      metadata: {
        ...project.metadata,
        data: project.metadata.data.data,
      },
    };
  }
  return project;
}

function useLibraryGridColumns() {
  const [columns, setColumns] = useState(() => {
    if (typeof window === 'undefined') return 3;
    return window.innerWidth <= 1024 ? 2 : 3;
  });

  useEffect(() => {
    const handleResize = () => {
      setColumns(window.innerWidth <= 1024 ? 2 : 3);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return columns;
}

function useLibraryGridGap() {
  const [gap, setGap] = useState(() => {
    if (typeof window === 'undefined') return 20;
    return window.innerWidth <= 480 ? 12 : 20;
  });

  useEffect(() => {
    const handleResize = () => {
      setGap(window.innerWidth <= 480 ? 12 : 20);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return gap;
}

function VirtualizedProjectsGrid({
  projects,
  onDelete,
  onEdit,
}: {
  projects: any[];
  onDelete: (projectId: string) => void;
  onEdit: (project: any) => void;
}) {
  const columns = useLibraryGridColumns();
  const gap = useLibraryGridGap();

  const rowCount = Math.ceil(projects.length / columns);

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => 260 + gap,
    overscan: 3,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowProjects = projects.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: `${gap}px`,
                boxSizing: 'border-box',
              }}
            >
              <div
                className="grid grid-cols-3 gap-5 w-full lg:grid-cols-2 md:gap-3 sm:grid-cols-2 sm:gap-3"
                style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: `${gap}px`,
                }}
              >
                {rowProjects.map((project) => (
                  <motion.div key={project.id} variants={itemVariants} layout>
                    <MemoizedProjectCard
                      project={project}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      variants={itemVariants}
                      isLibraryView
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const VIRTUALIZATION_THRESHOLD = 18;

export default function LibraryView() {
  const router = useRouter();
  const { addToast } = useToast();

  const filterType = useLibraryUIStore((s) => s.filterType);
  const searchQuery = useLibraryUIStore((s) => s.searchQuery);
  const category = useLibraryUIStore((s) => s.category);
  const isCreateDialogOpen = useLibraryUIStore((s) => s.isCreateDialogOpen);
  const deleteModal = useLibraryUIStore((s) => s.deleteModal);

  const setFilterType = useLibraryUIStore((s) => s.setFilterType);
  const setSearchQuery = useLibraryUIStore((s) => s.setSearchQuery);
  const clearSearch = useLibraryUIStore((s) => s.clearSearch);
  const setCategory = useLibraryUIStore((s) => s.setCategory);
  const openCreateDialog = useLibraryUIStore((s) => s.openCreateDialog);
  const closeCreateDialog = useLibraryUIStore((s) => s.closeCreateDialog);
  const openDeleteModal = useLibraryUIStore((s) => s.openDeleteModal);
  const closeDeleteModal = useLibraryUIStore((s) => s.closeDeleteModal);
  const resetDeleteModal = useLibraryUIStore((s) => s.resetDeleteModal);
  const setDeleteModalLoading = useLibraryUIStore((s) => s.setDeleteModalLoading);

  const projectsQuery = useProjects({ page: 1, limit: 100, enabled: true });
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();

  const projects = useMemo(
    () => (projectsQuery.data ? projectsQuery.data.map(normalizeProject) : []),
    [projectsQuery.data]
  );

  const handleCreateProject = useCallback(
    async (data: any) => {
      await createProjectMutation.mutateAsync(data);
    },
    [createProjectMutation]
  );

  const handleFilterChange = useCallback(
    (filter: FilterType) => {
      setFilterType(filter);
    },
    [setFilterType]
  );

  const handleDeleteClick = useCallback(
    (projectId: string) => {
      openDeleteModal(projectId);
    },
    [openDeleteModal]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.projectId) return;

    setDeleteModalLoading(true);
    try {
      await deleteProjectMutation.mutateAsync({ projectId: deleteModal.projectId });
      addToast('Project Moved to Trash', 'success');
      resetDeleteModal();
    } catch {
      addToast('Unable to delete the Project', 'error');
      setDeleteModalLoading(false);
    }
  }, [
    addToast,
    deleteModal.projectId,
    deleteProjectMutation,
    resetDeleteModal,
    setDeleteModalLoading,
  ]);

  const handleEditProject = useCallback(
    (project: any) => {
      const projectCategory = project.category?.toLowerCase() || '';
      if (projectCategory === 'draft') {
        router.push(`/AIDrafting/writing-section/${project.id}`);
      } else {
        router.push(`/writing-section/${project.id}`);
      }
    },
    [router]
  );

  const filteredAndSortedItems = useMemo(() => {
    let items: any[] = [];

    if (filterType === 'recent') {
      items = [...projects].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } else {
      items = projects.filter(
        (project) => project.category?.toLowerCase() === filterType.toLowerCase()
      );
    }

    return items;
  }, [projects, filterType]);

  const renderLoadingState = () => (
    <div className="grid grid-cols-3 gap-5 w-full lg:grid-cols-2 md:gap-3 sm:grid-cols-2 sm:gap-3">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="bg-white rounded-[14px] p-6 border border-gray-100 shadow-sm flex flex-col gap-4"
        >
          <SkeletonLoader height="140px" style={{ marginBottom: '16px' }} />
          <SkeletonLoader height="20px" width="70%" style={{ marginBottom: '8px' }} />
          <SkeletonLoader height="16px" width="40%" />
        </div>
      ))}
    </div>
  );

  const shouldVirtualize = filteredAndSortedItems.length > VIRTUALIZATION_THRESHOLD;

  return (
    <main className="min-h-screen w-full bg-[#fafafa] bg-[url('/assets/images/dashboard/LawVriksh%201.png')] bg-no-repeat bg-center bg-[length:auto_100vh] bg-fixed">
      <MobileHeader />
      <div className="m-0 flex min-h-screen max-w-full">
        <section className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 lg:px-[60px]">
            <StudentDialog
              isOpen={isCreateDialogOpen}
              onClose={closeCreateDialog}
              onSubmit={handleCreateProject}
              isLoading={createProjectMutation.isPending}
              category={category}
            />
            <div className="max-w-[1400px] mx-auto w-full">
              <motion.div
                className="flex justify-between items-center mb-6 flex-wrap gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative w-full max-w-[400px] sm:max-w-full sm:order-3 sm:mt-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 text-gray-400">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="flex w-full h-10 py-[9.889px] px-[11.889px] items-center rounded-[10px] border border-[#e5e5e5] bg-white/90 backdrop-blur-sm pl-10 pr-10 text-sm text-gray-900 transition-all focus:outline-none focus:border-gray-400 focus:shadow-[0_0_0_1px_#e5e7eb] focus:bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 bg-transparent border-none hover:text-gray-600"
                      onClick={clearSearch}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto p-1 scrollbar-hide bg-white/50 backdrop-blur-[4px] rounded-full border border-black/5 sm:w-full sm:justify-start sm:pb-2">
                  {filterButtons.map((filter) => {
                    const isActive = filterType === filter.type;
                    return (
                      <button
                        key={filter.type}
                        className={`relative px-4 py-2 rounded-full bg-transparent border-none cursor-pointer whitespace-nowrap transition-all outline-none flex items-center justify-center hover:text-gray-900 ${isActive ? 'active' : ''}`}
                        onClick={() => handleFilterChange(filter.type)}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeFilter"
                            className="active-pill-bg"
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: '#133435',
                              borderRadius: '9999px',
                              zIndex: 0,
                              boxShadow: '0 2px 8px rgba(19, 52, 53, 0.2)',
                            }}
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span
                          className={`relative z-10 text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`}
                        >
                          {filter.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
              {projectsQuery.isLoading && projects.length === 0 ? (
                renderLoadingState()
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <AnimatePresence mode="popLayout">
                    {filteredAndSortedItems?.length === 0 ? (
                      <motion.div
                        className="flex flex-col items-center justify-center min-h-[400px] p-[60px_24px] bg-white/60 backdrop-blur-md rounded-3xl border border-dashed border-gray-200 mt-6 text-center col-span-full transition-all hover:bg-white/80 hover:border-gray-300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="mb-6 text-gray-400 w-20 h-20 p-0 flex items-center justify-center bg-gray-100 rounded-full shadow-sm text-[#9ca3af]">
                          <FolderX size={40} strokeWidth={1.5} />
                        </div>
                        <h2 className="font-[family-name:var(--font-playfair),serif] text-2xl font-semibold text-[#111827] m-[0_0_12px_0] tracking-[-0.02em]">
                          {filterType === 'recent'
                            ? 'No Projects Found'
                            : `No ${filterButtons.find((f) => f.type === filterType)?.label}s Found`}
                        </h2>
                        <p className="text-gray-500 text-base leading-[1.6] max-w-[420px] mx-auto">
                          {filterType === 'recent'
                            ? 'Start creating your first project to populate your library.'
                            : `You don't have any ${filterButtons.find((f) => f.type === filterType)?.label?.toLowerCase()}s yet. Create one to get started.`}
                        </p>
                        <button
                          className="inline-flex items-center gap-2 mt-8 px-7 py-3 bg-[#1a1a1a] text-white border-none rounded-xl text-[15px] font-medium cursor-pointer transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] active:translate-y-0 active:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                          onClick={() => {
                            const isRecentOrDraft =
                              filterType === 'recent' || filterType === 'draft';
                            const categoryToSet = isRecentOrDraft
                              ? ('ideation' as ProjectCategory)
                              : (filterType as ProjectCategory);
                            setCategory(categoryToSet);
                            openCreateDialog();
                          }}
                        >
                          <Plus size={20} strokeWidth={2.5} />
                          <span>
                            {filterType === 'recent' || filterType === 'draft'
                              ? 'Start Writing'
                              : `Create ${filterButtons.find((f) => f.type === filterType)?.label}`}
                          </span>
                        </button>
                      </motion.div>
                    ) : shouldVirtualize ? (
                      <VirtualizedProjectsGrid
                        projects={filteredAndSortedItems}
                        onDelete={handleDeleteClick}
                        onEdit={handleEditProject}
                      />
                    ) : (
                      <motion.div
                        className="grid grid-cols-3 gap-5 w-full lg:grid-cols-2 md:gap-3 sm:grid-cols-2 sm:gap-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {filteredAndSortedItems.map((project) => (
                          <motion.div key={project.id} variants={itemVariants} layout>
                            <MemoizedProjectCard
                              project={project}
                              onDelete={handleDeleteClick}
                              onEdit={handleEditProject}
                              variants={itemVariants}
                              isLibraryView
                            />
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Move to Trash"
        message="Are you sure you want to move this project to trash? You can restore it later."
        confirmText="Move to Trash"
        cancelText="Cancel"
        isLoading={deleteModal.isLoading}
      />
    </main>
  );
}
