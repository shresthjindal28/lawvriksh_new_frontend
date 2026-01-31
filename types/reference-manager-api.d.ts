// types/reference-manager-api.ts - COMPLETE VERSION

// ============================================================================
// COMMON TYPES
// ============================================================================

export type DeleteResponse = {
  success: boolean;
  message: string;
};

export type PaginationParams = {
  skip?: number;
  limit?: number;
};

// ============================================================================
// COLLECTIONS
// ============================================================================

export type CreateCollectionRequest = {
  name: string;
  owner_id: string;
  icon_id?: string;
};

export type UpdateCollectionRequest = {
  collection_id: string;
  owner_id: string;
  name?: string;
  icon_id?: string;
};

export type RefCollection = {
  id: string;
  name: string;
  owner_id: string;
  icon_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
};

export type ListCollectionsResponse = {
  collections: RefCollection[];
  total_count: number;
};

export type CollectionStatistics = {
  collection_id: string;
  collection_name: string;
  folder_count: number;
  document_count: number;
  created_at: string;
  updated_at: string;
};

export type CollectionHierarchyResponse = {
  collection: RefCollection;
  folders: RefFolder[];
};

// ============================================================================
// FOLDERS
// ============================================================================

// Gateway expects UPPERCASE values for ReferenceType enum
export type ReferenceTypeEnum =
  | 'ARTICLE'
  | 'DOCUMENT'
  | 'HEARING'
  | 'LEGAL_CASE'
  | 'LEGISLATION'
  | 'RESEARCH_PAPER'
  | 'THESIS'
  | 'REGULATION'
  | 'REPORT'
  | 'BILL'
  | 'BOOK';

export type CreateFolderRequest = {
  collection_id: string;
  name: string;
  type?: ReferenceTypeEnum;
  created_by: string;
  sort_order?: number;
  icon_id?: string;
};

export type UpdateFolderRequest = {
  folder_id: string;
  name?: string;
  type?: ReferenceTypeEnum;
  sort_order?: number;
  icon_id?: string;
};

export type RefFolder = {
  id: string;
  collection_id: string;
  name: string;
  type: ReferenceTypeEnum;
  created_by: string;
  sort_order: number;
  icon_id?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
};

export type ListFoldersResponse = {
  folders: RefFolder[];
  total_count: number;
};

export type ReorderFoldersRequest = {
  collection_id: string;
  folder_orders: { folder_id: string; sort_order: number }[];
};

// ============================================================================
// DOCUMENTS
// ============================================================================

export type ExtractionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type RefDocument = {
  id: string;
  folder_id?: string; // Optional if not assigned to a folder initially
  reference_id?: string; // Optional if not linked to a reference
  title: string;
  s3_key: string;
  file_type: string;
  file_size: number;
  status: ExtractionStatus;
  metadata: Record<string, any>; // JSONB
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  folder_document_id?: string; // From join table
  folder_sort_order?: number; // From join table
  reference_document_id?: string; // From join table
  is_primary?: boolean; // From join table
};

export type FileToUpload = {
  name: string;
  size: number;
  type: string;
};

export type InitUploadResponse = {
  files: {
    original_name: string;
    s3_key: string;
    presigned_url: string;
  }[];
};

export type CreateDocumentRequest = {
  title: string;
  s3_key: string;
  file_type: string;
  file_size: number;
  created_by: string;
  folder_id?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  reference_type?: number;
};

export type UpdateDocumentRequest = {
  document_id: string;
  title?: string;
  metadata?: Record<string, any>;
};

export type ListDocumentsResponse = {
  documents: RefDocument[];
  total_count: number;
};

export type AddDocumentToFolderRequest = {
  folder_id: string;
  document_id: string;
  added_by: string;
  sort_order?: number;
};

export type RefFolderDocument = {
  id: string;
  folder_id: string;
  document_id: string;
  added_by: string;
  added_at: string;
  sort_order: number;
};

export type ReorderDocumentsRequest = {
  folder_id: string;
  document_orders: { document_id: string; sort_order: number }[];
};

// ============================================================================
// REFERENCES (Citations)
// ============================================================================

export type CreateReferenceRequest = {
  title: string;
  type: ReferenceTypeEnum;
  folder_id?: string; // Optional: create in folder
  collection_id?: string; // Optional: create in collection root
  created_by: string;
  metadata?: Record<string, any>;
  tags?: string[]; // Tag IDs
};

export type RefReference = {
  id: string;
  title: string;
  type: ReferenceTypeEnum;
  metadata: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  folder_id?: string; // Virtual field for response
  collection_id?: string; // Virtual field for response
};

