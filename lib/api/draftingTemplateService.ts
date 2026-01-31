import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import type { APIResponse } from '@/types/auth';
import {
  ListTemplatesParams,
  ListTemplatesResponse,
  InitTemplateUploadRequest,
  InitTemplateUploadResponse,
  CompleteTemplateUploadRequest,
  TemplateResponse,
} from '@/types/draftingTemplate';

class DraftingTemplateService {
  async listTemplates(params?: ListTemplatesParams): Promise<APIResponse<ListTemplatesResponse>> {
    // Build query string manually to ensure correct parameter order
    const queryParts: string[] = [];

    // Always include all parameters in the correct order
    // Filter parameters (string types) - in order: category, language, doc_type, title
    if (params?.category) {
      queryParts.push(`category=${encodeURIComponent(params.category)}`);
    }
    if (params?.language) {
      queryParts.push(`language=${encodeURIComponent(params.language)}`);
    }
    if (params?.doc_type) {
      queryParts.push(`doc_type=${encodeURIComponent(params.doc_type)}`);
    }
    if (params?.title) {
      queryParts.push(`title=${encodeURIComponent(params.title)}`);
    }

    // Tags parameter - comma-separated string
    // API expects tags as comma-separated string, not multiple query parameters
    if (params?.tags && params.tags.length > 0) {
      queryParts.push(`tags=${encodeURIComponent(params.tags.join(','))}`);
    }

    // Pagination parameters (integer types with constraints) - ALWAYS include these
    // page: integer, minimum: 1 (default: 1)
    const page = params?.page !== undefined && params.page >= 1 ? params.page : 1;
    queryParts.push(`page=${page}`);

    // limit: integer, minimum: 1, maximum: 100 (default: 10)
    const limit =
      params?.limit !== undefined && params.limit >= 1 && params.limit <= 100 ? params.limit : 10;
    queryParts.push(`limit=${limit}`);

    // user_id (optional, can be added at the end if needed)
    if (params?.user_id) {
      queryParts.push(`user_id=${encodeURIComponent(params.user_id)}`);
    }

    const queryString = queryParts.join('&');
    const url = `${API_ENDPOINTS.LIST_TEMPLATES}?${queryString}`;

    return FetchClient.makeRequest<ListTemplatesResponse>(url, {
      method: 'GET',
    });
  }

  async initUpload(
    data: InitTemplateUploadRequest
  ): Promise<APIResponse<InitTemplateUploadResponse>> {
    return FetchClient.makeRequest<InitTemplateUploadResponse>(API_ENDPOINTS.INIT_TEMPLATE_UPLOAD, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeUpload(
    data: CompleteTemplateUploadRequest
  ): Promise<APIResponse<TemplateResponse>> {
    return FetchClient.makeRequest<TemplateResponse>(API_ENDPOINTS.COMPLETE_TEMPLATE_UPLOAD, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTemplate(
    templateId: string,
    options?: Omit<RequestInit, 'method'>
  ): Promise<APIResponse<TemplateResponse>> {
    return FetchClient.makeRequest<TemplateResponse>(API_ENDPOINTS.GET_TEMPLATE(templateId), {
      method: 'GET',
      ...options,
    });
  }

  /**
   * Search templates with AND logic across all properties
   * The search query will be applied to: category, language, doc_type, tags, and title
   * All properties are combined with AND operator (multiple query params = AND logic)
   * Example: /templates/search/?category=Legal&tags=test means category=Legal AND tags=test
   */
  async searchTemplates(
    searchQuery: string,
    params?: { page?: number; limit?: number }
  ): Promise<APIResponse<ListTemplatesResponse>> {
    console.log('[DraftingTemplateService] searchTemplates called', {
      searchQuery,
      params,
      timestamp: new Date().toISOString(),
    });

    // Trim and validate search query
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      console.warn(
        '[DraftingTemplateService] Empty search query provided, returning empty results'
      );
      return {
        success: true,
        message: 'Empty search query',
        error: '',
        data: {
          success: true,
          templates: [],
          total_count: 0,
          page: params?.page || 1,
          limit: params?.limit || 20,
        },
      };
    }

    // Build query string with search query applied to ALL properties (AND logic)
    // Multiple query parameters are combined with AND operator by the backend
    const queryParts: string[] = [];

    // Apply search query to all properties with AND operator
    // All properties receive the same search query value
    // Backend will combine them with AND: category=query AND language=query AND doc_type=query AND tags=query AND title=query
    queryParts.push(`category=${encodeURIComponent(trimmedQuery)}`);
    queryParts.push(`language=${encodeURIComponent(trimmedQuery)}`);
    queryParts.push(`doc_type=${encodeURIComponent(trimmedQuery)}`);
    queryParts.push(`title=${encodeURIComponent(trimmedQuery)}`);

    // For tags, if the query contains commas, split them; otherwise use the whole query
    // The API expects comma-separated tags
    const tagsValue = trimmedQuery.includes(',') ? trimmedQuery : trimmedQuery; // Send as-is, backend will handle comma-separated parsing
    queryParts.push(`tags=${encodeURIComponent(tagsValue)}`);

    // Pagination parameters
    const page = params?.page !== undefined && params.page >= 1 ? params.page : 1;
    queryParts.push(`page=${page}`);

    const limit =
      params?.limit !== undefined && params.limit >= 1 && params.limit <= 100 ? params.limit : 20;
    queryParts.push(`limit=${limit}`);

    const queryString = queryParts.join('&');
    const url = `${API_ENDPOINTS.SEARCH_TEMPLATES}?${queryString}`;

    console.log('[DraftingTemplateService] Search request URL:', url);
    console.log('[DraftingTemplateService] Search parameters (AND logic):', {
      category: trimmedQuery,
      language: trimmedQuery,
      doc_type: trimmedQuery,
      title: trimmedQuery,
      tags: tagsValue,
      page,
      limit,
      note: 'All properties are combined with AND operator - template must match ALL conditions',
    });

    try {
      const response = await FetchClient.makeRequest<ListTemplatesResponse>(url, {
        method: 'GET',
      });

      console.log('[DraftingTemplateService] Search response received:', {
        success: response.success,
        templatesCount: response.data?.templates?.length || 0,
        totalCount: response.data?.total_count || 0,
        page: response.data?.page || page,
        limit: response.data?.limit || limit,
        timestamp: new Date().toISOString(),
      });

      if (response.data?.templates) {
        console.log(
          '[DraftingTemplateService] Sample templates:',
          response.data.templates.slice(0, 3)
        );
      }

      return response;
    } catch (error) {
      console.error('[DraftingTemplateService] Search error:', {
        error,
        searchQuery: trimmedQuery,
        url,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}

export const draftingTemplateService = new DraftingTemplateService();
