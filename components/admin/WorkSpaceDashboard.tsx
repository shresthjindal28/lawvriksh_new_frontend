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

    <>
      <main className="min-h-screen w-full">
        <div className="m-0 flex min-h-screen max-w-full">
          <section className="flex flex-col flex-1">
            <Topbar
              mode="search"
              profileScore={profile?.profile_score || 0}
              onButtonClick={open}
              role={profile?.role}
            />
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <StudentDialog
                isOpen={isOpen}
                onClose={close}
                onSubmit={createStudentProject}
                isLoading={isCreating}
                category={category}
              />
              <div className="mx-auto mt-6 sm:mt-8 max-w-full">
                <SearchComponent
                  onSearch={searchStudentProject}
                  searchedProjects={searchedProjects}
                  isLoading={isLoading}
                />
                <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-medium text-inherit text-balance">
                  Start With..
                </h1>
                <div className="mt-6 sm:mt-8 grid gap-4 grid-cols-1 mb-8 sm:mb-12 min-[480px]:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                  {ProjectCreationOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`flex flex-col gap-2 h-48 sm:h-56 items-center justify-center rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:opacity-90 active:scale-95
                        ${option.id === 'article' ? 'bg-[#fff9db]' : ''}
                        ${option.id === 'assignment' ? 'bg-[#e3f0fb]' : ''}
                        ${option.id === 'research_paper' ? 'bg-[#e6f4ea]' : ''}
                      `}
                      onClick={() => handleClick(option.id)}
                    >
                      <option.Icon className="h-10 w-10 sm:h-12 sm:w-12 stroke-[1.5] mt-2 stroke-[#787878]" />
                      <p className="text-base sm:text-l font-semibold text-[#787878] font-['Playfair_Display']">
                        {option.name}
                      </p>
                    </div>
                  ))}
                </div>
                {studentProjects && (
                  <h1 className="font-['Playfair_Display'] text-2xl sm:text-3xl font-medium text-inherit text-balance">
                    Most Recent
                  </h1>
                )}
                <div className="mt-6 sm:mt-8 grid gap-4 grid-cols-1 mb-8 sm:mb-12 min-[480px]:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
                  {projectsList}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
