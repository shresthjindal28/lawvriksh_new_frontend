import { useQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';

export const useRecentReferencesQuery = (limit = 5) => {
  return useQuery({
    queryKey: referenceKeys.recentReferences(limit),
    queryFn: async () => {
      const response = await referenceManagerService.listReferences({
        limit,
        skip: 0,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch recent references');
      }

      const referencesWithDates = Array.isArray(response.data.references)
        ? [...response.data.references]
        : [];

      // Ensure newest references come first, based on created_at
      referencesWithDates.sort((a: any, b: any) => {
        const aTime = new Date(a.created_at ?? a.createdAt ?? 0).getTime();
        const bTime = new Date(b.created_at ?? b.createdAt ?? 0).getTime();

        const aSafe = Number.isNaN(aTime) ? 0 : aTime;
        const bSafe = Number.isNaN(bTime) ? 0 : bTime;

        return bSafe - aSafe;
      });

      const references = referencesWithDates.map((ref: any) => {
        // Format uploaded date with safe fallbacks
        const createdAtRaw = ref.created_at ?? ref.createdAt ?? null;
        let uploaded = 'Recently added';

        if (createdAtRaw) {
          const uploadedDate = new Date(createdAtRaw);
          const uploadedTime = uploadedDate.getTime();

          if (!Number.isNaN(uploadedTime)) {
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - uploadedTime);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
              const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
              if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                uploaded = diffMinutes <= 1 ? 'Just now' : `${diffMinutes} mins ago`;
              } else {
                uploaded = `${diffHours} hours ago`;
              }
            } else if (diffDays === 1) {
              uploaded = '1 day ago';
            } else {
              uploaded = `${diffDays} days ago`;
            }
          }
        }

        // Extract title from documents array (API structure)
        const firstDoc = ref.documents?.[0];
        const title = firstDoc?.title || ref.title || 'Untitled reference';

        // Parse metadata from document
        let docMetadata: Record<string, any> = {};
        if (firstDoc?.metadata) {
          try {
            docMetadata =
              typeof firstDoc.metadata === 'string'
                ? JSON.parse(firstDoc.metadata)
                : firstDoc.metadata;
          } catch (e) {
            docMetadata = {};
          }
        }

        const author =
          docMetadata?.author ||
          docMetadata?.Author ||
          docMetadata?.publisher ||
          docMetadata?.Publisher ||
          ref.metadata?.author ||
          ref.metadata?.publisher ||
          'Library';

        const status = ref.metadata?.status || '';
        let statusColor = 'dashboard-reference-status-default';

        if (status === 'Important') {
          statusColor = 'dashboard-reference-status-important';
        } else if (status === 'Completed') {
          statusColor = 'dashboard-reference-status-completed';
        }

        const annotationCount = ref.metadata?.annotation_count || 0;
        const noteCount = ref.metadata?.note_count || 0;

        return {
          id: ref.id,
          documentId: firstDoc?.id || ref.id,
          title,
          author,
          uploaded,
          annotations: annotationCount,
          notes: noteCount,
          status,
          statusColor,
          tags: [],
        };
      });

      return {
        references,
        totalCount: response.data.total_count,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
