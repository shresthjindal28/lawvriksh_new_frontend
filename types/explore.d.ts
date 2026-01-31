export interface ExploreItem {
  id: string;
  title: string;
  url: string;
  description: string;
  fullContent?: {
    introduction: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
  };
  verdict: string;
}

export interface VerdictInfo {
  has_verdict: boolean;
  verdict: string;
  verdict_summary: string;
  confidence: number;
  source: string;
}

export interface LegalDocument {
  title: string;
  short_summary: string;
  detailed_summary: string;
  link: string;
  source: string;
  jurisdiction: string;
  date: string;
  case_number: string;
  verdict_info: VerdictInfo;
  is_summary_ready: boolean;
}

export interface ContentAnalysis {
  topic: string;
  case_type: string;
  specific_case: string;
  user_stance: string;
  key_arguments: string[];
  legal_issues: string[];
  summary: string;
}

export interface VerdictBreakdown {
  ALLOWED: number;
  DISMISSED: number;
  PARTLY_ALLOWED: number;
}

export interface SearchLegalDocumentsResponse {
  search_id: string;
  success: boolean;
  query: string;
  total_results: number;
  results: LegalDocument[];
  content_analysis: ContentAnalysis;
  verdict_breakdown: VerdictBreakdown;
  error_message: string | null;
  processing_time_ms: number;
}
