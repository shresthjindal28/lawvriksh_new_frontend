import { useCallback, useState } from 'react';
import projectService from '@/lib/api/projectService';
import { ExploreItem } from '@/types/explore';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ExploreItemsRequestSchema } from '@/lib/validators/explore/explore.schema';

export function ExploreMoreService() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ExploreItem[]>([]);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery) return;

      try {
        setLoading(true);
        setError(null);

        if (!profile || !profile.user_id) {
          setError('User not found');
          return;
        }

        const request = ExploreItemsRequestSchema.safeParse({
          query: searchQuery,
          user_id: profile.user_id,
        });

        if (!request.success) {
          setError(request.error.message);
          return;
        }

        let response = await projectService.searchLegalDocuments({
          query: searchQuery,
          user_id: profile.user_id,
        });

        if (response.success && response.results) {
          const mappedItems: ExploreItem[] = response.results.map((doc) => ({
            id: doc.case_number || doc.title,
            title: doc.title,
            url: doc.link,
            verdict: doc.verdict_info.verdict,
            description: doc.short_summary,
            fullContent: {
              introduction: doc.detailed_summary,
              sections: [
                {
                  title: 'Case Details',
                  content: `
                                Source: ${doc.source || 'N/A'}
                                Jurisdiction: ${doc.jurisdiction || 'N/A'}
                                Date: ${doc.date || 'N/A'}
                                Verdict: ${doc.verdict_info.verdict_summary || 'N/A'}
                              `,
                },
              ],
            },
          }));

          setItems(mappedItems);
          return;
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Validation or fetch error:', error);
          setError(error.message);
        } else {
          setError('Something went wrong');
        }
      } finally {
        setLoading(false);
      }
    },
    [profile]
  );

  return {
    handleSearch,
    loading,
    error,
    items,
  };
}
