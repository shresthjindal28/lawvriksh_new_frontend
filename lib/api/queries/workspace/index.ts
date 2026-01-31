/**
 * Workspace/Projects TanStack Query Hooks
 *
 * This module provides React Query hooks to replace WorkspaceContext
 * with modern, scalable state management.
 */

// Query keys
export { workspaceKeys } from './keys';

// Query hooks
export { useProjects } from './useProjects';
export { useProjectSearch } from './useProjectSearch';
export { useTrashedProjects } from './useTrashedProjects';

// Mutation hooks
export { useCreateProject } from './useCreateProject';
export { useDeleteProject } from './useDeleteProject';
export { useUpdateProject } from './useUpdateProject';
export { useRestoreProject } from './useRestoreProject';
