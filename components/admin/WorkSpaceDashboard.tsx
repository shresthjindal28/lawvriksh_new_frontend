'use client';

import { Brain, Newspaper, NotepadText, PenTool } from 'lucide-react';
import { memo, useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useDialog } from '@/hooks/common/useDialog';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Topbar } from '../layout/Topbar.client';
import StudentDialog from '../ui/StudentDialog';
import StudentProjectCard from '../student/ProjectCard';
import { ProjectCategory } from '@/types/project';
import { ProjectCreationOptions } from '@/lib/config/projectConfig';
import SearchComponent from '../layout/SearchInterface.client';

const MemoizedProjectCard = memo(StudentProjectCard);

export default function WorkspaceDashboard() {
  const { isOpen, open, close } = useDialog();
  const [category, setCategory] = useState<ProjectCategory>('article');

  const { profile } = useAuth();
  const {
    studentProjects,
    isCreating,
    createStudentProject,
    fetchStudentProjects,
    searchStudentProject,
    searchedProjects,
    isLoading,
  } = useWorkspace();

  const projectsList = useMemo(
    () => (
      <>
        {studentProjects?.map((project) => (
          <Link
            style={{ textDecoration: 'none' }}
            href={`/writing-section/${project.id}`}
            key={project.id}
          >
            <MemoizedProjectCard
              title={project.title}
              type={project.category}
              authors={project.metadata?.data?.templateData?.authorNames}
              lastEdited={project.updated_at}
              access_type={project.access_type}
              subject={project.category}
            />
          </Link>
        ))}
      </>
    ),
    [studentProjects]
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
          <div className="main-content">
            <StudentDialog
              isOpen={isOpen}
              onClose={close}
              onSubmit={createStudentProject}
              isLoading={isCreating}
              category={category}
            />
            <div className="content-wrapper">
              <SearchComponent
                onSearch={searchStudentProject}
                searchedProjects={searchedProjects}
                isLoading={isLoading}
              />
              <h1 className="page-title-home">Start With..</h1>
              <div className="projects-grid">
                {ProjectCreationOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`add-project-card project-card-${option.id}`}
                    onClick={() => handleClick(option.id)}
                  >
                    <option.Icon className="plus-icon" />
                    <p>{option.name}</p>
                  </div>
                ))}
              </div>
              {studentProjects && <h1 className="page-title-home">Most Recent</h1>}
              <div className="projects-grid">{projectsList}</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
