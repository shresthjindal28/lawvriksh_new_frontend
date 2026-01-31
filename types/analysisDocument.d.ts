// Analysis Document Types - Unified API
// Matches the unified document API endpoints

// ============ Common Types ============

export type DocumentStatus = 'pending' | 'uploaded' | 'processing' | 'completed' | 'failed';
export type DocumentType = 'general' | 'compliance';

// ============ API Request/Response Types ============

export interface DocumentFileInfo {
  file_name: string;
  file_size: number;
  file_type: string;
  checksum?: string;
}

export interface InitUploadRequest {
  document_type: DocumentType;
  files: DocumentFileInfo[];
}

export interface InitUploadFileResponse {
  document_id: string;
  upload_url: string;
  s3_key: string;
  expires_in?: number;
}

export interface InitUploadResponse {
  upload_urls: InitUploadFileResponse[];
}

export interface CompleteUploadRequest {
  document_id: string;
  s3_key: string;
  metadata?: Record<string, any>;
}

export interface CompleteUploadResponse {
  document_id: string;
  status: string;
  message: string;
}

// ============ Document Model ============

export interface AnalysisDocumentRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  s3_key: string;
  checksum?: string;
  status: DocumentStatus;
  document_type: DocumentType;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ListDocumentsParams {
  page?: number;
  page_size?: number;
  status?: DocumentStatus;
  document_type?: DocumentType;
}

export interface ListDocumentsResponse {
  documents: AnalysisDocumentRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ViewDocumentRequest {
  view_options?: {
    format?: string;
  };
}

export interface ViewDocumentResponse {
  url: string;
  expires_in?: number;
}

export interface DownloadDocumentResponse {
  url: string;
  file_name: string;
  expires_in?: number;
}

export interface ExportDocumentRequest {
  title: string;
  content: string;
  doc_type?: string;
  export_format?: string;
  page_size?: string;
  color_scheme?: string;
  include_cover?: boolean;
  include_page_numbers?: boolean;
  include_toc?: boolean;
  font_family?: string;
  line_height?: number;
  margins?: number;
  metadata?: Record<string, any>;
}

export interface ExportDocumentResponse {
  url: string;
  file_name: string;
  expires_in?: number;
}

export interface StorageUsageResponse {
  used_bytes: number;
  total_bytes: number;
  percentage: number;
}

// ============ UI Transformed Type ============

export interface AnalysisDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  documentType: DocumentType;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// ============ Upload Dialog Types ============

export interface UploadDocumentOptions {
  documentType: DocumentType;
  file: File;
  metadata?: Record<string, any>;
}
