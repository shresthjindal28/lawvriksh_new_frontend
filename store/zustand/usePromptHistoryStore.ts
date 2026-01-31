'use client';

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { PromptHistoryItem } from '@/lib/api/promptHistoryService';

// ============================================================================
// Types
// ============================================================================

/**
 * Prompt step for UI display
 */
export interface PromptStep {
  id: string;
  text: string;
  status: 'completed' | 'loading';
  response?: string;
  createdAt?: string;
  promptType?: string;
}

/**
 * Project-specific prompt history data
 */
export interface ProjectPromptHistory {
  items: PromptStep[];
  itemsById: Record<string, PromptStep>; // O(1) lookup by ID
  itemIds: string[]; // Maintains order (newest first)
  isLoading: boolean;
  isInitialized: boolean;
  lastFetchedAt: number | null;
  total: number;
  hasMore: boolean;
}

/**
 * Grouped items by date for display (computed once, reused)
 */
export interface GroupedPromptHistory {
  today: PromptStep[];
  yesterday: PromptStep[];
  thisWeek: PromptStep[];
  older: PromptStep[];
}

// ============================================================================
// State Interface
// ============================================================================

interface PromptHistoryState {
  // Data - HashMap keyed by projectId for O(1) project lookup
  historyByProject: Record<string, ProjectPromptHistory>;

  // Pre-computed groupings by projectId (computed once on data change)
  groupedByProject: Record<string, GroupedPromptHistory>;

  // UI State
  expandedItemIds: Set<string>; // Which items are expanded (global across projects)

  // Active project tracking
  activeProjectId: string | null;
}

// ============================================================================
// Actions Interface
// ============================================================================

interface PromptHistoryActions {
  // Project-specific actions - O(1) operations
  setProjectHistory: (projectId: string, items: PromptHistoryItem[]) => void;
  getProjectHistory: (projectId: string) => ProjectPromptHistory | undefined;
  getPromptById: (projectId: string, promptId: string) => PromptStep | undefined;

  // Single item operations - O(1)
  addPrompt: (projectId: string, prompt: PromptStep) => void;
  updatePrompt: (projectId: string, promptId: string, updates: Partial<PromptStep>) => void;
  removePrompt: (projectId: string, promptId: string) => void;

  // Loading state management
  setProjectLoading: (projectId: string, isLoading: boolean) => void;
  setProjectInitialized: (projectId: string, isInitialized: boolean) => void;

  // Pagination
  appendPrompts: (projectId: string, items: PromptHistoryItem[], hasMore: boolean) => void;

  // UI State actions
  toggleExpanded: (promptId: string) => void;
  isExpanded: (promptId: string) => boolean;
  setActiveProject: (projectId: string | null) => void;

  // Pre-computed grouped history - O(1) access
  getGroupedHistory: (projectId: string) => GroupedPromptHistory;

  // Cleanup
  clearProjectHistory: (projectId: string) => void;
  reset: () => void;
}

// ============================================================================
// Combined Store Type
// ============================================================================

export type PromptHistoryStore = PromptHistoryState & PromptHistoryActions;

// ============================================================================
// Initial State
// ============================================================================

const createEmptyProjectHistory = (): ProjectPromptHistory => ({
  items: [],
  itemsById: {},
  itemIds: [],
  isLoading: false,
  isInitialized: false,
  lastFetchedAt: null,
  total: 0,
  hasMore: false,
});

const createEmptyGroupedHistory = (): GroupedPromptHistory => ({
  today: [],
  yesterday: [],
  thisWeek: [],
  older: [],
});

const initialState: PromptHistoryState = {
  historyByProject: {},
  groupedByProject: {},
  expandedItemIds: new Set(),
  activeProjectId: null,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert API PromptHistoryItem to internal PromptStep
 */
const apiItemToPromptStep = (item: PromptHistoryItem): PromptStep => ({
  id: item.id,
  text: item.prompt_text,
  status: 'completed',
  response: item.prompt_response,
  createdAt: item.created_at,
  promptType: item.prompt_type,
});

/**
 * Convert array to Map-based storage for O(1) lookups
 */
const arrayToMapStorage = (
  items: PromptStep[]
): { byId: Record<string, PromptStep>; ids: string[] } => {
  const byId: Record<string, PromptStep> = {};
  const ids: string[] = [];
  items.forEach((item) => {
    byId[item.id] = item;
    ids.push(item.id);
  });
  return { byId, ids };
};

/**
 * Compute grouped history from items - O(n) but only computed once
 * Groups are reused on subsequent renders
 */
const computeGroupedHistory = (items: PromptStep[]): GroupedPromptHistory => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const grouped: GroupedPromptHistory = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  // Single pass through items - O(n)
  for (const item of items) {
    const itemDate = item.createdAt ? new Date(item.createdAt) : now;

    if (itemDate >= today) {
      grouped.today.push(item);
    } else if (itemDate >= yesterday) {
      grouped.yesterday.push(item);
    } else if (itemDate >= weekAgo) {
      grouped.thisWeek.push(item);
    } else {
      grouped.older.push(item);
    }
  }

  return grouped;
};

