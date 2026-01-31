'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';
import { ReferenceItem } from '@/types/reference-manager';
import { buildReferenceListsFromFolderData } from '@/lib/utils/referenceInitialization';

const PAGE_SIZE = 50;

interface DocumentsPage {
  references: ReferenceItem[];
  trashedReferences: ReferenceItem[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

/**
 * Infinite query hook for fetching documents in a folder with pagination.
 * Supports infinite scroll and lazy loading.
 */
export const useDocumentsInfiniteQuery = (folderId: string | null, collectionId: string = '') => {
  return useInfiniteQuery<DocumentsPage>({
    queryKey: referenceKeys.documentsPaginated(folderId ?? ''),
    queryFn: async ({ pageParam }): Promise<DocumentsPage> => {
      if (!folderId) {
        return {
          references: [],
          trashedReferences: [],
          nextCursor: null,
          hasMore: false,
          totalCount: 0,
        };
      }

      // Note: If your API supports cursor-based pagination, pass pageParam as cursor
      // For now, we fetch all and simulate pagination client-side
      const response = await referenceManagerService.getFolderDocuments(folderId, true);

      if (!response.success || !response.data) {
        throw new Error(`Failed to fetch documents for folder ${folderId}`);
      }

      const refsData = (response.data as any).references || [];
      const { active, trashed } = buildReferenceListsFromFolderData({
        refsData,
        fallbackFolderId: folderId,
        collectionId,
      });

      // Simulate pagination (when API supports it, use real cursor)
      const cursor = pageParam as number | undefined;
      const startIndex = cursor ?? 0;
      const endIndex = startIndex + PAGE_SIZE;
      const paginatedActive = active.slice(startIndex, endIndex);
      const hasMore = endIndex < active.length;

      return {
        references: paginatedActive,
        trashedReferences: startIndex === 0 ? trashed : [], // Only include trashed on first page
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
    enabled: !!folderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Helper to flatten paginated results into a single array of references
 */
export const flattenDocumentPages = (
  pages: DocumentsPage[] | undefined
): { references: ReferenceItem[]; trashedReferences: ReferenceItem[] } => {
  if (!pages) {
    return { references: [], trashedReferences: [] };
  }

  const references: ReferenceItem[] = [];
  const trashedReferences: ReferenceItem[] = [];
  const seenIds = new Set<string>();

  pages.forEach((page) => {
    page.references.forEach((ref) => {
      if (!seenIds.has(ref.id)) {
        seenIds.add(ref.id);
        references.push(ref);
      }
    });
    page.trashedReferences.forEach((ref) => {
      if (!seenIds.has(ref.id)) {
        seenIds.add(ref.id);
        trashedReferences.push(ref);
      }
    });
  });

  return { references, trashedReferences };
};
