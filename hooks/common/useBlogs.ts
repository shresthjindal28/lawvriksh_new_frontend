'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProjectByIdSchema } from '@/lib/validators/project/project.schemas';
import projectService from '@/lib/api/projectService';
import { OutputData } from '@editorjs/editorjs';
import { GetProjectContent } from '@/types/project';

export function useBlogs(projectId: string) {
  const [projectData, setProjectData] = useState<OutputData | null>(null);
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  const [project, setProject] = useState<GetProjectContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogData = useCallback(async () => {
    try {
      setIsLoading(true);
      const projectResponse = await projectService.getProjectById(projectId);

      if (!projectResponse.success) {
        throw new Error(projectResponse.message || 'Failed to fetch project');
      }

      const validation = getProjectByIdSchema.safeParse(projectResponse.data);

      if (!validation.success) {
        throw new Error(validation.error.message);
      }

      setProjectTitle(projectResponse.data?.workspace.title || '');
      const content = projectResponse.data?.workspace.content?.data.data;
      if (content) {
        setProjectData(content);
      }

      if (projectResponse.data?.workspace) {
        setProject(projectResponse.data.workspace);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog data');
      setProjectData(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBlogData();
  }, [fetchBlogData]);

  return { projectData, projectTitle, project, isLoading, error };
}
