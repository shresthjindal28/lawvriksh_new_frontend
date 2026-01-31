'use client';

import { Brain, Newspaper, NotepadText, PenTool, Plus, Search } from 'lucide-react';
import { memo, useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialog } from '@/hooks/common/useDialog';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Topbar } from '../layout/Topbar.client';
import StudentDialog from '../ui/StudentDialog';
import ProjectCard from '../dashboard/ProjectCard';
import DeleteProjectDialog from '../common/DeleteProjectDialog';
import { useDeleteModalStore } from '@/store/zustand/useDeleteModalStore';
import { ProjectCategory } from '@/types/project';
import { ProjectCreationOptions } from '@/lib/config/projectConfig';
import SearchComponent from '../layout/SearchInterface.client';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
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
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function WorkspaceDashboard() {
  const { isOpen, open, close } = useDialog();
  const [category, setCategory] = useState<ProjectCategory>('ideation');
  const { openModal } = useDeleteModalStore();

  const { profile } = useAuth();
  const {
    studentProjects,
    isCreating,
    createStudentProject,
    fetchStudentProjects,
    searchStudentProject,
    searchedProjects,
    isLoading,
    deleteProject,
  } = useWorkspace();

  const handleDelete = useCallback(
    (projectId: string) => {
      const project = studentProjects?.find((p) => p.id === projectId);
      if (project) {
        openModal(projectId, project.title || 'Untitled Project', async () => {
          await deleteProject(projectId);
        });
      }
    },
    [studentProjects, deleteProject, openModal]
  );

  const projectsList = useMemo(
    () => (
      <>
        {studentProjects?.map((project) => (
          <ProjectCard
            key={project.id}
            project={{
              ...project,
              author_name: profile?.name || 'User',
              authors: [],
            }}
            onDelete={handleDelete}
          />
        ))}
      </>
    ),
    [studentProjects, profile?.name, handleDelete]
  );

  const handleClick = useCallback(
    (category: string) => {
      setCategory(category as ProjectCategory);
      open();
    },
    [open]
  );

  useEffect(() => {
    fetchStudentProjects();
  }, [fetchStudentProjects]);

  return (
    <main className="main-container">
      <div className="page-wrapper">
        <section className="content-section">
          <Topbar
            mode="search"
            profileScore={profile?.profile_score || 0}
            onButtonClick={open}
            role={profile?.role}
          />
          <motion.div
            className="dashboard-content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <StudentDialog
              isOpen={isOpen}
              onClose={close}
              onSubmit={createStudentProject}
              isLoading={isCreating}
              category={category}
            />
            <DeleteProjectDialog />
            <div className="dashboard-content-inner">
              <div className="dashboard-main-grid">
                <div className="dashboard-left-column">
                  <motion.div variants={itemVariants} className="dashboard-header">
                    <div className="dashboard-welcome-container">
                      <h2 className="dashboard-welcome-title">
                        Welcome back, {profile?.name?.split(' ')[0] || profile?.username || 'User'}
                      </h2>
                      <p className="dashboard-welcome-subtitle">Pick up where you left off</p>
                    </div>
                    <div className="dashboard-search">
                      <SearchComponent
                        onSearch={searchStudentProject}
                        searchedProjects={searchedProjects}
                        isLoading={isLoading}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="dashboard-stats-grid">
                    <div className="dashboard-stat-card">
                      <span className="dashboard-stat-label">TOTAL PROJECTS</span>
                      <span className="dashboard-stat-value">{studentProjects?.length || 0}</span>
                      <div className="dashboard-stat-footer">
                        <div className="dashboard-footer-inner">
                          <div className="dashboard-stat-trend">
                            <span className="dashboard-stat-subtext">All time</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-stat-card">
                      <span className="dashboard-stat-label">THIS WEEK</span>
                      <span className="dashboard-stat-value">
                        {studentProjects?.filter((p) => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(p.updated_at) > weekAgo;
                        }).length || 0}
                      </span>
                      <div className="dashboard-stat-footer">
                        <div className="dashboard-footer-inner">
                          <div className="dashboard-stat-trend">
                            <span className="dashboard-stat-subtext">Updated recently</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="dashboard-stat-card">
                      <span className="dashboard-stat-label">DRAFTS</span>
                      <span className="dashboard-stat-value">
                        {studentProjects?.filter((p) => p.category === 'draft').length || 0}
                      </span>
                      <div className="dashboard-stat-footer">
                        <div className="dashboard-footer-inner">
                          <div className="dashboard-stat-trend">
                            <span className="dashboard-stat-subtext">In progress</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="dashboard-new-project-section">
                    <h3 className="dashboard-section-heading">START A NEW PROJECT</h3>
                    <div className="dashboard-new-project-grid">
                      {ProjectCreationOptions.map((option) => (
                        <motion.div
                          key={option.id}
                          className="dashboard-new-project-card"
                          onClick={() => handleClick(option.id)}
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="dashboard-new-project-icon">
                            <option.Icon size={24} />
                          </div>
                          <p className="dashboard-new-project-label">{option.name}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {studentProjects && studentProjects.length > 0 && (
                    <motion.div variants={itemVariants} className="dashboard-recent-section">
                      <h3 className="dashboard-recent-header">RECENT PROJECTS</h3>
                      <motion.div className="dashboard-projects-grid" variants={containerVariants}>
                        {projectsList}
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                <aside className="dashboard-right-column">
                  <h3 className="dashboard-section-heading">RESEARCH ASSISTANT</h3>
                  <p className="dashboard-research-subtitle">Your AI-powered research companion</p>
                  <div className="dashboard-research-container">
                    <div className="dashboard-research-list">
                      <div className="dashboard-reference-item">
                        <span>
                          Start a new research session to find relevant sources and citations.
                        </span>
                      </div>
                    </div>
                    <div className="dashboard-research-footer">Powered by AI</div>
                  </div>
                </aside>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
