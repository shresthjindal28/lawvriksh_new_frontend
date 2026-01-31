import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '@/lib/api/workSpaceService';
import { workspaceKeys } from './keys';
import { WorkspaceProject } from '@/types/workspace';

interface UseProjectsOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * ✅ TanStack Query hook to replace WorkspaceContext.studentProjects
 *
 * Fetches paginated list of student projects with automatic caching,
 * background refetching, and loading/error states.
 *
 * @param options - Query configuration options
 * @returns TanStack Query result with projects data
 */
export function useProjects(options: UseProjectsOptions = {}) {
  const { page = 1, limit = 100, enabled = true } = options;

  return useQuery({
    queryKey: workspaceKeys.projectsList(page, limit),
    queryFn: async (): Promise<WorkspaceProject[]> => {
      const response = await workspaceService.getWorkspace(page, limit);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch projects');
      }

      // Return the workspaces array directly
      return response.data.workspaces || [];
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes (same as dashboardAnalytics)
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false, // Avoid excessive refetching
    refetchOnMount: false, // Use cache first
  });
}
