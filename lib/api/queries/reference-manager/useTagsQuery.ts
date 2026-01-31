import { useQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';

export const useTagsQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: userId ? referenceKeys.tags(userId) : [],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await referenceManagerService.listTags(undefined, {
        skip: 0,
        limit: 100,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch tags');
      }
      return response.data.tags ?? [];
    },
    enabled: !!userId,
  });
};
