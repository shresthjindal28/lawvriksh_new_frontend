import { useQuery } from '@tanstack/react-query';
import projectService from '@/lib/api/projectService';
import { workspaceKeys } from './keys';
import { WorkspaceProject } from '@/types/workspace';

interface UseTrashedProjectsOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * ✅ TanStack Query hook to replace WorkspaceContext.trashedProjects
 *
 * Fetches soft-deleted projects from trash.
 * Uses Infinity staleTime since trash rarely changes spontaneously.
 *
 * @param options - Query configuration options
 * @returns TanStack Query result with trashed projects
 */
export function useTrashedProjects(options: UseTrashedProjectsOptions = {}) {
  const { page = 1, limit = 100, enabled = true } = options;

  return useQuery({
    queryKey: workspaceKeys.trash(),
    queryFn: async (): Promise<WorkspaceProject[]> => {
      const response = await projectService.getTrashedProjects(page, limit);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch trashed projects');
      }

      return response.data.workspaces || [];
    },
    enabled,
    staleTime: Infinity, // Trash rarely changes spontaneously, only via user actions
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
  });
}
