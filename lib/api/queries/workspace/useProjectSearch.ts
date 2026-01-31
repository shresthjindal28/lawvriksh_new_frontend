import { useQuery } from '@tanstack/react-query';
import projectService from '@/lib/api/projectService';
import { workspaceKeys } from './keys';
import { SearchProject } from '@/types/project';

interface UseProjectSearchOptions {
  query: string;
  enabled?: boolean;
}

/**
 * ✅ TanStack Query hook to replace WorkspaceContext.searchStudentProject
 *
 * Performs debounced server-side search of projects.
 * Only executes when query length > 2 to avoid excessive API calls.
 *
 * @param options - Search configuration
 * @returns TanStack Query result with search results
 */
export function useProjectSearch(options: UseProjectSearchOptions) {
  const { query, enabled = true } = options;

  return useQuery({
    queryKey: workspaceKeys.searchQuery(query),
    queryFn: async (): Promise<SearchProject[]> => {
      const response = await projectService.searchProjects({ query });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search projects');
      }

      return response.data.results || [];
    },
    // Only enable if query is at least 3 characters and explicitly enabled
    enabled: enabled && query.trim().length > 2,
    staleTime: 1000 * 30, // 30 seconds (search results can be more dynamic)
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
