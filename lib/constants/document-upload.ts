export const ProjectType = {
  UPLOAD: 'upload',
  SCRATCH: 'scratch',
  TEMPLATE: 'template',
} as const;

export const ProjectStatus = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const;

export const DocumentStatus = {
  INITIALIZING: 'initializing',
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const ProcessingStage = {
  VALIDATION: 'validation',
  S3_UPLOAD: 's3_upload',
  TIKA_PROCESSING: 'tika_processing',
  TEXT_EXTRACTION: 'text_extraction',
  OCR: 'ocr',
  CITATION_EXTRACTION: 'citation_extraction',
  REFERENCE_IDENTIFICATION: 'reference_identification',
  CONTENT_STRUCTURING: 'content_structuring',
  INDEXING: 'indexing',
} as const;

export const StageStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const UploadMethod = {
  S3_PRESIGNED: 's3_presigned',
  DIRECT: 'direct',
} as const;

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  OCR_FAILED: 'OCR_FAILED',
} as const;

export const WebSocketMessageType = {
  PROCESSING_UPDATE: 'processing_update',
  PROCESSING_COMPLETE: 'processing_complete',
  PROCESSING_ERROR: 'processing_error',
} as const;

export const WebhookEventType = {
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_PROCESSING_STARTED: 'document.processing_started',
  DOCUMENT_PROCESSING_COMPLETED: 'document.processing_completed',
  DOCUMENT_PROCESSING_FAILED: 'document.processing_failed',
} as const;
