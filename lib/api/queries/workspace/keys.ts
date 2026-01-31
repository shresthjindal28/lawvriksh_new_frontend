/**
 * Query keys for workspace/projects-related TanStack Query hooks
 * Following the pattern from dashboardKeys in useDashboardAnalytics
 */

export const workspaceKeys = {
  all: ['workspace'] as const,
  projects: () => [...workspaceKeys.all, 'projects'] as const,
  projectsList: (page: number, limit: number) =>
    [...workspaceKeys.projects(), 'list', { page, limit }] as const,
  projectDetail: (id: string) => [...workspaceKeys.projects(), 'detail', id] as const,
  search: () => [...workspaceKeys.all, 'search'] as const,
  searchQuery: (query: string) => [...workspaceKeys.search(), query] as const,
  trash: () => [...workspaceKeys.all, 'trash'] as const,
} as const;
