export type ImprovementFocus = 'grammar' | 'clarity' | 'style' | 'tone' | 'all';
export type WritingTone = 'professional' | 'casual' | 'academic' | 'legal';
export type ParaphraseMode = 'standard' | 'fluency' | 'formal' | 'simple' | 'creative';
export type TranslationDomain = 'general' | 'legal' | 'technical' | 'medical';
export type TemplateType = 'legal_brief' | 'research_paper' | 'article' | 'blog';

export interface ImproveWritingRequest {
  text: string;
  improvement_focus?: ImprovementFocus;
  tone?: WritingTone;
  context?: string;
}

export interface ImproveWritingResponse {
  success: boolean;
  improved_text: string;
  suggestions?: {
    category: string;
    original_segment: string;
    improved_segment: string;
    reason: string;
  }[];
  metadata?: {
    model: string;
    tokens_used: number;
    processing_time: number;
    character_count_before: number;
    character_count_after: number;
  };
  error?: string;
}

export interface ParaphraseRequest {
  text: string;
  paraphrase_mode?: ParaphraseMode;
  num_variations?: number;
  preserve_meaning?: boolean;
}

export interface ParaphraseResponse {
  success: boolean;
  paraphrased_texts: string[];
  original_text: string;
  metadata?: {
    model: string;
    tokens_used: number;
    processing_time: number;
    character_count_before: number;
    character_count_after: number;
  };
  error?: string;
}

export interface TranslateRequest {
  text: string;
  target_language: string;
  domain?: TranslationDomain;
  formal?: boolean;
}

export interface TranslateResponse {
  success: boolean;
  translated_text: string;
  source_language: string;
  target_language: string;
  metadata?: {
    model: string;
    confidence_score: number;
    detected_language: string;
    tokens_used: number;
    processing_time: number;
  };
  error?: string;
}

export interface GenerateParagraphRequest {
  prompt: string;
  template_type: TemplateType;
  existing_content?: string;
  document_title?: string;
}

export interface GenerateParagraphResponse {
  success: boolean;
  generated_text: string;
  template_type: string;
  metadata?: {
    model: string;
    tokens_used: number;
    processing_time: number;
    completion_time: number;
  };
  error?: string;
}
