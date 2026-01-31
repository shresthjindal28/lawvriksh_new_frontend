import { useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '@/lib/api/projectService';
import { workspaceKeys } from './keys';
import { UpdateProjectRequest } from '@/types/project';
import { WorkspaceProject } from '@/types/workspace';

/**
 * ✅ TanStack Query mutation to replace WorkspaceContext.updateWorkspace
 *
 * Updates project title or access type with optimistic updates.
 *
 * @returns TanStack Query mutation object
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: string; data: UpdateProjectRequest }) => {
      const response = await projectService.updateProject(projectId, data);

      if (!response.success) {
        throw new Error(response.message || 'Failed to update project');
      }

      return { projectId, ...response.data };
    },
    // ✅ Optimistic update
    onMutate: async ({ projectId, data }) => {
      await queryClient.cancelQueries({ queryKey: workspaceKeys.projects() });

      const previousProjects = queryClient.getQueryData<WorkspaceProject[]>(
        workspaceKeys.projectsList(1, 100)
      );

      // Optimistically update in cache
      queryClient.setQueryData<WorkspaceProject[]>(workspaceKeys.projectsList(1, 100), (old) => {
        if (!old) return [];
        return old.map((p) =>
          p.id === projectId
            ? { ...p, title: data.title || p.title, access_type: data.access_type || p.access_type }
            : p
        );
      });

      return { previousProjects };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.projects() });
    },
    onError: (error, variables, context) => {
      console.error('Failed to update project:', error);
      if (context?.previousProjects) {
        queryClient.setQueryData(workspaceKeys.projectsList(1, 100), context.previousProjects);
      }
    },
  });
}
