import { QueryClient, dehydrate } from '@tanstack/react-query';
import { workspaceKeys } from '@/lib/api/queries/workspace/keys';
import { getWorkspaceServer } from '@/lib/api/workSpaceService.server';
import type { WorkspaceProject } from '@/types/workspace';
import LibraryClient from '../client/LibraryClient';

export default async function LibraryPageServer() {
  const queryClient = new QueryClient();

  const page = 1;
  const limit = 100;

  await queryClient.prefetchQuery({
    queryKey: workspaceKeys.projectsList(page, limit),
    queryFn: async (): Promise<WorkspaceProject[]> => {
      const response = await getWorkspaceServer(page, limit);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch projects');
      }

      return response.data.workspaces || [];
    },
  });

  return <LibraryClient dehydratedState={dehydrate(queryClient)} />;
}
