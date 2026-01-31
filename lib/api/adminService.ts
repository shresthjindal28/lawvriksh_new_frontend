import { API_ENDPOINTS } from '@/lib/constants/routes';
import type { CreatorApplication } from '@/types/creator';
import {
  AddUserRequest,
  AdminDashboard,
  ApplicationsResponse,
  ApplicationStatus,
  AuditLogsResponseData,
  CleanupResponse,
  GetUserByIdResponse,
  RestoreUserRequest,
  RestoreUserResponse,
  ReviewApplicationRequest,
  SuspendUserRequest,
  SuspendUserResponse,
  SystemCleanupResponse,
  SystemHealth,
  SystemStats,
  UpdateUserRole,
  UpdateUserScore,
  UserActionRequest,
  UserActionResponse,
  UserRole,
  UsersResponse,
} from '@/types/admin';
import { APIResponse } from '@/types/auth';
import { FetchClient } from './fetchClient';
import { CreatorApplicationsResponseData } from '@/types/application.admin';
import {
  AdminReviewApplicationRequestSchema,
  UserActionRequestSchema,
} from '@/lib/validators/admin/requests';

interface GetApplicationsParams {
  status?: ApplicationStatus;
  skip?: number;
  limit?: number;
  search?: string;
  sort_by?: 'applied_at' | 'user_risk_score' | 'spam_analysis.spam_score';
  sort_order?: 'asc' | 'desc';
}

interface GetAuditLogsParams {
  limit?: number;
  offset?: number;
  search_term?: string;
  user_id?: string;
  admin_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
}

interface ExportAuditLogsParams {
  format?: string;
  days?: number;
}

interface CleanupParams {
  force?: boolean;
}

class AdminService {
  // Get system statistics
  async getStats(): Promise<APIResponse<SystemStats>> {
    return FetchClient.makeRequest<SystemStats>(API_ENDPOINTS.ADMIN_STATS, {
      method: 'GET',
    });
  }

  //dashboard data
  async getAdminDashboard(): Promise<APIResponse<{ dashboard: AdminDashboard }>> {
    return FetchClient.makeRequest<{ dashboard: AdminDashboard }>(API_ENDPOINTS.ADMIN_DASHBOARD, {
      method: 'GET',
    });
  }

