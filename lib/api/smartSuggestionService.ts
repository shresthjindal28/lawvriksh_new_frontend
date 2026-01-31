// Smart Suggestion API Service
import { FetchClient } from './fetchClient';

// Types for Smart Suggestion API
export interface ReferenceDoc {
  ref_id: string;
  title: string;
  summary: string;
  s3_key: string;
  metadata?: Record<string, string>;
}

export interface RankedDoc {
  doc: ReferenceDoc;
  relevance_score: number;
  semantic_score: number;
  keyword_score: number;
  rank: number;
}

export interface SuggestionSession {
  session_id: string;
  user_id: string;
  context_id: string;
  store_name: string;
  top_docs: RankedDoc[];
  allowed_file_ids: string[];
  created_at: string;
  last_accessed_at: string;
}

export interface StartSessionRequest {
  user_id: string;
  context_id: string; // project_id
  draft_text: string;
  reference_docs: ReferenceDoc[];
  force_refresh?: boolean;
}

export interface StartSessionResponse {
  status: string;
  session: SuggestionSession;
  warnings?: string[];
  errors?: string[];
}

export interface GenerateSuggestionRequest {
  session_id: string;
  draft_text: string;
  max_suggestions?: number;
}

export interface Suggestion {
  suggestion_id: string;
  variant: number; // 1=facts, 2=principles, 3=conclusion
  text: string;
  word_count: number;
}

export interface UsedSource {
  source_doc_file_id: string;
  source_doc_title: string;
  selected_score: number;
  mode: number; // 0=RAG, 1=Creative
}

export interface GenerateSuggestionResponse {
  status: string;
  used_source: UsedSource;
  suggestions: Suggestion[];
  errors?: string[];
}

export interface GetSessionResponse {
  status: string;
  session: SuggestionSession;
  errors?: string[];
}

export interface CloseSessionRequest {
  session_id: string;
  delete_user_files?: boolean;
}

export interface CloseSessionResponse {
  status: string;
  message: string;
  errors?: string[];
}

// API Endpoints
const SMART_SUGGESTION_ENDPOINTS = {
  START_SESSION: 'api/ai/smart-suggestion/start-session',
  GENERATE: 'api/ai/smart-suggestion/generate',
  GET_SESSION: 'api/ai/smart-suggestion/get-session',
  CLOSE_SESSION: 'api/ai/smart-suggestion/close-session',
} as const;

class SmartSuggestionService {
  /**
   * Start a new smart suggestion session.
   * Should be called when the user opens a project.
   */
  async startSession(request: StartSessionRequest): Promise<StartSessionResponse> {
    try {
      console.log('[SmartSuggestion] Starting session with request:', {
        user_id: request.user_id,
        context_id: request.context_id,
        draft_text_length: request.draft_text.length,
        reference_docs_count: request.reference_docs.length,
      });

      const response = await FetchClient.makeRequest<StartSessionResponse>(
        SMART_SUGGESTION_ENDPOINTS.START_SESSION,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to start smart suggestion session');
    } catch (error: any) {
      // Parse validation errors from FastAPI
      let errorMessage = 'Unknown error';
      if (error.body) {
        if (Array.isArray(error.body.detail)) {
          // FastAPI validation error format: [{loc: [...], msg: "...", type: "..."}]
          errorMessage = error.body.detail
            .map((e: any) => `${e.loc?.join('.')}: ${e.msg}`)
            .join('; ');
        } else if (error.body.detail) {
          errorMessage = error.body.detail;
        } else if (error.body.message) {
          errorMessage = error.body.message;
        } else {
          errorMessage = JSON.stringify(error.body);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('[SmartSuggestion] Start session error:', errorMessage);
      console.error('[SmartSuggestion] Full error:', error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Generate suggestions for the current draft text.
   * Should be called after user stops typing (debounced).
   */
  async generateSuggestions(
    request: GenerateSuggestionRequest
  ): Promise<GenerateSuggestionResponse> {
    try {
      const response = await FetchClient.makeRequest<GenerateSuggestionResponse>(
        SMART_SUGGESTION_ENDPOINTS.GENERATE,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );
      console.log('response for generateSuggestions', response);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to generate suggestions');
    } catch (error) {
      console.error('[SmartSuggestion] Generate error:', error);
      throw error;
    }
  }

  /**
   * Get information about an existing session.
   */
  async getSession(sessionId: string): Promise<GetSessionResponse> {
    try {
      const response = await FetchClient.makeRequest<GetSessionResponse>(
        SMART_SUGGESTION_ENDPOINTS.GET_SESSION,
        {
          method: 'POST',
          body: JSON.stringify({ session_id: sessionId }),
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to get session info');
    } catch (error) {
      console.error('[SmartSuggestion] Get session error:', error);
      throw error;
    }
  }

  /**
   * Close a smart suggestion session.
   * Should be called when user leaves the project.
   */
  async closeSession(request: CloseSessionRequest): Promise<CloseSessionResponse> {
    try {
      const response = await FetchClient.makeRequest<CloseSessionResponse>(
        SMART_SUGGESTION_ENDPOINTS.CLOSE_SESSION,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      if (response.success && response.data) {
        return response.data;
      }

      // Session close is not critical - don't throw
      return {
        status: 'ok',
        message: 'Session closed',
      };
    } catch (error) {
      console.error('[SmartSuggestion] Close session error:', error);
      // Don't throw - session cleanup is best-effort
      return {
        status: 'error',
        message: 'Failed to close session',
        errors: [String(error)],
      };
    }
  }
}

export const smartSuggestionService = new SmartSuggestionService();
