'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';
import { ReferenceItem } from '@/types/reference-manager';
import { buildReferenceListsFromFolderData } from '@/lib/utils/referenceInitialization';

const PAGE_SIZE = 50;

interface UnsignedPage {
  references: ReferenceItem[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

/**
 * Infinite query hook for fetching unsigned references with pagination.
 * Supports infinite scroll and lazy loading.
 */
export const useUnsignedInfiniteQuery = (enabled: boolean = true) => {
  return useInfiniteQuery<UnsignedPage>({
    queryKey: referenceKeys.unsignedPaginated(),
    queryFn: async ({ pageParam }): Promise<UnsignedPage> => {
      // Note: If your API supports cursor-based pagination, pass pageParam as cursor
      const response = await referenceManagerService.getUnsignedReferences();

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch unsigned references');
      }

      const refsData = (response.data as any).references || [];
      const { active } = buildReferenceListsFromFolderData({
        refsData,
        fallbackFolderId: undefined as unknown as string,
        collectionId: '',
      });

      // Simulate pagination (when API supports it, use real cursor)
      const cursor = pageParam as number | undefined;
      const startIndex = cursor ?? 0;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedActive = active.slice(startIndex, endIndex);
      const hasMore = endIndex < active.length;

      return {
        references: paginatedActive,
        nextCursor: hasMore ? String(endIndex) : null,
        hasMore,
        totalCount: active.length,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.nextCursor ? parseInt(lastPage.nextCursor, 10) : undefined;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Helper to flatten paginated unsigned results into a single array
 */
export const flattenUnsignedPages = (pages: UnsignedPage[] | undefined): ReferenceItem[] => {
  if (!pages) {
    return [];
  }

  const references: ReferenceItem[] = [];
  const seenIds = new Set<string>();

  pages.forEach((page) => {
    page.references.forEach((ref) => {
      if (!seenIds.has(ref.id)) {
        seenIds.add(ref.id);
        references.push(ref);
      }
    });
  });

  return references;
};
