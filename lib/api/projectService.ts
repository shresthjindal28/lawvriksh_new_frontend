import { API_ENDPOINTS } from '@/lib/constants/routes';
import { CreateProjectRequest } from '@/lib/validators/project/project.schemas';
import { APIResponse } from '@/types';
import { ExploreItem, SearchLegalDocumentsResponse } from '@/types/explore';
import {
  CreateProjectResponse,
  ExportProjectRequest,
  ExportProjectResponse,
  GetProjectByIdResponse,
  Project,
  SearchProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
} from '@/types/project';
import { FetchClient } from './fetchClient';

class ProjectService {
  async createProject(
    data: CreateProjectRequest,
    options?: { signal?: AbortSignal }
  ): Promise<APIResponse<CreateProjectResponse>> {
    return FetchClient.makeRequest<CreateProjectResponse>(API_ENDPOINTS.CREATE_PROJECT, {
      method: 'POST',
      body: JSON.stringify(data),
      signal: options?.signal,
    });
  }

  async getProjectById(projectId: string): Promise<APIResponse<GetProjectByIdResponse>> {
    return FetchClient.makeRequest<GetProjectByIdResponse>(
      `${API_ENDPOINTS.GET_PROJECT_BY_ID}/${projectId}`,
      {
        method: 'GET',
      }
    );
  }

  async updateProject(
    projectId: string,
    data: UpdateProjectRequest
  ): Promise<APIResponse<UpdateProjectResponse>> {
    return FetchClient.makeRequest<UpdateProjectResponse>(
      `${API_ENDPOINTS.UPDATE_PROJECT}/${projectId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteProject(projectId: string, permanent: boolean = false): Promise<APIResponse> {
    const queryParam = permanent ? '?permanent=true' : '?permanent=false';
    return FetchClient.makeRequest(`${API_ENDPOINTS.DELETE_PROJECT}/${projectId}${queryParam}`, {
      method: 'DELETE',
    });
  }

  async getTrashedProjects(
    page: number = 1,
    limit: number = 10
  ): Promise<APIResponse<{ workspaces: any[] }>> {
    return FetchClient.makeRequest<{ workspaces: any[] }>(
      `${API_ENDPOINTS.GET_TRASHED_PROJECTS}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
      }
    );
  }

  async restoreProject(projectId: string): Promise<APIResponse> {
    return FetchClient.makeRequest(`${API_ENDPOINTS.RESTORE_PROJECT}/${projectId}`, {
      method: 'POST',
    });
  }

  async getExploreMoreItems(data: { query: string }): Promise<APIResponse<ExploreItem[]>> {
    return FetchClient.makeRequest<ExploreItem[]>(API_ENDPOINTS.GET_EXPLORE_MORE_ITEMS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async searchLegalDocuments(data: {
    query: string;
    user_content?: string;
    top_k?: number;
    user_id: string;
  }): Promise<SearchLegalDocumentsResponse> {
    const response = await FetchClient.makeRequest<SearchLegalDocumentsResponse>(
      API_ENDPOINTS.SEARCH_LEGAL_DOCUMENTS,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data!;
  }

  async exportProject(data: ExportProjectRequest): Promise<APIResponse<ExportProjectResponse>> {
    const response = await FetchClient.makeRequest<ExportProjectResponse>(
      API_ENDPOINTS.EXPORT_PROJECT,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (response.success && response.data) {
      const fileData = response.data.file_data;
      const fileName = response.data.file_name;

      const fileBytes = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0));
      const blob = new Blob([fileBytes], {
        type:
          data.export_format === 1
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    }

    return response;
  }

  async searchProjects(data: { query: string }): Promise<APIResponse<SearchProjectResponse>> {
    console.log('Making search API call with query:', data.query);
    const url = `${API_ENDPOINTS.SEARCH_PROJECTS}?query=${encodeURIComponent(data.query)}`;
    console.log('Search URL:', url);

    const response = await FetchClient.makeRequest<SearchProjectResponse>(url, {
      method: 'GET',
    });

    console.log('Raw API response:', response);
    return response;
  }

  async updateWorkspace(
    workspaceId: string,
    data: { title?: string; access_type?: string }
  ): Promise<APIResponse<string>> {
    return FetchClient.makeRequest<string>(`${API_ENDPOINTS.WORKSPACES}/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async addWorkspaceReference(
    workspaceId: string,
    data: {
      workspace_id: string;
      title: string;
      relevance_score: number;
      source: string;
      link: string;
      position?: number;
      rank?: number;
      summary?: string;
    }
  ): Promise<
    APIResponse<{
      reference: {
        id: string;
        workspace_id: string;
        title: string;
        relevance_score: number;
        source: string;
        link: string;
        position?: number;
        created_at: string;
        updated_at?: string;
      };
      success: boolean;
      message: string;
    }>
  > {
    return FetchClient.makeRequest(`${API_ENDPOINTS.ADD_WORKSPACE_REFERENCE(workspaceId)}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkspaceReference(
    workspaceId: string,
    referenceId: string
  ): Promise<
    APIResponse<{
      success: boolean;
      message: string;
    }>
  > {
    return FetchClient.makeRequest(
      `${API_ENDPOINTS.DELETE_WORKSPACE_REFERENCE(workspaceId, referenceId)}`,
      {
        method: 'DELETE',
      }
    );
  }
}

const projectService = new ProjectService();
export default projectService;