/**
 * Filter items by projectId from API response
 */
const filterItemsByProject = (
  items: PromptHistoryItem[],
  projectId: string
): PromptHistoryItem[] => {
  return items.filter((item) => {
    // Primary check: workspace_id field matches projectId
    if (item.workspace_id === projectId) {
      return true;
    }

    // Secondary check: projectId in metadata
    if (item.metadata) {
      try {
        const meta = JSON.parse(item.metadata);
        if (
          meta.projectId === projectId ||
          meta.workspace_id === projectId ||
          meta.document_id === projectId
        ) {
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  });
};

/**
 * Sort items by created_at descending (newest first)
 */
const sortByDateDescending = (items: PromptHistoryItem[]): PromptHistoryItem[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });
};

// ============================================================================
// Store Implementation
// ============================================================================

export const usePromptHistoryStore = create<PromptHistoryStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      ...initialState,

      // ======================================================================
      // Project History Actions - O(1) project lookup
      // ======================================================================

      setProjectHistory: (projectId, items) => {
        // Filter and sort items for this project
        const filteredItems = filterItemsByProject(items, projectId);
        const sortedItems = sortByDateDescending(filteredItems);

        // Convert to internal format
        const promptSteps = sortedItems.map(apiItemToPromptStep);

        // Create Map-based storage for O(1) lookups
        const { byId, ids } = arrayToMapStorage(promptSteps);

        // Pre-compute grouped history
        const grouped = computeGroupedHistory(promptSteps);

        set(
          (state) => ({
            historyByProject: {
              ...state.historyByProject,
              [projectId]: {
                items: promptSteps,
                itemsById: byId,
                itemIds: ids,
                isLoading: false,
                isInitialized: true,
                lastFetchedAt: Date.now(),
                total: promptSteps.length,
                hasMore: false,
              },
            },
            groupedByProject: {
              ...state.groupedByProject,
              [projectId]: grouped,
            },
          }),
          false,
          'promptHistory/setProjectHistory'
        );
      },

      getProjectHistory: (projectId) => {
        return get().historyByProject[projectId];
      },

      getPromptById: (projectId, promptId) => {
        const projectHistory = get().historyByProject[projectId];
        return projectHistory?.itemsById[promptId];
      },

      // ======================================================================
      // Single Item Operations - O(1)
      // ======================================================================

      addPrompt: (projectId, prompt) => {
        set(
          (state) => {
            const existingHistory =
              state.historyByProject[projectId] || createEmptyProjectHistory();

            // Add to beginning (newest first) - O(1) for the lookup, O(n) for array shift
            // but maintains order correctly
            const newItemsById = { ...existingHistory.itemsById, [prompt.id]: prompt };
            const newItemIds = [prompt.id, ...existingHistory.itemIds];
            const newItems = [prompt, ...existingHistory.items];

            // Recompute grouped history
            const grouped = computeGroupedHistory(newItems);

            return {
              historyByProject: {
                ...state.historyByProject,
                [projectId]: {
                  ...existingHistory,
                  items: newItems,
                  itemsById: newItemsById,
                  itemIds: newItemIds,
                  total: existingHistory.total + 1,
                },
              },
              groupedByProject: {
                ...state.groupedByProject,
                [projectId]: grouped,
              },
            };
          },
          false,
          'promptHistory/addPrompt'
        );
      },

      updatePrompt: (projectId, promptId, updates) => {
        set(
          (state) => {
            const existingHistory = state.historyByProject[projectId];
            if (!existingHistory || !existingHistory.itemsById[promptId]) {
              return state;
            }

            // O(1) update in the Map
            const updatedItem = { ...existingHistory.itemsById[promptId], ...updates };
            const newItemsById = { ...existingHistory.itemsById, [promptId]: updatedItem };

            // Update the items array as well
            const newItems = existingHistory.items.map((item) =>
              item.id === promptId ? updatedItem : item
            );

            // Recompute grouped history
            const grouped = computeGroupedHistory(newItems);

            return {
              historyByProject: {
                ...state.historyByProject,
                [projectId]: {
                  ...existingHistory,
                  items: newItems,
                  itemsById: newItemsById,
                },
              },
              groupedByProject: {
                ...state.groupedByProject,
                [projectId]: grouped,
              },
            };
          },
          false,
          'promptHistory/updatePrompt'
        );
      },

      removePrompt: (projectId, promptId) => {
        set(
          (state) => {
            const existingHistory = state.historyByProject[projectId];
            if (!existingHistory) {
              return state;
            }

            // Remove from Map - O(1)
            const { [promptId]: removed, ...newItemsById } = existingHistory.itemsById;
            if (!removed) {
              return state;
            }

            // Filter arrays
            const newItemIds = existingHistory.itemIds.filter((id) => id !== promptId);
            const newItems = existingHistory.items.filter((item) => item.id !== promptId);

            // Recompute grouped history
            const grouped = computeGroupedHistory(newItems);

            return {
              historyByProject: {
                ...state.historyByProject,
                [projectId]: {
                  ...existingHistory,
                  items: newItems,
                  itemsById: newItemsById,
                  itemIds: newItemIds,
                  total: existingHistory.total - 1,
                },
              },
              groupedByProject: {
                ...state.groupedByProject,
                [projectId]: grouped,
              },
            };
          },
          false,
          'promptHistory/removePrompt'
        );
      },

      // ======================================================================
      // Loading State Management
      // ======================================================================

      setProjectLoading: (projectId, isLoading) => {
        set(
          (state) => {
            const existingHistory =
              state.historyByProject[projectId] || createEmptyProjectHistory();

            return {
              historyByProject: {
                ...state.historyByProject,
                [projectId]: {
                  ...existingHistory,
                  isLoading,
                },
              },
            };
          },
          false,
          'promptHistory/setProjectLoading'
        );
      },

      setProjectInitialized: (projectId, isInitialized) => {
        set(
          (state) => {
            const existingHistory =
              state.historyByProject[projectId] || createEmptyProjectHistory();

            return {
              historyByProject: {
                ...state.historyByProject,
                [projectId]: {
                  ...existingHistory,
                  isInitialized,
                },
              },
            };
          },
          false,
          'promptHistory/setProjectInitialized'
        );
      },

      // ======================================================================
      // Pagination - Append more items
      // ======================================================================

      appendPrompts: (projectId, items, hasMore) => {
        set(
          (state) => {
            const existingHistory =
              state.historyByProject[projectId] || createEmptyProjectHistory();

            // Filter, sort, and convert new items
            const filteredItems = filterItemsByProject(items, projectId);
            const sortedItems = sortByDateDescending(filteredItems);
            const newPromptSteps = sortedItems.map(apiItemToPromptStep);

            // Merge with existing (avoiding duplicates)
            const existingIds = new Set(existingHistory.itemIds);
            const uniqueNewItems = newPromptSteps.filter((item) => !existingIds.has(item.id));

            if (uniqueNewItems.length === 0) {
              return {
                historyByProject: {
                  ...state.historyByProject,
                  [projectId]: {
                    ...existingHistory,
                    hasMore,
                  },
                },
              };
            }

            // Append to end (older items)
            const newItems = [...existingHistory.items, ...uniqueNewItems];
            const newItemIds = [...existingHistory.itemIds, ...uniqueNewItems.map((i) => i.id)];
            const newItemsById = {
              ...existingHistory.itemsById,
              ...Object.fromEntries(uniqueNewItems.map((i) => [i.id, i])),
            };

            // Recompute grouped history
            const grouped = computeGroupedHistory(newItems);

            return {
              historyByProject: {
                ...state.historyByProject,
                [projectId]: {
                  ...existingHistory,
                  items: newItems,
                  itemsById: newItemsById,
                  itemIds: newItemIds,
                  total: newItems.length,
                  hasMore,
                },
              },
              groupedByProject: {
                ...state.groupedByProject,
                [projectId]: grouped,
              },
            };
          },
          false,
          'promptHistory/appendPrompts'
        );
      },

      // ======================================================================
      // UI State Actions
      // ======================================================================

      toggleExpanded: (promptId) => {
        set(
          (state) => {
            const newExpandedIds = new Set(state.expandedItemIds);
            if (newExpandedIds.has(promptId)) {
              newExpandedIds.delete(promptId);
            } else {
              newExpandedIds.add(promptId);
            }
            return { expandedItemIds: newExpandedIds };
          },
          false,
          'promptHistory/toggleExpanded'
        );
      },

      isExpanded: (promptId) => {
        return get().expandedItemIds.has(promptId);
      },

      setActiveProject: (projectId) => {
        set({ activeProjectId: projectId }, false, 'promptHistory/setActiveProject');
      },

      // ======================================================================
      // Pre-computed Grouped History - O(1) access
      // ======================================================================

      getGroupedHistory: (projectId) => {
        const grouped = get().groupedByProject[projectId];
        return grouped || createEmptyGroupedHistory();
      },

      // ======================================================================
      // Cleanup
      // ======================================================================

      clearProjectHistory: (projectId) => {
        set(
          (state) => {
            const { [projectId]: removed, ...remainingHistory } = state.historyByProject;
            const { [projectId]: removedGrouped, ...remainingGrouped } = state.groupedByProject;

            return {
              historyByProject: remainingHistory,
              groupedByProject: remainingGrouped,
            };
          },
          false,
          'promptHistory/clearProjectHistory'
        );
      },

      reset: () => {
        set(initialState, false, 'promptHistory/reset');
      },
    })),
    { name: 'prompt-history-store' }
  )
);

