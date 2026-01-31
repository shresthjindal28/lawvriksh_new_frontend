'use client';

import { FolderX, Plus, Search, X } from 'lucide-react';
import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { filterButtons, FilterType } from '@/lib/constants/library';
import ProjectCard from '../dashboard/ProjectCard';
import StudentDialog from '../ui/StudentDialog';
import { useDialog } from '@/hooks/common/useDialog';
import { ProjectCategory } from '@/types/project';
import { SkeletonLoader } from '../ui/Loader';
import ConfirmModal from '../ui/ConfirmModal';
import { MobileHeader } from '@/components/common/MobileHeader';
import { useCreateProject, useDeleteProject, useProjects } from '@/lib/api/queries/workspace';
import { useToast } from '@/lib/contexts/ToastContext';

const MemoizedProjectCard = memo(ProjectCard);

// Animation variants
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

export default function LibraryComponent() {
  const { isOpen, open, close } = useDialog();
  const router = useRouter();
  const { addToast } = useToast();
  const [filterType, setFilterType] = useState<FilterType>('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const [category, setCategory] = useState<ProjectCategory>('ideation');
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    projectId: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    projectId: null,
    isLoading: false,
  });

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

  const handleFilterChange = useCallback((filter: FilterType) => {
    setFilterType(filter);
  }, []);

  const handleDeleteClick = useCallback((projectId: string) => {
    setDeleteModalState({
      isOpen: true,
      projectId,
      isLoading: false,
    });
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteModalState.projectId) return;

    setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteProjectMutation.mutateAsync({ projectId: deleteModalState.projectId });
      addToast('Project Moved to Trash', 'success');
      setDeleteModalState({
        isOpen: false,
        projectId: null,
        isLoading: false,
      });
    } catch (error) {
      addToast('Unable to delete the Project', 'error');
      setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleEditProject = useCallback(
    (project: any) => {
      const category = project.category?.toLowerCase() || '';
      if (category === 'draft') {
        router.push(`/AIDrafting/writing-section/${project.id}`);
      } else {
        router.push(`/writing-section/${project.id}`);
      }
    },
    [router]
  );

  const filteredAndSortedItems = useMemo(() => {
    let items: any[] = [];

    // Sort by most recent
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

  return (
    <main className="main-container">
      <MobileHeader />
      <div className="page-wrapper">
        <section className="content-section">
          <div className="main-content">
            <StudentDialog
              isOpen={isOpen}
              onClose={close}
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
                    <button className="library-search-clear" onClick={() => setSearchQuery('')}>
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
                <motion.div
                  className="projects-grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredAndSortedItems?.length === 0 ? (
                      <motion.div
                        className="no-items-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <FolderX size={64} className="no-items-icon" />
                        <h2>No Projects Found</h2>
                        <p>
                          {filterType === 'recent'
                            ? 'Start creating your first project to populate your library.'
                            : `No projects found in the "${filterButtons.find((f) => f.type === filterType)?.label}" category.`}
                        </p>
                        <button
                          className="library-start-writing-btn"
                          onClick={() => {
                            setCategory('ideation');
                            open();
                          }}
                        >
                          <Plus size={20} />
                          <span>Start Writing</span>
                        </button>
                      </motion.div>
                    ) : (
                      filteredAndSortedItems.map((project, index) => (
                        <motion.div key={project.id} variants={itemVariants} layout>
                          <MemoizedProjectCard
                            project={project}
                            onDelete={handleDeleteClick}
                            onEdit={handleEditProject}
                            variants={itemVariants}
                          />
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </div>
      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title="Move to Trash"
        message="Are you sure you want to move this project to trash? You can restore it later."
        confirmText="Move to Trash"
        cancelText="Cancel"
        isLoading={deleteModalState.isLoading}
      />
    </main>
  );
}
