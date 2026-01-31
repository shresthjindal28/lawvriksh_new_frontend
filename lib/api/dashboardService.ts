import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import { APIResponse } from '@/types/auth';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface LastReference {
  id: string;
  title: string;
  type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  tags: Tag[];
  annotation_count: number;
  notes_count: number;
}

export interface LastWorkspaceItem {
  id: string;
  title: string;
  access_type: string;
  metadata_info: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardAnalyticsResponse {
  documents_created_this_month: number;
  references_created_this_week: number;
  last_workspace_items: LastWorkspaceItem[];
  last_references: LastReference[];
}

class DashboardService {
  async getAnalytics(limit: number = 10): Promise<APIResponse<DashboardAnalyticsResponse>> {
    const params = new URLSearchParams({
      limit: String(limit),
    });

    return FetchClient.makeRequest<DashboardAnalyticsResponse>(
      `${API_ENDPOINTS.DASHBOARD_ANALYTICS}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }
}

export const dashboardService = new DashboardService();
