import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import type { APIResponse } from '@/types/auth';
import {
  FactChecker,
  Compliance,
  ArgumentLogic,
  FactCheckSummary,
  VerifyAndCorrectBlogResponse,
  FactCheckClaim,
} from '@/types/copilot';

// New request format for verify-and-correct-blog API
interface VerifyAndCorrectBlogRequest {
  blog_id?: string;
  blog_content: string;
  language?: string;
  force_refresh?: boolean;
}

interface ComplianceCheckRequest {
  text: string;
  request_id?: string;
  metadata?: {
    document_type: string;
  };
  check_types?: string[];
  detailed_analysis?: boolean;
}

interface ArgumentLogicRequest {
  text: string;
  request_id: string;
  analysis_type: string;
  include_suggestions: boolean;
}

interface ComplianceCheckResponse {
  status: string;
  overall_score: number;
  detection_confidence?: string;
  total_violations?: number;
  violations: Array<{
    violation_type: string;
    severity: string;
    sentence: string;
    explanation?: string;
    corrected_sentence?: string;
  }>;
}

interface ArgumentLogicResponse {
  success: boolean;
  data: {
    arguments: ArgumentLogic[];
    score: number;
  };
}

interface PlagiarismCheckRequest {
  text: string;
  language: string;
  country: string;
}

interface PlagiarismCheckResponse {
  tool_id: string;
  violation_status: number;
  result: {
    score: number;
    source_counts: number;
    total_plagiarism_words: number;
    text_word_counts: number;
  };
  sources: Array<{
    score: number;
    url: string;
    title: string;
    plagiarism_words: number;
    plagiarism_found?: Array<{ sequence: string }>;
  }>;
}

