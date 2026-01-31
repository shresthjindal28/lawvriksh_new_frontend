import { useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '@/lib/api/projectService';
import { workspaceKeys } from './keys';
import { WorkspaceProject } from '@/types/workspace';

interface DeleteProjectOptions {
  permanent?: boolean;
}

/**
 * ✅ TanStack Query mutation to replace WorkspaceContext.deleteProject
 *
 * Soft deletes a project (moves to trash) with optimistic updates.
 * Immediately removes from UI, then rolls back if API fails.
 *
 * @returns TanStack Query mutation object
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      permanent = false,
    }: {
      projectId: string;
      permanent?: boolean;
    }) => {
      const response = await projectService.deleteProject(projectId, permanent);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete project');
      }

      return { projectId, permanent };
    },
    // ✅ Optimistic update: Remove from list immediately
    onMutate: async ({ projectId }) => {
      // Cancel ongoing queries for projects list
      await queryClient.cancelQueries({ queryKey: workspaceKeys.projects() });

      // Snapshot previous value for rollback
      const previousProjects = queryClient.getQueryData<WorkspaceProject[]>(
        workspaceKeys.projectsList(1, 100)
      );

      // Optimistically remove from cache
      queryClient.setQueryData<WorkspaceProject[]>(workspaceKeys.projectsList(1, 100), (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== projectId);
      });

      // Return context for rollback
      return { previousProjects };
    },
    onSuccess: () => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: workspaceKeys.projects() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.trash() });
    },
    // ✅ Rollback on error
    onError: (error, variables, context) => {
      console.error('Failed to delete project:', error);

      // Restore previous cache state
      if (context?.previousProjects) {
        queryClient.setQueryData(workspaceKeys.projectsList(1, 100), context.previousProjects);
      }
    },
  });
}