// ============================================================================
// Selector Hooks for Isolated Re-renders
// ============================================================================

// ============================================================================
// Stable Empty References (prevents infinite re-render loops)
// ============================================================================

const EMPTY_ITEMS: PromptStep[] = [];
const EMPTY_GROUPED: GroupedPromptHistory = {
  today: [],
  yesterday: [],
  thisWeek: [],
  older: [],
};

// ============================================================================
// Selector Hooks for Isolated Re-renders
// ============================================================================

/**
 * Get project-specific loading state - isolated re-render
 */
export const useProjectLoading = (projectId: string | undefined) =>
  usePromptHistoryStore((state) =>
    projectId ? (state.historyByProject[projectId]?.isLoading ?? true) : true
  );

/**
 * Get project-specific initialization state - isolated re-render
 */
export const useProjectInitialized = (projectId: string | undefined) =>
  usePromptHistoryStore((state) =>
    projectId ? (state.historyByProject[projectId]?.isInitialized ?? false) : false
  );

/**
 * Get project items - isolated re-render
 * Uses stable empty reference to prevent infinite loops
 */
export const useProjectPromptItems = (projectId: string | undefined) =>
  usePromptHistoryStore((state) => {
    if (!projectId) return EMPTY_ITEMS;
    return state.historyByProject[projectId]?.items ?? EMPTY_ITEMS;
  });