  // Get creator applications with filtering
  getCreatorApplications(
    params: GetApplicationsParams
  ): Promise<APIResponse<CreatorApplicationsResponseData>> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.skip) query.append('skip', params.skip.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.sort_order) query.append('sort_order', params.sort_order);

    const url = `${API_ENDPOINTS.ADMIN_APPLICATIONS}?${query.toString()}`;

    return FetchClient.makeRequest<CreatorApplicationsResponseData>(url, { method: 'GET' });
  }

  // Get specific application by ID
  getCreatorApplicationById(id: string): Promise<APIResponse<{ application: CreatorApplication }>> {
    const url = `${API_ENDPOINTS.ADMIN_APPLICATIONS}/${id}`;
    return FetchClient.makeRequest<{ application: CreatorApplication }>(url, { method: 'GET' });
  }

  // Review application (approve/reject)
  reviewCreatorApplication(
    id: string,
    reviewData: ReviewApplicationRequest
  ): Promise<APIResponse<{ application: CreatorApplication }>> {
    const validated = AdminReviewApplicationRequestSchema.parse(reviewData);
    const url = `${API_ENDPOINTS.ADMIN_APPLICATIONS}/${id}/review`;
    return FetchClient.makeRequest<{ application: CreatorApplication }>(url, {
      method: 'PUT',
      body: JSON.stringify(validated),
    });
  }

  // Get users with filtering
  async getUsers(
    skip = 0,
    limit = 50,
    role?: UserRole,
    search?: string
  ): Promise<APIResponse<UsersResponse>> {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    if (role) {
      params.append('role', role);
    }

    if (search) {
      params.append('search', search);
    }

    return FetchClient.makeRequest<UsersResponse>(
      `${API_ENDPOINTS.GET_USERS}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  // Add user
  async addUser(userData: AddUserRequest): Promise<APIResponse> {
    return FetchClient.makeRequest(`${API_ENDPOINTS.ADD_USER}`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Update user
  async updateUser(userId: string, userData: AddUserRequest): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.EDIT_USER(userId), {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async getUserById(userId: string): Promise<APIResponse<GetUserByIdResponse>> {
    return FetchClient.makeRequest<GetUserByIdResponse>(`${API_ENDPOINTS.GET_USERS}/${userId}`, {
      method: 'GET',
    });
  }

  //Common method for user action
  async userAction(data: UserActionRequest): Promise<APIResponse<UserActionResponse>> {
    const validated = UserActionRequestSchema.parse(data);

    return FetchClient.makeRequest<UserActionResponse>(
      `${API_ENDPOINTS.USER_ACTION}/${validated.user_id}/action`,
      {
        method: 'POST',
        body: JSON.stringify(validated),
      }
    );
  }

  // Suspend user
  async suspendUser(data: SuspendUserRequest): Promise<APIResponse<SuspendUserResponse>> {
    return FetchClient.makeRequest<SuspendUserResponse>(
      `${API_ENDPOINTS.GET_USERS}/${data.user_id}/suspend`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Restore user (admin only)
  async restoreUser(data: RestoreUserRequest): Promise<APIResponse<RestoreUserResponse>> {
    return FetchClient.makeRequest<RestoreUserResponse>(
      `${API_ENDPOINTS.GET_USERS}/${data.user_id}/restore`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  //get audit logs
  async getAuditLogs(params: GetAuditLogsParams): Promise<APIResponse<AuditLogsResponseData>> {
    const endpoint = API_ENDPOINTS.AUDIT_LOGS;

    // Build query parameters dynamically
    const queryParams = new URLSearchParams();

    // Pagination parameters
    if (params.limit !== undefined) queryParams.append('limit', String(params.limit));
    if (params.offset !== undefined) queryParams.append('offset', String(params.offset));
    if (params.skip !== undefined) queryParams.append('skip', String(params.skip));

    // Filter parameters - only add if they have values
    if (params.search_term?.trim()) queryParams.append('search_term', params.search_term.trim());
    if (params.user_id?.trim()) queryParams.append('user_id', params.user_id.trim());
    if (params.admin_id?.trim()) queryParams.append('admin_id', params.admin_id.trim());
    if (params.action?.trim()) queryParams.append('action', params.action.trim());
    if (params.start_date?.trim()) queryParams.append('start_date', params.start_date.trim());
    if (params.end_date?.trim()) queryParams.append('end_date', params.end_date.trim());

    const url = `${endpoint}?${queryParams.toString()}`;
    console.log('Audit logs URL:', url); // For debugging

    return FetchClient.makeRequest<AuditLogsResponseData>(url, {
      method: 'GET',
    });
  }

  //export audit logs
  async exportAuditLogs(params: ExportAuditLogsParams): Promise<APIResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', params.format || 'csv');
    queryParams.append('days', params.days?.toString() || '7');

    const url = `${API_ENDPOINTS.AUDIT_LOGS_EXPORT}?${queryParams.toString()}`;

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = params.format || 'csv';
    const filename = `audit-logs-${timestamp}.${extension}`;

    return FetchClient.makeFileRequest(url, { method: 'GET' }, filename);
  }

  //update user score
  async updateUserScore(data: UpdateUserScore): Promise<APIResponse> {
    return FetchClient.makeRequest(`${API_ENDPOINTS.UPDATE_USER_SCORE}/${data.user_id}/scores`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  //update user role
  async updateUserRole(data: UpdateUserRole): Promise<APIResponse> {
    const { user_id, ...queryParams } = data;

    const params = new URLSearchParams();
    params.append('new_role', queryParams.new_role);
    params.append('reason', queryParams.reason);
    const url = `${API_ENDPOINTS.UPDATE_USER_ROLE}/${user_id}/role?${params.toString()}`;
    return FetchClient.makeRequest(url, {
      method: 'PUT',
    });
  }

  //system health
  async getSystemHealth(): Promise<APIResponse<SystemHealth>> {
    return FetchClient.makeRequest<SystemHealth>(API_ENDPOINTS.SYSTEM_HEALTH_CHECK, {
      method: 'GET',
    });
  }

  //system cleanup
  async systemCleanup(params: CleanupParams): Promise<APIResponse<SystemCleanupResponse>> {
    const queryParams = new URLSearchParams();
    queryParams.append('force', params.force?.toString() || 'false');

    const url = `${API_ENDPOINTS.SYSTEM_CLEANUP}?${queryParams.toString()}`;
    return FetchClient.makeRequest<SystemCleanupResponse>(url, {
      method: 'POST',
    });
  }
}

export const adminService = new AdminService();
