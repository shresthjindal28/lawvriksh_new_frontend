'use client';

import { RotateCcw } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import ProjectCard from '@/components/dashboard/ProjectCard';
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
    <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-full">
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
      <div className="w-full h-full">
        <div className="px-4 py-6 sm:px-8 lg:px-[60px] lg:py-10 bg-[#fafafa] min-h-[calc(100vh-80px)] box-border overflow-x-hidden w-full">
          <section className="max-w-[1400px] mx-auto w-full">{renderLoadingState()}</section>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full h-full">
      <div className="px-4 py-6 sm:px-8 lg:px-[60px] lg:py-10 bg-[#fafafa] min-h-[calc(100vh-80px)] box-border overflow-x-hidden w-full">
        <section className="max-w-[1400px] mx-auto w-full">
          <div className="max-w-[1400px] mx-auto w-full">
            <motion.div
              className="w-full px-4 py-6 sm:px-8 lg:px-[60px] lg:py-10 bg-[#fafafa] min-h-[calc(100vh-80px)] box-border overflow-x-hidden"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-6 pb-3 border-b border-[#eaeaea]">
                <h1 className="font-[family-name:var(--font-playfair),serif] text-2xl sm:text-[32px] font-semibold text-[#1a1a1a] mb-2 tracking-[-0.01em]">
                  Trash Bin
                </h1>
                <p className="text-sm text-[#666666] m-0">
                  Items in trash will be permanently deleted after 30 days.
                </p>
              </div>

              {isLoading && !trashedProjects ? (
                renderLoadingState()
              ) : (
                <motion.div
                  className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full max-w-full"
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
                          className="relative rounded-xl overflow-hidden group [&_.project-card]:opacity-85 [&_.project-card]:transition-opacity [&_.project-card]:duration-200 group-hover:[&_.project-card]:opacity-100"
                          variants={itemVariants}
                          layout
                        >
                          <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none group-hover:pointer-events-auto">
                            <button
                              className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1a1a] text-white border-none rounded-lg font-medium text-sm cursor-pointer translate-y-[10px] group-hover:translate-y-0 transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-[#333] hover:scale-[1.02]"
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
