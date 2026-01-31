import { OutputData } from '@editorjs/editorjs';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import { APIResponse } from '@/types';
import {
  ArgumentLogic,
  Compliance,
  ComplianceCheckRequest,
  ComplianceCheckResponse,
  CopilotResponse,
  FactCheckClaim,
  FactChecker,
  FactCheckRequest,
  FactCheckResponse,
  FactCheckSummary,
} from '@/types/copilot';
import { FetchClient } from './fetchClient';
import { transformArgumentLogicResponse } from '../utils/normalizeCopilotResponse';

class CopilotServiceClass {
  /**
   * Extracts fact check data from raw backend response
   */
  extractFactData(response: any): FactCheckResponse['data'] | null {
    if (!response) return null;

    // Helper to check if an object looks like the fact check data we want
    const isFactData = (obj: any) =>
      obj &&
      (Array.isArray(obj.fact_checks) ||
        obj.total_claims_extracted !== undefined ||
        obj.accuracy_score !== undefined);

    // Case 1: Direct payload
    if (isFactData(response)) return response;

    // Case 2: One level deep (most common from FetchClient.makeRequest)
    // e.g. response = { data: { fact_checks: [...] }, success: true }
    if (response.data && isFactData(response.data)) return response.data;

    // Case 3: Two levels deep
    // e.g. response = { data: { data: { fact_checks: [...] } } }
    if (response.data?.data && isFactData(response.data.data)) return response.data.data;

    return null;
  }

  /**
   * Transforms raw fact check data into FactChecker[] format
   * Updated for verify-and-correct-blog API response
   */
  transformFactCheckToFactChecker(response: FactCheckResponse['data']): FactChecker[] | null {
    if (!response.fact_checks || response.fact_checks.length === 0) return null;

    return response.fact_checks.map((claim: any, index: number) => {
      // Extract citations from the new API response format
      const citations = claim.citations || [];
      const sources =
        citations.length > 0
          ? citations.map((c: any, i: number) => ({
              id: `src_${index}_${i}`,
              name: c.title || claim.source_type || 'Legal Source',
              date: claim.checked_on || response.timestamp || new Date().toISOString(),
              url: c.url || claim.citation_provided || '',
            }))
          : [
              {
                id: `src_${index}`,
                name: claim.source || claim.source_type || 'Legal Source',
                date: claim.checked_on || response.timestamp || new Date().toISOString(),
                url: claim.citation_provided || '',
              },
            ];

      return {
        fact: {
          id: `fact_${index}`,
          block_id: '',
          wrongStatement: claim.claim,
          // Use corrected_sentence from new API - don't fall back to URLs
          correctedStatement: claim.corrected_sentence || '',
        },
        confidence: claim.confidence || claim.confidence_score || response.confidence_score || 0,
        verdict: claim.verdict,
        sources,
        // Additional fields from new API
        reasoning: claim.reasoning || '',
      };
    });
  }

  /**
   * Transforms raw fact check data into Compliance[] format
   */
  transformFactCheckToCompliance(response: FactCheckResponse['data']): Compliance[] | null {
    if (!response.fact_checks || response.fact_checks.length === 0) return null;

    // Group claims by text
    const claimGroups = new Map<string, FactCheckClaim[]>();

    response.fact_checks.forEach((claim) => {
      if (!claimGroups.has(claim.claim)) {
        claimGroups.set(claim.claim, []);
      }
      claimGroups.get(claim.claim)!.push(claim);
    });

    const complianceList: Compliance[] = [];

    claimGroups.forEach((claims, claimText) => {
      const primaryClaim = claims[0];

      complianceList.push({
        statement: {
          id: `compliance_${complianceList.length}`,
          block_id: '',
          wrongStatement: claimText,
        },
        confidence: primaryClaim.confidence_score || response.confidence_score || 0,
        verdict: primaryClaim.verdict,
        policies: claims.map((claim, idx) => ({
          id: `policy_${complianceList.length}_${idx}`,
          name: claim.source_type,
          date: claim.checked_on || '',
          url: claim.citation_provided || '',
        })),
        justification: primaryClaim.source || '',
      });
    });

    return complianceList;
  }

  /**
   * Transforms raw compliance violations into Compliance[] format
   */
  transformComplianceViolations(response: ComplianceCheckResponse): Compliance[] | null {
    if (!response.violations || response.violations.length === 0) return null;

    return response.violations.map((violation, index) => ({
      statement: {
        id: violation.violation_id || `comp_violation_${index}`,
        block_id: '',
        wrongStatement: violation.sentence,
        correctedStatement: violation.corrected_sentence || '',
      },
      confidence:
        ((violation.confidence_score !== undefined
          ? violation.confidence_score
          : response.overall_score) || 0) > 1
          ? ((violation.confidence_score !== undefined
              ? violation.confidence_score
              : response.overall_score) || 0) / 100
          : (violation.confidence_score !== undefined
              ? violation.confidence_score
              : response.overall_score) || 0,
      verdict: violation.severity || 'violation_detected',
      severity: violation.severity, // Map severity explicitly for hover card
      policies:
        violation.legal_references?.map((ref, refIdx) => ({
          id: `policy_${index}_${refIdx}`,
          name: ref,
          date: response.metadata?.checked_at || new Date().toISOString(),
          url: '',
        })) || [],
      justification: violation.explanation || '',
    }));
  }

