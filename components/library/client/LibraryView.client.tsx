'use client';

import { FolderX, Plus, Search, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import '@/styles/common-styles/library.css';
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
                className="projects-grid"
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
    <div className="projects-grid">
      {[1, 2, 3, 4].map((n) => (
        <div key={n} className="skeleton-card">
          <SkeletonLoader height="140px" style={{ marginBottom: '16px' }} />
          <SkeletonLoader height="20px" width="70%" style={{ marginBottom: '8px' }} />
          <SkeletonLoader height="16px" width="40%" />
        </div>
      ))}
    </div>
  );

  const shouldVirtualize = filteredAndSortedItems.length > VIRTUALIZATION_THRESHOLD;

  return (
    <main className="main-container">
      <MobileHeader />
      <div className="page-wrapper">
        <section className="content-section">
          <div className="main-content">
            <StudentDialog
              isOpen={isCreateDialogOpen}
              onClose={closeCreateDialog}
              onSubmit={handleCreateProject}
              isLoading={createProjectMutation.isPending}
              category={category}
            />
            <div className="library-content-inner">
              <motion.div
                className="library-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="library-search">
                  <div className="library-search-icon-left">
                    <Search size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search projects..."
                    className="library-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="library-search-clear" onClick={clearSearch}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="filter-pills-container">
                  {filterButtons.map((filter) => {
                    const isActive = filterType === filter.type;
                    return (
                      <button
                        key={filter.type}
                        className={`filter-pill ${isActive ? 'active' : ''}`}
                        onClick={() => handleFilterChange(filter.type)}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeFilter"
                            className="active-pill-bg"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span className="filter-pill-text">{filter.label}</span>
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
                        className="no-items-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="no-items-icon">
                          <FolderX size={40} strokeWidth={1.5} />
                        </div>
                        <h2>
                          {filterType === 'recent'
                            ? 'No Projects Found'
                            : `No ${filterButtons.find((f) => f.type === filterType)?.label}s Found`}
                        </h2>
                        <p>
                          {filterType === 'recent'
                            ? 'Start creating your first project to populate your library.'
                            : `You don't have any ${filterButtons.find((f) => f.type === filterType)?.label?.toLowerCase()}s yet. Create one to get started.`}
                        </p>
                        <button
                          className="library-start-writing-btn"
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
                          <Plus size={20} />
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
                        className="projects-grid"
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