export type ReferenceWithDocuments = RefReference & {
  documents: RefDocument[];
};

export type ListReferencesResponse = {
  references: ReferenceWithDocuments[];
  total_count: number;
};

export type DetachReferenceResponse = {
  success: boolean;
  message: string;
};

export type GetUnsignedReferencesResponse = {
  references: RefReference[];
  total_count: number;
};

export type MoveUnsignedRefToFolderRequest = {
  ref_id: string;
  target_folder_id: string;
  sort_order?: number;
};

// ============================================================================
// ANNOTATIONS
// ============================================================================

export type AnnotationType = 'HIGHLIGHT' | 'NOTE' | 'AREA';

export type CreateAnnotationRequest = {
  document_id: string;
  user_id: string;
  type: AnnotationType;
  page_number: number;
  coordinates: any; // JSON
  content?: string;
  color?: string;
};

export type UpdateAnnotationRequest = {
  annotation_id: string;
  text?: string;
  color?: string;
  reason?: string;
  sort_order?: number;
  positions?: any[];
};

export type RefAnnotation = {
  id: string;
  document_id: string;
  user_id: string;
  type: AnnotationType;
  page_number: number;
  coordinates: any;
  content?: string;
  color?: string;
  created_at: string;
  updated_at: string;
};

export type ListAnnotationsResponse = {
  annotations: RefAnnotation[];
  total_count: number;
};

// ============================================================================
// TAGS
// ============================================================================

export type CreateTagRequest = {
  name: string;
  color?: string;
  created_by: string;
};

export type CreatePredefinedTagsRequest = {
  created_by: string;
};

export type UpdateTagRequest = {
  tag_id: string;
  name?: string;
  color?: string;
};

export type RefTag = {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
};

export type ListTagsResponse = {
  tags: RefTag[];
  total_count: number;
};

export type BulkAddTagsRequest = {
  document_id: string;
  tag_ids: string[];
  added_by: string;
};

export type BulkTagResponse = {
  success: boolean;
  added_count: number;
};

export type RefDocumentTag = {
  document_id: string;
  tag_id: string;
  added_by: string;
  added_at: string;
};

// ============================================================================
// NOTES
// ============================================================================

export type CreateNoteRequest = {
  reference_id: string;
  user_id: string;
  note_text: string;
};

export type UpdateNoteRequest = {
  note_id: string;
  note_text: string;
};

export type RefNote = {
  id: string;
  reference_id: string;
  user_id: string;
  note_text: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
};

export type ListNotesResponse = {
  notes: RefNote[];
  total_count: number;
};

// ============================================================================
// DOCUMENT VERSIONS
// ============================================================================

export type AutoAnnotateRefDocumentRequest = {
  document_id: string;
  query: string;
  s3_key?: string;
};

export type AutoAnnotateRefDocumentResponse = {
  success: boolean;
  message: string;
  query: string;
  total: number;
  annotations: RefAnnotation[];
  processing_time: number;
  results?: Array<{
    text: string;
    type: string;
    context: string;
    bboxes: Array<{
      text: string;
      page: number;
      char_start: number;
      char_end: number;
      bbox: [number, number, number, number];
    }>;
  }>;
};

export type CreateVersionRequest = {
  document_id: string;
  created_by: string;
  metadata_snapshot?: string;
  diff_data?: string;
};

export type RefDocumentVersion = {
  id: string;
  document_id: string;
  version_number: number;
  metadata_snapshot?: string;
  diff_data?: string;
  created_at: string;
  created_by: string;
};

export type ListVersionsResponse = {
  versions: RefDocumentVersion[];
  total_count: number;
};

export type PreviewRefDocumentResponse = {
  preview_url: string;
};

export type PublicPreviewDocumentRequest = {
  s3_key: string;
};

export type PublicPreviewDocumentResponse = {
  preview_url?: string;
  error?: Record<string, any>;
};

// ============================================================================
// TIMELINE
// ============================================================================

export interface DocumentTimelineRequestSchema {
  collection_id: string;
  s3_keys: string[];
}

export interface EventSchema {
  event: string;
  description: string;
}

export interface DateEntrySchema {
  date: string;
  events: EventSchema[];
}

export interface TimelineSchema {
  timeline_id: string;
  timeline_name?: string; // Adjusted to match potential response variations or mapped to case_name
  case_name?: string; // Optional if the backend uses case_name or if we map it
  dates: DateEntrySchema[];
}

export interface DocumentTimelineResponseSchema {
  collection_id: string;
  extraction_timestamp: string;
  total_documents_processed: number;
  timelines: TimelineSchema[];
  error: string;
}
