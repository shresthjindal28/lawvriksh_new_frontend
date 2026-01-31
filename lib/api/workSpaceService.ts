import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import { SubscriptionFeedback, WorkspaceProjectResponse } from '@/types/workspace';
import { APIResponse, ProfileData } from '@/types';
import { SettingsState } from '@/lib/contexts/SettingsContext';

class WorkspaceService {
  async getWorkspace(page: number, limit: number): Promise<APIResponse<WorkspaceProjectResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return FetchClient.makeRequest<WorkspaceProjectResponse>(
      API_ENDPOINTS.WORKSPACES_PROJECTS + `?${params}`,
      {
        method: 'GET',
      }
    );
  }

  async sendSubscriptionFeedback(data: SubscriptionFeedback): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.SEND_FEEDBACK, {
      method: 'PATCH',
      body: JSON.stringify({
        subscription_metadata: data,
      }),
    });
  }

  // Settings methods
  async updateSettings(data: SettingsState): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.UPDATE_SETTINGS, {
      method: 'PATCH',
      body: JSON.stringify({
        settings_metadata: data,
      }),
    });
  }

  async getSettings(): Promise<APIResponse<ProfileData>> {
    return FetchClient.makeRequest(API_ENDPOINTS.GET_SETTINGS, {
      method: 'GET',
    });
  }
}

export const workspaceService = new WorkspaceService();
