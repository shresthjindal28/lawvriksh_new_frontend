import { useQuery } from '@tanstack/react-query';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from './keys';

export const useCollectionsQuery = (userId: string | undefined) => {
  return useQuery({
    queryKey: userId ? referenceKeys.collections(userId) : [],
    queryFn: async () => {
      if (!userId) throw new Error('User ID is required');
      const response = await referenceManagerService.listCollections(userId, {
        skip: 0,
        limit: 100,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch collections');
      }
      return response.data.collections ?? [];
    },
    enabled: !!userId,
  });
};
