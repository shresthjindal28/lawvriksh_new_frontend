import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';

export interface DraftDocumentInquiryRequest {
  user_prompt: string;
  doc_type_hint?: string;
  language?: string;
  user_profile?: {
    profession?: string;
    default_state?: string;
    preferred_language?: string;
  };
}

export interface DraftDocumentInquiryResponse {
  success: boolean;
  message: string;
  clarification_questions: string[];
  detected_doc_type: string;
  detected_category: string;
  timestamp: string;
  request_id: string;
}

export interface DraftDocumentRequest {
  user_prompt: string;
  user_id: string;
  doc_type_hint?: string;
  language?: string;
  deep_drafting?: boolean;
  clarification_answers?: Record<string, string>;
  skip_clarification?: boolean;
  s3_key?: string | null;
  metadata?: {
    request_id?: string;
    client_name?: string;
    client_version?: string;
    timestamp?: string;
  };
}

export interface DraftDocumentResponse {
  success: boolean;
  template_json: string;
  html_content: string;
  blocks_count: number;
  variables_count: number;
  variables: Record<string, string>;
  message: string;
  timestamp: string;
  pipeline_metrics: {
    query_optimization_ms: number;
    retrieval_ms: number;
    strategy_ms: number;
    generation_ms: number;
    validation_ms: number;
    extraction_ms: number;
    conversion_ms: number;
    total_ms: number;
    retrieval_path: string;
    retrieval_confidence: number;
    legal_framework_ms?: number;
    legal_framework_source?: string;
  };
  doc_metadata: {
    doc_type: string;
    category: string;
    risk_score: number;
    clause_count: number;
    jurisdiction: string;
    legal_references: string[];
    template_version: string;
    state?: string;
    language?: string;
  };
  legal_framework?: {
    state: string;
    applicable_acts: Array<{
      act_id: string;
      full_name: string;
      short_name: string;
      year: number;
      sections: string[];
      relevance_score: number;
    }>;
    mandatory_clauses: string[];
    registration_required: boolean;
    risk_warnings: string[];
    relevance_score: number;
    data_source: string;
    jurisdiction_rules: {
      court_level: string;
      jurisdiction: string;
      stamp_duty: {
        percentage: number;
        min_amount: number;
        max_amount: number;
        authority: string;
      };
      registration: {
        mandatory: boolean;
        timeline_days: number;
        authority: string;
      };
    };
  };
  needs_clarification?: boolean;
  clarification_questions?: string[];
}

class DraftingService {
  async draftDocumentInquiry(
    request: DraftDocumentInquiryRequest,
    options?: Omit<RequestInit, 'method' | 'body'>
  ): Promise<{ success: boolean; data?: DraftDocumentInquiryResponse; message?: string }> {
    try {
      const response = await FetchClient.makeRequest<DraftDocumentInquiryResponse>(
        API_ENDPOINTS.DRAFT_DOCUMENT_INQUIRY,
        {
          method: 'POST',
          body: JSON.stringify(request),
          ...options,
        }
      );
      return response;
    } catch (error) {
      console.error('Draft inquiry failed:', error);
      throw error;
    }
  }

  async generateTemplate(
    request: DraftDocumentRequest,
    options?: Omit<RequestInit, 'method' | 'body'>
  ): Promise<{ success: boolean; data?: DraftDocumentResponse; message?: string }> {
    try {
      const response = await FetchClient.makeRequest<DraftDocumentResponse>(
        API_ENDPOINTS.GENERATE_DRAFT_TEMPLATE,
        {
          method: 'POST',
          body: JSON.stringify(request),
          ...options,
        }
      );
      return response;
    } catch (error) {
      console.error('Draft generation failed:', error);
      throw error;
    }
  }
}

export const draftingService = new DraftingService();