class AnalysisService {
  /**
   * Fact Checker API - Using new verify-and-correct-blog endpoint
   * Returns comprehensive analysis with auto-corrections
   */
  async checkFacts(
    request: VerifyAndCorrectBlogRequest
  ): Promise<APIResponse<VerifyAndCorrectBlogResponse>> {
    return FetchClient.makeRequest<VerifyAndCorrectBlogResponse>(API_ENDPOINTS.FACT_CHECKER, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Compliance Check API - Using the same format as CopilotService
   */
  async checkCompliance(
    request: ComplianceCheckRequest
  ): Promise<APIResponse<ComplianceCheckResponse>> {
    return FetchClient.makeRequest<ComplianceCheckResponse>(API_ENDPOINTS.COMPLIANCE_CHECK, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Argument Logic Check API - Using the same format as CopilotService
   */
  async checkArgumentLogic(
    request: ArgumentLogicRequest
  ): Promise<APIResponse<ArgumentLogicResponse>> {
    return FetchClient.makeRequest<ArgumentLogicResponse>(API_ENDPOINTS.ARGUMENT_LOGIC, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async checkPlagiarism(
    request: PlagiarismCheckRequest
  ): Promise<APIResponse<PlagiarismCheckResponse>> {
    return FetchClient.makeRequest<PlagiarismCheckResponse>(API_ENDPOINTS.PLAGIARISM_CHECK, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Batch Argument Logic Check API
   */
  async batchCheckArgumentLogic(
    requests: ArgumentLogicRequest[]
  ): Promise<APIResponse<ArgumentLogicResponse>> {
    return FetchClient.makeRequest<ArgumentLogicResponse>(API_ENDPOINTS.ARGUMENT_LOGIC_BATCH, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  /**
   * Batch Compliance Check API
   */
  async batchCheckCompliance(
    requests: ComplianceCheckRequest[]
  ): Promise<APIResponse<ComplianceCheckResponse>> {
    return FetchClient.makeRequest<ComplianceCheckResponse>(API_ENDPOINTS.COMPLIANCE_BATCH_CHECK, {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  /**
   * Generic upload data for analysis (legacy endpoint)
   */
  async uploadDataForAnalysis(
    content: string,
    type: string,
    documentId?: string
  ): Promise<APIResponse<any>> {
    return FetchClient.makeRequest<any>(API_ENDPOINTS.UPLOAD_DATA_FOR_ANALYSIS, {
      method: 'POST',
      body: JSON.stringify({
        content,
        type,
        documentId,
      }),
    });
  }

  /**
   * Helper method to extract text content from EditorJS data
   */
  extractTextFromEditorJS(data: any): string {
    if (!data || !data.blocks) return '';

    return data.blocks
      .filter(
        (block: any) =>
          block.type === 'paragraph' || block.type === 'header' || block.type === 'list'
      )
      .map((block: any) => {
        if (block.data.text) {
          // Strip HTML tags and get plain text
          const textWithHtml = block.data.text;
          const plainText = textWithHtml.replace(/<[^>]*>/g, ''); // Remove all HTML tags
          return plainText.replace(/\s+/g, ' ').trim(); // Clean up whitespace
        }
        if (block.data.items && Array.isArray(block.data.items)) {
          // Handle list items
          return block.data.items
            .map((item: any) => {
              if (typeof item === 'string') {
                return item
                  .replace(/<[^>]*>/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();
              }
              if (item && item.content) {
                return item.content
                  .replace(/<[^>]*>/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();
              }
              return '';
            })
            .filter((text: string) => text.length > 0)
            .join(' ');
        }
        return '';
      })
      .filter((text: string) => text.length > 0)
      .join(' ');
  }

  /**
   * Helper method to prepare fact check request for verify-and-correct-blog API
   */
  prepareFactCheckRequest(content: string, blogId?: string): VerifyAndCorrectBlogRequest {
    return {
      blog_id: blogId || `blog_${Date.now()}`,
      blog_content: content,
      language: 'en',
      force_refresh: false,
    };
  }

  /**
   * Transform API response to FactChecker array for display
   */
  transformFactCheckResponse(response: VerifyAndCorrectBlogResponse): {
    facts: FactChecker[];
    summary: FactCheckSummary;
    score: number;
    correctedContent: string;
    correctionsApplied: number;
  } {
    // Transform fact_checks to FactChecker format
    const facts: FactChecker[] = (response.fact_checks || []).map(
      (fc: FactCheckClaim, index: number) => ({
        fact: {
          id: `fact_${index}`,
          block_id: '',
          wrongStatement: fc.claim,
          correctedStatement: fc.corrected_sentence || fc.claim,
        },
        confidence: fc.confidence_score || response.confidence_score || 0,
        verdict: fc.verdict,
        sources: (fc.citations || []).map((c, i) => ({
          id: `source_${index}_${i}`,
          name: c.title || 'Unknown Source',
          date: response.timestamp || new Date().toISOString(),
          url: c.url || '',
        })),
      })
    );

    const summary: FactCheckSummary = {
      totalClaims: response.total_claims_extracted || 0,
      verifiedClaims: response.verified_claims || 0,
      unverifiableClaims: response.unverifiable_claims?.length || 0,
      accuracyScore: response.accuracy_score || 0,
      confidenceScore: response.confidence_score || 0,
      recommendations: response.recommendations || [],
    };

    return {
      facts,
      summary,
      score: response.accuracy_score || 0,
      correctedContent: response.corrected_content || '',
      correctionsApplied: response.corrections_applied || 0,
    };
  }

  /**
   * Helper method to prepare compliance check request
   */
  prepareComplianceCheckRequest(content: string, projectId: string): ComplianceCheckRequest {
    return {
      text: content,
    };
  }

  /**
   * Helper method to prepare argument logic request
   */
  prepareArgumentLogicRequest(content: string, projectId: string): ArgumentLogicRequest {
    return {
      text: content,
      request_id: `arg_${projectId}_${Date.now()}`,
      analysis_type: 'logical_consistency',
      include_suggestions: true,
    };
  }

  preparePlagiarismCheckRequest(content: string): PlagiarismCheckRequest {
    return {
      text: content,
      language: 'en',
      country: 'us',
    };
  }
}

export const analysisService = new AnalysisService();
