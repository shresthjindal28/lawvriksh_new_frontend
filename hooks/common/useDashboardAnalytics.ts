import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/lib/api/dashboardService';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  analytics: (limit: number) => [...dashboardKeys.all, 'analytics', limit] as const,
};

export const useDashboardAnalytics = (limit = 10) => {
  return useQuery({
    queryKey: dashboardKeys.analytics(limit),
    queryFn: async () => {
      const response = await dashboardService.getAnalytics(limit);

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch dashboard analytics');
      }

      const data = response.data;

      // Transform references to match the UI component requirements
      const references = (data.last_references || []).map((ref: any) => {
        // Calculate relative time
        const createdAtRaw = ref.created_at;
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

        // Determine status based on tags or other logic if needed
        // For now, we can map tags to a status string if applicable or keep it simple
        const status = '';
        const statusColor = 'dashboard-reference-status-default';

        return {
          id: ref.id,
          documentId: ref.id, // Using ref ID as doc ID for now as structure differs
          title: ref.title,
          author: ref.created_by, // Using created_by as author
          uploaded,
          annotations: ref.annotation_count || 0,
          notes: ref.notes_count || 0,
          status,
          statusColor,
          tags: ref.tags || [],
        };
      });

      return {
        stats: {
          documentsCreatedThisMonth: data.documents_created_this_month || 0,
          referencesCreatedThisWeek: data.references_created_this_week || 0,
        },
        recentReferences: references,
        raw: data,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
