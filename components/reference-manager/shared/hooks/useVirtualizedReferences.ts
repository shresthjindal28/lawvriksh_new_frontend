'use client';

import { useMemo, useCallback } from 'react';
import { useReferenceStore } from '@/store/zustand/useReferenceStore';
import {
  useDocumentsInfiniteQuery,
  flattenDocumentPages,
} from '@/lib/api/queries/reference-manager/useDocumentsInfiniteQuery';
import {
  useUnsignedInfiniteQuery,
  flattenUnsignedPages,
} from '@/lib/api/queries/reference-manager/useUnsignedInfiniteQuery';

interface UseVirtualizedReferencesOptions {
  selectedFolderId: string | null;
  selectedCollectionId: string | null;
}

/**
 * Hook for managing virtualized references with infinite scroll support.
 *
 * Features:
 * - O(1) lookups via referencesById
 * - Infinite scroll pagination
 * - Automatic data synchronization with Zustand store
 * - Memory-efficient for large datasets
 *
 * Usage:
 * ```tsx
 * const { referenceIds, hasNextPage, fetchNextPage, isFetchingNextPage } = useVirtualizedReferences({
 *   selectedFolderId,
 *   selectedCollectionId,
 * });
 *
 * return (
 *   <VirtualizedReferenceTable
 *     referenceIds={referenceIds}
 *     hasNextPage={hasNextPage}
 *     onLoadMore={fetchNextPage}
 *     isFetchingNextPage={isFetchingNextPage}
 *   />
 * );
 * ```
 */
export function useVirtualizedReferences({
  selectedFolderId,
  selectedCollectionId,
}: UseVirtualizedReferencesOptions) {
  // Get store state and actions
  const referenceIds = useReferenceStore((state) => state.referenceIds);
  const referencesById = useReferenceStore((state) => state.referencesById);
  const appendReferences = useReferenceStore((state) => state.appendReferences);
  const setPaginationState = useReferenceStore((state) => state.setPaginationState);

  // Determine if we should use unsigned query
  const isUnsignedView = selectedCollectionId === 'unsigned';

  // Folder documents infinite query
  const folderQuery = useDocumentsInfiniteQuery(
    isUnsignedView ? null : selectedFolderId,
    selectedCollectionId || ''
  );

  // Unsigned references infinite query
  const unsignedQuery = useUnsignedInfiniteQuery(isUnsignedView);

  // Select the active query based on view
  const activeQuery = isUnsignedView ? unsignedQuery : folderQuery;

  // Flatten paginated data
  const flattenedData = useMemo(() => {
    if (isUnsignedView) {
      return {
        references: flattenUnsignedPages(unsignedQuery.data?.pages),
        trashedReferences: [],
      };
    }
    return flattenDocumentPages(folderQuery.data?.pages);
  }, [isUnsignedView, folderQuery.data?.pages, unsignedQuery.data?.pages]);

  // Sync with store when data changes
  const syncToStore = useCallback(() => {
    if (flattenedData.references.length > 0) {
      appendReferences(flattenedData.references);
    }
    setPaginationState({
      hasNextPage: activeQuery.hasNextPage ?? false,
      isFetchingNextPage: activeQuery.isFetchingNextPage,
    });
  }, [
    flattenedData.references,
    activeQuery.hasNextPage,
    activeQuery.isFetchingNextPage,
    appendReferences,
    setPaginationState,
  ]);

  // Get reference IDs for the current view
  const filteredReferenceIds = useMemo(() => {
    // Filter by folder/collection
    return referenceIds.filter((id) => {
      const ref = referencesById[id];
      if (!ref) return false;

      if (isUnsignedView) {
        return !ref.folderId;
      }

      if (selectedFolderId) {
        return ref.folderId === selectedFolderId;
      }

      return true;
    });
  }, [referenceIds, referencesById, isUnsignedView, selectedFolderId]);

  return {
    // Reference data
    referenceIds: filteredReferenceIds,
    referencesById,

    // Pagination state
    hasNextPage: activeQuery.hasNextPage ?? false,
    isFetchingNextPage: activeQuery.isFetchingNextPage,

    // Actions
    fetchNextPage: activeQuery.fetchNextPage,
    refetch: activeQuery.refetch,
    syncToStore,

    // Loading states
    isLoading: activeQuery.isLoading,
    isError: activeQuery.isError,
    error: activeQuery.error,

    // Query data (for direct access if needed)
    data: flattenedData,
  };
}

export default useVirtualizedReferences;