/**
 * Get grouped history for a project - O(1) pre-computed access
 * Uses stable empty reference to prevent infinite loops
 */
export const useProjectGroupedHistory = (projectId: string | undefined) =>
  usePromptHistoryStore((state) => {
    if (!projectId) return EMPTY_GROUPED;
    return state.groupedByProject[projectId] ?? EMPTY_GROUPED;
  });

/**
 * Check if a specific prompt is expanded - isolated re-render
 */
export const usePromptExpanded = (promptId: string) =>
  usePromptHistoryStore((state) => state.expandedItemIds.has(promptId));

/**
 * Get store actions only (never causes re-render)
 * Uses getState() to access stable action references directly
 */
export const usePromptHistoryActions = () => {
  // Access actions directly from store - these are stable references
  const store = usePromptHistoryStore.getState();
  return {
    setProjectHistory: store.setProjectHistory,
    getProjectHistory: store.getProjectHistory,
    getPromptById: store.getPromptById,
    addPrompt: store.addPrompt,
    updatePrompt: store.updatePrompt,
    removePrompt: store.removePrompt,
    setProjectLoading: store.setProjectLoading,
    setProjectInitialized: store.setProjectInitialized,
    appendPrompts: store.appendPrompts,
    toggleExpanded: store.toggleExpanded,
    isExpanded: store.isExpanded,
    setActiveProject: store.setActiveProject,
    getGroupedHistory: store.getGroupedHistory,
    clearProjectHistory: store.clearProjectHistory,
    reset: store.reset,
  };
};
