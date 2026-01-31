'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  usePromptHistoryStore,
  useProjectLoading,
  useProjectInitialized,
  useProjectPromptItems,
  useProjectGroupedHistory,
  usePromptHistoryActions,
  PromptStep,
  GroupedPromptHistory,
} from '@/store/zustand/usePromptHistoryStore';
import { PromptHistoryService } from '@/lib/api/promptHistoryService';

// ============================================================================
// Types
// ============================================================================

export interface UsePromptHistoryOptions {
  /** Auto-fetch on mount. Default: true */
  autoFetch?: boolean;
  /** Page size for pagination. Default: 50 */
  pageSize?: number;
  /** Stale time in ms before re-fetching. Default: 5 minutes */
  staleTime?: number;
}

export interface UsePromptHistoryReturn {
  // State - O(1) access
  items: PromptStep[];
  groupedItems: GroupedPromptHistory;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  fetchHistory: () => Promise<void>;
  addPrompt: (prompt: PromptStep) => void;
  updatePrompt: (promptId: string, updates: Partial<PromptStep>) => void;
  toggleExpanded: (promptId: string) => void;
  isExpanded: (promptId: string) => boolean;

  // Optimistic update helpers
  createOptimisticPrompt: (text: string) => PromptStep;
  submitPrompt: (text: string, metadata?: Record<string, unknown>) => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<UsePromptHistoryOptions> = {
  autoFetch: true,
  pageSize: 50,
  staleTime: 5 * 60 * 1000, // 5 minutes
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Primary hook for accessing prompt history data.
 * Provides O(1) lookups, pre-computed groupings, and selective re-renders.
 *
 * @param projectId - The project ID to fetch history for
 * @param options - Configuration options
 * @returns Prompt history state and actions
 *
 * @example
 * ```tsx
 * const { items, groupedItems, isLoading, submitPrompt } = usePromptHistory(projectId);
 * ```
 */
export function usePromptHistory(
  projectId: string | undefined,
  options: UsePromptHistoryOptions = {}
): UsePromptHistoryReturn {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const fetchInProgressRef = useRef(false);

  // Selective state subscriptions - each only triggers re-render when its value changes
  const isLoading = useProjectLoading(projectId);
  const isInitialized = useProjectInitialized(projectId);
  const items = useProjectPromptItems(projectId);
  const groupedItems = useProjectGroupedHistory(projectId);

  // Get actions (never causes re-render)
  const actions = usePromptHistoryActions();

  // Fetch history from API
  const fetchHistory = useCallback(async () => {
    if (!projectId || fetchInProgressRef.current) {
      return;
    }

    fetchInProgressRef.current = true;
    actions.setProjectLoading(projectId, true);

    try {
      const response = await PromptHistoryService.listPromptHistory({
        page: 1,
        page_size: mergedOptions.pageSize,
        workspace_id: projectId,
      });

      if (response.success && response.items) {
        // Store handles filtering, sorting, and grouping
        actions.setProjectHistory(projectId, response.items);
        console.log(
          '[usePromptHistory] Fetched prompt history:',
          response.items.length,
          'items for project:',
          projectId
        );
      } else {
        // Clear history on failure or empty response
        actions.setProjectHistory(projectId, []);
      }
    } catch (error) {
      console.error('[usePromptHistory] Failed to fetch prompt history:', error);
      actions.setProjectHistory(projectId, []);
    } finally {
      fetchInProgressRef.current = false;
      actions.setProjectLoading(projectId, false);
    }
  }, [projectId, mergedOptions.pageSize, actions]);

  // Check if data is stale
  const isStale = useCallback((): boolean => {
    if (!projectId) return false;

    const projectHistory = actions.getProjectHistory(projectId);
    if (!projectHistory?.lastFetchedAt) return true;

    const timeSinceLastFetch = Date.now() - projectHistory.lastFetchedAt;
    return timeSinceLastFetch > mergedOptions.staleTime;
  }, [projectId, mergedOptions.staleTime, actions]);

  // Auto-fetch on mount or when projectId changes
  useEffect(() => {
    if (!projectId || !mergedOptions.autoFetch) {
      return;
    }

    const shouldFetch = !isInitialized || isStale();

    if (shouldFetch) {
      fetchHistory();
    }
  }, [projectId, mergedOptions.autoFetch, isInitialized, isStale, fetchHistory]);

  // Set active project on mount
  useEffect(() => {
    if (projectId) {
      actions.setActiveProject(projectId);
    }

    return () => {
      actions.setActiveProject(null);
    };
  }, [projectId, actions]);

  // Add a new prompt to local state
  const addPrompt = useCallback(
    (prompt: PromptStep) => {
      if (!projectId) return;
      actions.addPrompt(projectId, prompt);
    },
    [projectId, actions]
  );

  // Update an existing prompt
  const updatePrompt = useCallback(
    (promptId: string, updates: Partial<PromptStep>) => {
      if (!projectId) return;
      actions.updatePrompt(projectId, promptId, updates);
    },
    [projectId, actions]
  );

  // Toggle expanded state for a prompt
  const toggleExpanded = useCallback(
    (promptId: string) => {
      actions.toggleExpanded(promptId);
    },
    [actions]
  );

  // Check if a prompt is expanded
  const isExpanded = useCallback(
    (promptId: string) => {
      return actions.isExpanded(promptId);
    },
    [actions]
  );

  // Create an optimistic prompt for immediate UI feedback
  const createOptimisticPrompt = useCallback((text: string): PromptStep => {
    return {
      id: `temp-${Date.now()}`,
      text,
      status: 'loading',
      createdAt: new Date().toISOString(),
    };
  }, []);

  // Submit a new prompt - only adds to local state, does NOT persist to backend
  // This ensures prompts typed in the AI sidebar don't appear in history after refresh
  const submitPrompt = useCallback(
    async (text: string, _metadata?: Record<string, unknown>) => {
      if (!projectId) return;

      const trimmedText = text.trim();
      if (!trimmedText) return;

      // Create prompt and add to local store only (no backend persistence)
      // This means the prompt will be visible during the current session
      // but will not appear after page refresh
      const prompt: PromptStep = {
        id: `local-${Date.now()}`,
        text: trimmedText,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      addPrompt(prompt);

      console.log('[usePromptHistory] Prompt added to local state (not persisted):', prompt.id);
    },
    [projectId, addPrompt]
  );

  return {
    // State
    items,
    groupedItems,
    isLoading,
    isInitialized,

    // Actions
    fetchHistory,
    addPrompt,
    updatePrompt,
    toggleExpanded,
    isExpanded,

    // Helpers
    createOptimisticPrompt,
    submitPrompt,
  };
}

// ============================================================================
// Additional Specialized Hooks
// ============================================================================

/**
 * Hook for accessing a single prompt by ID - O(1) lookup
 *
 * @param projectId - The project ID
 * @param promptId - The prompt ID to look up
 * @returns The prompt or undefined
 */
export function usePromptById(
  projectId: string | undefined,
  promptId: string | undefined
): PromptStep | undefined {
  return usePromptHistoryStore((state) => {
    if (!projectId || !promptId) return undefined;
    return state.historyByProject[projectId]?.itemsById[promptId];
  });
}

/**
 * Hook for checking if a prompt is expanded - isolated re-render
 *
 * @param promptId - The prompt ID to check
 * @returns Whether the prompt is expanded
 */
export function useIsPromptExpanded(promptId: string): boolean {
  return usePromptHistoryStore((state) => state.expandedItemIds.has(promptId));
}

/**
 * Hook for getting total count for a project
 *
 * @param projectId - The project ID
 * @returns Total count of prompts
 */
export function usePromptCount(projectId: string | undefined): number {
  return usePromptHistoryStore((state) =>
    projectId ? (state.historyByProject[projectId]?.total ?? 0) : 0
  );
}

/**
 * Hook for checking if project has more items to load
 *
 * @param projectId - The project ID
 * @returns Whether more items are available
 */
export function useHasMorePrompts(projectId: string | undefined): boolean {
  return usePromptHistoryStore((state) =>
    projectId ? (state.historyByProject[projectId]?.hasMore ?? false) : false
  );
}