  /**
   * Transforms raw argument logic response into ArgumentLogic[] format
   */
  /**
   * Transforms raw argument logic response into ArgumentLogic format
   */
  transformArgumentLogic(response: any): ArgumentLogic | null {
    if (!response) return null;

    // Handle various response wrappers
    const data = response.data?.data || response.data || response;

    if (!data.contradiction_sets || !Array.isArray(data.contradiction_sets)) {
      // Fallback for empty or invalid data
      if (data.lines_detected) {
        // Maybe old format or just lines? Return empty structure.
        return { sets: [], score: 0 };
      }
      return null;
    }

    const sets = data.contradiction_sets.map((set: any) => ({
      set_id: set.set_id || `set_${Math.random().toString(36).substr(2, 9)}`,
      score: set.score || 0,
      contradictions: (set.contradictions || []).map((c: any) => ({
        line1: {
          id: c.line1?.id || '',
          text: c.line1?.text || '',
        },
        line2: {
          id: c.line2?.id || '',
          text: c.line2?.text || '',
        },
        contradiction_score: c.contradiction_score || 0,
        confidence: c.confidence || 0,
        suggestions: c.suggestions || {},
      })),
    }));

    return {
      sets,
      score: data.score || (sets.length > 0 ? sets[0].score : 0),
    };
  }

  /**
   * Generates fact check summary
   */
  getFactCheckSummary(response: FactCheckResponse['data']): FactCheckSummary {
    const totalClaims = response.total_claims_extracted || 0;
    const verifiedClaims = response.verified_claims || 0;
    const unverifiableClaims = response.unverifiable_claims?.length || 0;
    const accuracyScore =
      response.accuracy_score ??
      (totalClaims > 0 && verifiedClaims > 0
        ? Math.round((verifiedClaims / totalClaims) * 100)
        : 0);
    const confidenceScore =
      response.confidence_score || response.confidence_data?.overall_confidence || 0;

    return {
      totalClaims,
      verifiedClaims,
      unverifiableClaims,
      accuracyScore,
      confidenceScore,
      recommendations: response.recommendations || [],
    };
  }

  /**
   * Extract plain text from Editor.js OutputData
   */
  extractTextFromEditorData(data: OutputData): string {
    if (!data.blocks || data.blocks.length === 0) return '';

    return data.blocks
      .map((block) => {
        switch (block.type) {
          case 'paragraph':
          case 'header':
            return block.data.text || '';
          case 'list':
            return (block.data.items || [])
              .map((i: any) => {
                if (typeof i === 'string') return i;
                if (i?.content) return i.content;
                if (i?.text) return i.text;
                return '';
              })
              .join(' ');
          case 'quote':
            return block.data.text || '';
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * Transform Compliance API response from fact check source
   */
  transformComplianceResponse(response: FactCheckResponse['data']): Compliance[] | null {
    return this.transformFactCheckToCompliance(response);
  }

  /**
   * Unified processor for Fact Check
   * Updated for verify-and-correct-blog API that returns corrected content
   */
  processFactCheck(rawResponse: any) {
    const factData = this.extractFactData(rawResponse);
    if (!factData) return null;

    const factCheckers = this.transformFactCheckToFactChecker(factData);
    const summary = this.getFactCheckSummary(factData);

    return {
      factCheckers,
      summary,
      score: summary.accuracyScore,
      // New fields from verify-and-correct-blog API
      originalContent: factData.original_content || '',
      correctedContent: factData.corrected_content || '',
      correctionsApplied: factData.corrections_applied || 0,
      inaccurateClaimsFixed: factData.inaccurate_claims_fixed || 0,
    };
  }

  /**
   * Unified processor for Compliance Check
   */
  processCompliance(rawResponse: any) {
    if (!rawResponse) return { complianceViolations: [], score: 0 };

    // Robust extraction
    const isCompData = (obj: any) => obj && (obj.violations || obj.overall_score);

    let data = rawResponse;
    if (isCompData(rawResponse.data)) {
      data = rawResponse.data;
    } else if (rawResponse.data?.data && isCompData(rawResponse.data.data)) {
      data = rawResponse.data.data;
    }

    const complianceViolations = this.transformComplianceViolations(data);
    const score =
      data.overall_score !== undefined
        ? data.overall_score
        : complianceViolations
          ? Math.max(0, 100 - complianceViolations.length * 10)
          : 100;

    return {
      complianceViolations: complianceViolations || [],
      score,
    };
  }

  /**
   * Unified processor for Argument Logic
   */
  /**
   * Unified processor for Argument Logic
   */
  async processArgumentLogic(rawResponse: any) {
    const argumentLogic = this.transformArgumentLogic(rawResponse);
    const score = argumentLogic ? argumentLogic.score : 100;

    return {
      argumentLogic,
      score,
    };
  }

  /**
   * Make API call for fact checking
   */
  async checkFacts(request: FactCheckRequest): Promise<any> {
    const response = await FetchClient.makeRequest<any>(API_ENDPOINTS.FACT_CHECKER, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  }

  /**
   * Make API call for compliance checking
   */
  async checkCompliance(request: ComplianceCheckRequest): Promise<any> {
    const response = await FetchClient.makeRequest<ComplianceCheckResponse>(
      API_ENDPOINTS.COMPLIANCE_CHECK,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
    return response;
  }

  /**
   * Make API call for argument logic checking
   */
  async checkArgumentLogic(request: {
    text: string;
    fast_mode?: boolean;
    include_analysis?: boolean;
    contradiction_threshold?: number;
  }): Promise<any> {
    const response = await FetchClient.makeRequest<any>(API_ENDPOINTS.ARGUMENT_LOGIC, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response;
  }
}

const CopilotService = new CopilotServiceClass();
export default CopilotService;
