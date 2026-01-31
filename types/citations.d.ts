import { OutputData as EditorOutputData } from '@editorjs/editorjs';

export interface CitationsDisplayData {
  id: string;
  wordCounts: number;
  data: Citation[];
}

export interface Citations {
  [key: string]: Citation[]; // Key could be blockId or section name
}

// Extend the metadata structure
export interface ProjectMetadata {
  data?: any; // Existing metadata
  citations?: Citations; // Add citations here
}

export interface Citation {
  id: string;
  source: string;
  title: string;
  author: string;
  link: string;
  reference_id?: string; // Backend reference ID for binding
  addedAt?: string;
  pageNumber?: number; // Page number where the citation appears in the document
  number?: number; // Citation number (1, 2, 3, etc.)
  position?: {
    start: number;
    end: number;
  };
}

export interface CitationsData {
  wordCounts: number;
  id: string;
  text: string;
}

export interface CitationDataRequest {
  blog_content: string;
  topic?: string;
  format_style?: number;
  validate_citations?: boolean;
  include_bibliography?: boolean;
  previous_word_count?: number;
  enable_ethics_check?: boolean;
  enable_compliance_check?: boolean;
}

export interface CitationSaveDataRequest {
  blockId: string;
  citationId: string;
  projectId: string;
}

export interface CombinedRecommendation {
  ref_id: string;
  title: string;
  summary: string;
  relevance_score: number;
  source: string;
  rank: number;
  link: string;
  court: string;
  metadata: string;
  date?: string;
}

export interface CombinedRecommendationResponse {
  success: boolean;
  combined_ranked: CombinedRecommendation[];
  personal_only: CombinedRecommendation[];
  online_only: CombinedRecommendation[];
  stats: {
    total_personal_input: number;
    total_online_fetched: number;
    matched_personal: number;
    matched_online: number;
    combined_returned: number;
    processing_time_ms: number;
  };
  error?: string;
}

// Workspace Reference from backend GET API
export interface WorkspaceReference {
  id: string;
  workspace_id: string;
  title: string;
  relevance_score: number;
  source: string;
  link: string;
  position?: number;
  rank?: number;
  summary?: string;
  created_at: string;
  updated_at?: string;
}

// Request to add a reference
export interface AddWorkspaceReferenceRequest {
  workspace_id: string;
  title: string;
  relevance_score: number;
  source: string;
  link: string;
  position?: number;
  rank?: number;
  summary?: string;
}

// Response from adding a reference
export interface AddWorkspaceReferenceResponse {
  reference: WorkspaceReference;
  success: boolean;
  message: string;
}

// Response from deleting a reference
export interface DeleteWorkspaceReferenceResponse {
  success: boolean;
  message: string;
}
