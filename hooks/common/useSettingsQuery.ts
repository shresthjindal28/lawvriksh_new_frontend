import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService } from '@/lib/api/workSpaceService';
import { SettingsState } from '@/lib/contexts/SettingsContext';
import { mergeSettings, DEFAULT_SETTINGS } from '@/lib/utils/settingsUtils';

export const SETTINGS_QUERY_KEY = ['settings'];

export function useSettingsQuery() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await workspaceService.getSettings();
      if (response.success && response.data) {
        return mergeSettings(response.data.profile?.settings_metadata);
      }
      return DEFAULT_SETTINGS;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: DEFAULT_SETTINGS,
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSettings: SettingsState) => {
      const response = await workspaceService.updateSettings(newSettings);
      if (!response.success) {
        throw new Error('Failed to update settings');
      }
      return response;
    },
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_QUERY_KEY });
      const previousSettings = queryClient.getQueryData<SettingsState>(SETTINGS_QUERY_KEY);
      queryClient.setQueryData(SETTINGS_QUERY_KEY, newSettings);
      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(SETTINGS_QUERY_KEY, context.previousSettings);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
}
