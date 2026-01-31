export interface Document {
  id: string;
  file_name: string;
  file_size: string;
  file_type: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  s3_key?: string;
  checksum?: string;
  created_at: string;
  uploaded_at?: string;
  metadata?: Record<string, any>;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

export interface DocumentsData {
  documents: Document[];
  pagination: Pagination;
}

export interface DocumentQueryParams {
  page?: number;
  page_size?: number;
  status?: 'pending' | 'uploading' | 'completed' | 'failed';
}

export interface InitUploadFileRequest {
  file_name: string;
  file_size: number;
  file_type: string;
  checksum: string;
}

export interface InitUploadRequest {
  files: InitUploadFileRequest[];
}

export interface UploadUrlInfo {
  document_id: string;
  file_name: string;
  upload_url: string;
  s3_key: string;
  expires_in: number;
}

export interface InitUploadResponse {
  success: boolean;
  upload_urls: UploadUrlInfo[];
  total_files: number;
}

export interface CompleteUploadRequest {
  document_id: string;
  s3_key: string;
  metadata?: Record<string, any>;
}

export interface CompleteUploadResponse {
  success: boolean;
  document_id: string;
  status: string;
}

export interface ViewDocumentResponse {
  success: boolean;
  document_id: string;
  file_name: string;
  file_type: string;
  file_size: string;
  presigned_url: string;
  uploaded_at: string;
}

export interface DownloadDocumentResponse {
  success: boolean;
  document_id: string;
  url: string;
  expires_in: number;
}

export interface DeleteDocumentResponse {
  success: boolean;
  document_id: string;
  deleted: boolean;
  deleted_at: string;
}
