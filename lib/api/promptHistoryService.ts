import { API_ENDPOINTS } from '@/lib/constants/routes';
import { FetchClient } from './fetchClient';

/**
 * Request payload for creating a prompt history entry
 */
export interface CreatePromptHistoryRequest {
  /** Type of prompt (e.g., 'ai-writing', 'legal-analysis', 'custom', 'improve', 'paraphrase', 'translate') */
  prompt_type: string;
  /** The prompt text sent to the AI */
  prompt_text: string;
  /** The AI's response to the prompt (optional) */
  prompt_response?: string;
  /** Workspace ID to associate this prompt with (optional) */
  workspace_id?: string;
  /** Project ID to associate this prompt with (optional) */
  project_id?: string;
  /** Additional metadata as JSON string (optional) */
  metadata?: string;
}

/**
 * Response from creating a prompt history entry
 */
export interface CreatePromptHistoryResponse {
  success: boolean;
  id?: string;
  message?: string;
}

/**
 * Single prompt history item
 */
export interface PromptHistoryItem {
  id: string;
  prompt_type: string;
  prompt_text: string;
  prompt_response?: string;
  created_at: string;
  metadata?: string;
  workspace_id?: string;
  project_id?: string;
}

/**
 * Query parameters for listing prompt histories
 */
export interface ListPromptHistoryParams {
  page?: number;
  page_size?: number;
  prompt_type?: string;
  workspace_id?: string;
  project_id?: string;
}

/**
 * Response from listing prompt histories (API response structure)
 */
export interface ListPromptHistoryApiResponse {
  success: boolean;
  data: {
    prompt_histories: PromptHistoryItem[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

/**
 * Normalized response for internal use
 */
export interface ListPromptHistoryResponse {
  success: boolean;
  items: PromptHistoryItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

class PromptHistoryServiceClass {
  /**
   * Create a prompt history entry to track AI interactions
   * @param data - The prompt history data to record
   * @returns Promise with the creation response
   */
  async createPromptHistory(
    data: CreatePromptHistoryRequest
  ): Promise<CreatePromptHistoryResponse> {
    try {
      const res = await FetchClient.makeRequest<CreatePromptHistoryResponse>(
        API_ENDPOINTS.PROMPT_HISTORY,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      console.log('[PromptHistoryService] Successfully created prompt history:', res.data);
      return res.data!;
    } catch (error) {
      console.error('[PromptHistoryService] Failed to create prompt history:', error);
      // Don't throw - we don't want prompt history failures to break the main flow
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * List prompt histories with pagination and optional filtering
   * @param params - Query parameters for pagination and filtering
   * @returns Promise with paginated prompt history list
   */
  async listPromptHistory(
    params: ListPromptHistoryParams = {}
  ): Promise<ListPromptHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.page_size) queryParams.set('page_size', params.page_size.toString());
      if (params.prompt_type) queryParams.set('prompt_type', params.prompt_type);
      if (params.workspace_id) queryParams.set('workspace_id', params.workspace_id);

      const url = queryParams.toString()
        ? `${API_ENDPOINTS.PROMPT_HISTORY}?${queryParams.toString()}`
        : API_ENDPOINTS.PROMPT_HISTORY;

      const res = await FetchClient.makeRequest<ListPromptHistoryApiResponse>(url, {
        method: 'GET',
      });
      console.log('[PromptHistoryService] Raw API response:', res);

      // Normalize the response structure
      // The FetchClient returns the raw API response when it has a 'success' field
      // So res.success is the success flag and res.data contains the actual data
      const apiResponse = res as unknown as ListPromptHistoryApiResponse;
      const historyData = apiResponse?.data;
      const normalized: ListPromptHistoryResponse = {
        success: apiResponse?.success ?? false,
        items: historyData?.prompt_histories ?? [],
        total: historyData?.total_count ?? 0,
        page: historyData?.page ?? 1,
        page_size: historyData?.page_size ?? 10,
        total_pages: historyData?.total_pages ?? 0,
      };

      console.log('[PromptHistoryService] Normalized response:', normalized);
      return normalized;
    } catch (error) {
      console.error('[PromptHistoryService] Failed to fetch prompt history:', error);
      return {
        success: false,
        items: [],
        total: 0,
        page: 1,
        page_size: 10,
        total_pages: 0,
      };
    }
  }

  /**
   * Helper method to log a prompt and its response
   * @param promptType - Type of prompt
   * @param promptText - The prompt text
   * @param promptResponse - The AI response (optional)
   * @param metadata - Additional metadata object (optional)
   * @param projectId - Project ID to associate with this prompt (optional)
   */
  async logPrompt(
    promptType: string,
    promptText: string,
    promptResponse?: string,
    metadata?: Record<string, unknown>,
    projectId?: string
  ): Promise<void> {
    // Merge projectId into metadata if provided
    const enrichedMetadata = projectId ? { ...metadata, projectId } : metadata;

    await this.createPromptHistory({
      prompt_type: promptType,
      prompt_text: promptText,
      prompt_response: promptResponse,
      workspace_id: projectId, // Also set workspace_id for consistency
      metadata: enrichedMetadata ? JSON.stringify(enrichedMetadata) : undefined,
    });
  }
}

export const PromptHistoryService = new PromptHistoryServiceClass();
