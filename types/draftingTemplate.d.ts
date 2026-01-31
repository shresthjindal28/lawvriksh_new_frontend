export interface TemplateItem {
  id: string;
  title: string;
  language: string;
  doc_type: string;
  category: string;
  s3_key: string;
  owner_id: string;
  jurisdiction: string;
  tags: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListTemplatesResponse {
  success: boolean;
  templates: TemplateItem[];
  total_count: number;
  page: number;
  limit: number;
  error?: any;
}

export interface ListTemplatesParams {
  /** User ID filter */
  user_id?: string;
  /** Filter by category (case-insensitive) */
  category?: string;
  /** Filter by language (case-insensitive) */
  language?: string;
  /** Filter by document type (case-insensitive) */
  doc_type?: string;
  /** Comma-separated list of tags (case-insensitive) */
  tags?: string[];
  /** Filter by title - partial match (case-insensitive) */
  title?: string;
  /** Page number (minimum: 1) */
  page?: number;
  /** Items per page (minimum: 1, maximum: 100) */
  limit?: number;
}

export interface InitTemplateUploadRequest {
  title: string;
  language: string;
  doc_type: string;
  category: string;
  file_name: string;
  file_size: number;
  file_type: string;
  jurisdiction?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface InitTemplateUploadResponse {
  success: boolean;
  template_id?: string;
  upload_url?: string;
  s3_key?: string;
  expires_in?: number;
  error?: any;
}

export interface CompleteTemplateUploadRequest {
  template_id: string;
  s3_key: string;
}

export interface TemplateResponse {
  success: boolean;
  template?: TemplateItem;
  error?: any;
}
