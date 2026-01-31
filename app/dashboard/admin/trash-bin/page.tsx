'use client';

import { RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import ProjectCard from '@/components/dashboard/ProjectCard';
import '@/styles/trash-bin/trash-bin.css';
import { useEffect, memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonLoader } from '@/components/ui/Loader';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmptyTrashState from '@/components/dashboard/trash/EmptyTrashState';

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

export default function TrashBinPage() {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const { trashedProjects, fetchTrashedProjects, restoreProject, deleteProject, isLoading } =
    useWorkspace();

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    projectId: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    projectId: null,
    isLoading: false,
  });

  useEffect(() => {
    fetchTrashedProjects();
  }, [fetchTrashedProjects]);

  const handleRestore = async (projectId: string) => {
    await restoreProject(projectId);
  };

  const handlePermanentDeleteClick = (projectId: string) => {
    setDeleteModalState({
      isOpen: true,
      projectId,
      isLoading: false,
    });
  };

  const handleConfirmPermanentDelete = async () => {
    if (!deleteModalState.projectId) return;

    setDeleteModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteProject(deleteModalState.projectId, true);
      setDeleteModalState({
        isOpen: false,
        projectId: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to permanently delete project:', error);
      setDeleteModalState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const renderLoadingState = () => (
    <div className="trash-bin-grid">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          style={{
            height: '240px',
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e5e5',
            padding: '20px',
          }}
        >
          <SkeletonLoader height="140px" style={{ marginBottom: '16px' }} />
          <SkeletonLoader height="20px" width="70%" style={{ marginBottom: '8px' }} />
          <SkeletonLoader height="16px" width="40%" />
        </div>
      ))}
    </div>
  );

  if (!profile) {
    return (
      <div className="main-container">
        <div className="page-wrapper">
          <section className="content-section">{renderLoadingState()}</section>
        </div>
      </div>
    );
  }

  return (
    <main className="main-container">
      <div className="page-wrapper">
        <section className="content-section">
          <div className="trash-bin-content-inner">
            <motion.div
              className="trash-bin-container"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="trash-header">
                <h1>Trash Bin</h1>
                <p className="trash-subtitle">
                  Items in trash will be permanently deleted after 30 days.
                </p>
              </div>

              {isLoading && !trashedProjects ? (
                renderLoadingState()
              ) : (
                <motion.div
                  className="trash-bin-grid"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence mode="popLayout">
                    {!trashedProjects || trashedProjects.length === 0 ? (
                      <motion.div
                        className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 w-full"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <EmptyTrashState />
                      </motion.div>
                    ) : (
                      trashedProjects.map((project, index: number) => (
                        <motion.div
                          key={project.id}
                          className="trash-card-wrapper"
                          variants={itemVariants}
                          layout
                        >
                          <div className="trash-card-overlay">
                            <button
                              className="restore-btn"
                              onClick={() => handleRestore(project.id)}
                            >
                              <RotateCcw size={14} /> Restore
                            </button>
                          </div>
                          <MemoizedProjectCard
                            project={project}
                            onDelete={() => handlePermanentDeleteClick(project.id)}
                            index={index}
                          />
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      </div>

      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmPermanentDelete}
        title="Permanently Delete Project"
        message="Are you sure you want to permanently delete this project? This action cannot be undone."
        confirmText="Delete Forever"
        cancelText="Cancel"
        isLoading={deleteModalState.isLoading}
      />
    </main>
  );
}
