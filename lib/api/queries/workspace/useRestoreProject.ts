import { useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '@/lib/api/projectService';
import { workspaceKeys } from './keys';
import { WorkspaceProject } from '@/types/workspace';

/**
 * ✅ TanStack Query mutation to replace WorkspaceContext.restoreProject
 *
 * Restores a project from trash with optimistic updates.
 *
 * @returns TanStack Query mutation object
 */
export function useRestoreProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await projectService.restoreProject(projectId);

      if (!response.success) {
        throw new Error(response.message || 'Failed to restore project');
      }

      return { projectId };
    },
    onSuccess: () => {
      // Invalidate both projects and trash queries
      queryClient.invalidateQueries({ queryKey: workspaceKeys.projects() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.trash() });
    },
    onError: (error) => {
      console.error('Failed to restore project:', error);
    },
  });
}
