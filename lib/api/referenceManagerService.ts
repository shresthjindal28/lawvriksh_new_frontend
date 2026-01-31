// services/referenceManager.service.ts - COMPLETE VERSION
import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import type { APIResponse } from '@/types/auth';
import type {
  CompleteImageUploadRequest,
  CompleteImageUploadResponse,
  InitImageUploadRequest,
  InitImageUploadResponse,
} from '@/types/image';
import {
  RefCollection,
  RefFolder,
  RefDocument,
  RefAnnotation,
  RefTag,
  RefNote,
  RefDocumentVersion,
  RefFolderDocument,
  RefReference,
  DeleteResponse,
  PaginationParams,
  ListCollectionsResponse,
  ListFoldersResponse,
  CollectionHierarchyResponse,
  CollectionStatistics,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  CreateFolderRequest,
  ReferenceTypeEnum,
  UpdateFolderRequest,
  AddDocumentToFolderRequest,
  ListDocumentsResponse,
  FileToUpload,
  InitUploadResponse,
  CreateDocumentRequest,
  ExtractionStatus,
  UpdateDocumentRequest,
  CreateAnnotationRequest,
  AnnotationType,
  ListAnnotationsResponse,
  UpdateAnnotationRequest,
  CreateTagRequest,
  CreatePredefinedTagsRequest,
  ListTagsResponse,
  UpdateTagRequest,
  RefDocumentTag,
  BulkAddTagsRequest,
  BulkTagResponse,
  CreateNoteRequest,
  ListNotesResponse,
  UpdateNoteRequest,
  CreateVersionRequest,
  ListVersionsResponse,
  CreateReferenceRequest,
  ListReferencesResponse,
  ReferenceWithDocuments,
  ReorderFoldersRequest,
  ReorderDocumentsRequest,
  DetachReferenceResponse,
  AutoAnnotateRefDocumentRequest,
  AutoAnnotateRefDocumentResponse,
  PreviewRefDocumentResponse,
  PublicPreviewDocumentResponse,
  DocumentTimelineRequestSchema,
  DocumentTimelineResponseSchema,
  MoveUnsignedRefToFolderRequest,
} from '@/types/reference-manager-api';

class ReferenceManagerService {
  // ============================================================================
  // COLLECTIONS
  // ============================================================================

  async createCollection(
    data: CreateCollectionRequest
  ): Promise<APIResponse<{ collection: RefCollection }>> {
    return FetchClient.makeRequest<{ collection: RefCollection }>(API_ENDPOINTS.REF_COLLECTIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCollection(
    collectionId: string,
    ownerId: string
  ): Promise<APIResponse<{ collection: RefCollection }>> {
    const params = new URLSearchParams({ owner_id: ownerId });
    return FetchClient.makeRequest<{ collection: RefCollection }>(
      `${API_ENDPOINTS.REF_COLLECTIONS}/${collectionId}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async listCollections(
    ownerId: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListCollectionsResponse>> {
    const params = new URLSearchParams({
      owner_id: ownerId,
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    return FetchClient.makeRequest<ListCollectionsResponse>(
      `${API_ENDPOINTS.REF_COLLECTIONS}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async updateCollection(
    data: UpdateCollectionRequest
  ): Promise<APIResponse<{ collection: RefCollection }>> {
    return FetchClient.makeRequest<{ collection: RefCollection }>(
      `${API_ENDPOINTS.REF_COLLECTIONS}/${data.collection_id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteCollection(
    collectionId: string,
    ownerId: string,
    hardDelete = false
  ): Promise<APIResponse<DeleteResponse>> {
    const params = new URLSearchParams({
      owner_id: ownerId,
      hard_delete: String(hardDelete),
    });
    return FetchClient.makeRequest<DeleteResponse>(
      `${API_ENDPOINTS.REF_COLLECTIONS}/${collectionId}?${params.toString()}`,
      {
        method: 'DELETE',
      }
    );
  }

  async getCollectionHierarchy(
    collectionId: string,
    ownerId: string
  ): Promise<APIResponse<CollectionHierarchyResponse>> {
    const params = new URLSearchParams({ owner_id: ownerId });
    return FetchClient.makeRequest<CollectionHierarchyResponse>(
      `${API_ENDPOINTS.REF_COLLECTIONS}/${collectionId}/hierarchy?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async getCollectionStatistics(
    collectionId: string,
    ownerId: string
  ): Promise<APIResponse<CollectionStatistics>> {
    const params = new URLSearchParams({ owner_id: ownerId });
    return FetchClient.makeRequest<CollectionStatistics>(
      `${API_ENDPOINTS.REF_COLLECTIONS}/${collectionId}/statistics?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async searchCollections(
    ownerId: string,
    searchTerm: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListCollectionsResponse>> {
    const params = new URLSearchParams({
      owner_id: ownerId,
      search_term: searchTerm,
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    return FetchClient.makeRequest<ListCollectionsResponse>(
      `${API_ENDPOINTS.REF_COLLECTIONS}/search?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  // ============================================================================
  // FOLDERS
  // ============================================================================

  async createFolder(data: CreateFolderRequest): Promise<APIResponse<{ folder: RefFolder }>> {
    return FetchClient.makeRequest<{ folder: RefFolder }>(API_ENDPOINTS.REF_FOLDERS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFolder(
    folderId: string,
    includeDeleted = false
  ): Promise<APIResponse<{ folder: RefFolder }>> {
    const params = new URLSearchParams({
      include_deleted: String(includeDeleted),
    });
    return FetchClient.makeRequest<{ folder: RefFolder }>(
      `${API_ENDPOINTS.REF_FOLDERS}/${folderId}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async listFolders(
    collectionId: string,
    options?: {
      type?: ReferenceTypeEnum;
      includeDeleted?: boolean;
      pagination?: PaginationParams;
    }
  ): Promise<APIResponse<ListFoldersResponse>> {
    const params = new URLSearchParams({
      collection_id: collectionId,
      include_deleted: String(options?.includeDeleted ?? false),
      skip: String(options?.pagination?.skip ?? 0),
      limit: String(options?.pagination?.limit ?? 100),
    });
    if (options?.type) {
      params.append('type', options.type);
    }
    return FetchClient.makeRequest<ListFoldersResponse>(
      `${API_ENDPOINTS.REF_FOLDERS}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async updateFolder(data: UpdateFolderRequest): Promise<APIResponse<{ folder: RefFolder }>> {
    return FetchClient.makeRequest<{ folder: RefFolder }>(
      `${API_ENDPOINTS.REF_FOLDERS}/${data.folder_id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteFolder(folderId: string, hardDelete = false): Promise<APIResponse<DeleteResponse>> {
    const params = new URLSearchParams({ hard_delete: String(hardDelete) });
    return FetchClient.makeRequest<DeleteResponse>(
      `${API_ENDPOINTS.REF_FOLDERS}/${folderId}?${params.toString()}`,
      {
        method: 'DELETE',
      }
    );
  }

  async reorderFolders(data: ReorderFoldersRequest): Promise<APIResponse<DeleteResponse>> {
    return FetchClient.makeRequest<DeleteResponse>(`${API_ENDPOINTS.REF_FOLDERS}/reorder`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async moveFolderToCollection(
    folderId: string,
    targetCollectionId: string
  ): Promise<APIResponse<{ folder: RefFolder }>> {
    return FetchClient.makeRequest<{ folder: RefFolder }>(
      `${API_ENDPOINTS.REF_FOLDERS}/${folderId}/move`,
      {
        method: 'PUT',
        body: JSON.stringify({ target_collection_id: targetCollectionId }),
      }
    );
  }

  async addDocumentToFolder(
    data: AddDocumentToFolderRequest
  ): Promise<APIResponse<{ folder_document: RefFolderDocument }>> {
    return FetchClient.makeRequest<{ folder_document: RefFolderDocument }>(
      `${API_ENDPOINTS.REF_FOLDERS}/${data.folder_id}/documents`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async extractMetadata(documentId: string): Promise<APIResponse<{ document: RefDocument }>> {
    return FetchClient.makeRequest<{ document: RefDocument }>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/${documentId}/extract`,
      {
        method: 'POST',
      }
    );
  }

  async removeDocumentFromFolder(
    folderId: string,
    documentId: string
  ): Promise<APIResponse<DeleteResponse>> {
    return FetchClient.makeRequest<DeleteResponse>(
      `${API_ENDPOINTS.REF_FOLDERS}/${folderId}/documents/${documentId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async reorderDocumentsInFolder(
    data: ReorderDocumentsRequest
  ): Promise<APIResponse<DeleteResponse>> {
    return FetchClient.makeRequest<DeleteResponse>(
      `${API_ENDPOINTS.REF_FOLDERS}/${data.folder_id}/documents/reorder`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async getFolderDocuments(
    folderId: string,
    includeDeleted = false
  ): Promise<APIResponse<ListDocumentsResponse>> {
    const params = new URLSearchParams({
      include_deleted: String(includeDeleted),
    });
    return FetchClient.makeRequest<ListDocumentsResponse>(
      `${API_ENDPOINTS.REF_FOLDERS}/${folderId}/documents?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  // ============================================================================
  // REFERENCES
  // ============================================================================

  async createReference(
    data: CreateReferenceRequest
  ): Promise<APIResponse<{ reference: RefReference }>> {
    return FetchClient.makeRequest<{ reference: RefReference }>(API_ENDPOINTS.REF_REFERENCES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createUnsignedReference(
    data: CreateReferenceRequest
  ): Promise<APIResponse<{ reference: RefReference }>> {
    return FetchClient.makeRequest<{ reference: RefReference }>(
      `${API_ENDPOINTS.REF_REFERENCES}/unsigned`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getUnsignedReferences(
    pagination?: PaginationParams
  ): Promise<APIResponse<ListReferencesResponse>> {
    const params = new URLSearchParams({
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    return FetchClient.makeRequest<ListReferencesResponse>(
      `${API_ENDPOINTS.REF_REFERENCES}/unsigned?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async getReference(referenceId: string): Promise<APIResponse<{ reference: RefReference }>> {
    return FetchClient.makeRequest<{ reference: RefReference }>(
      `${API_ENDPOINTS.REF_REFERENCES}/${referenceId}`,
      {
        method: 'GET',
      }
    );
  }

  async listReferences(
    pagination?: PaginationParams
  ): Promise<APIResponse<ListReferencesResponse>> {
    const params = new URLSearchParams({
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    return FetchClient.makeRequest<ListReferencesResponse>(
      `${API_ENDPOINTS.REF_REFERENCES}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async updateReference(
    referenceId: string,
    data: { is_link?: boolean; icon_id?: string }
  ): Promise<APIResponse<{ reference: RefReference }>> {
    return FetchClient.makeRequest<{ reference: RefReference }>(
      `${API_ENDPOINTS.REF_REFERENCES}/${referenceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteReference(
    referenceId: string,
    hardDelete = false
  ): Promise<APIResponse<DeleteResponse>> {
    const params = new URLSearchParams({ hard_delete: String(hardDelete) });
    return FetchClient.makeRequest<DeleteResponse>(
      `${API_ENDPOINTS.REF_REFERENCES}/${referenceId}?${params.toString()}`,
      {
        method: 'DELETE',
      }
    );
  }

  async searchReferences(
    searchTerm: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListReferencesResponse>> {
    const params = new URLSearchParams({
      search_term: searchTerm,
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    return FetchClient.makeRequest<ListReferencesResponse>(
      `${API_ENDPOINTS.REF_REFERENCES}/search?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async getReferenceWithDocuments(
    referenceId: string
  ): Promise<APIResponse<ReferenceWithDocuments>> {
    // Validate and normalize referenceId
    if (referenceId === null || referenceId === undefined) {
      throw new Error('Invalid referenceId: cannot be null or undefined');
    }

    // Handle case where referenceId might be an object with an id property
    let refIdString: string;
    if (typeof referenceId === 'object' && referenceId !== null && 'id' in referenceId) {
      refIdString = String((referenceId as any).id).trim();
    } else {
      refIdString = String(referenceId).trim();
    }

    if (refIdString === '' || refIdString === 'undefined' || refIdString === 'null') {
      throw new Error('Invalid referenceId: must be a non-empty string');
    }

    // Ensure referenceId is properly encoded for URL
    const encodedReferenceId = encodeURIComponent(refIdString);

    return FetchClient.makeRequest<ReferenceWithDocuments>(
      `${API_ENDPOINTS.REF_REFERENCES}/${encodedReferenceId}/documents`,
      {
        method: 'GET',
      }
    );
  }

  async detachReference(referenceId: string): Promise<APIResponse<DetachReferenceResponse>> {
    return FetchClient.makeRequest<DetachReferenceResponse>(
      `${API_ENDPOINTS.REF_REFERENCES}/${referenceId}/detach`,
      {
        method: 'POST',
      }
    );
  }

  async restoreReference(referenceId: string): Promise<APIResponse<{ reference: RefReference }>> {
    return FetchClient.makeRequest<{ reference: RefReference }>(
      `${API_ENDPOINTS.REF_REFERENCES}/${referenceId}/restore`,
      {
        method: 'POST',
      }
    );
  }

  async moveReference(
    referenceId: string,
    data: {
      ref_id: string;
      user_id: string;
      source_folder_id: string;
      target_collection_id?: string;
      target_folder_id?: string;
    }
  ): Promise<APIResponse<any>> {
    return FetchClient.makeRequest<any>(`${API_ENDPOINTS.REF_REFERENCES}/${referenceId}/move`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async moveUnsignedReferenceToFolder(
    referenceId: string,
    data: MoveUnsignedRefToFolderRequest
  ): Promise<APIResponse<any>> {
    return FetchClient.makeRequest<any>(
      `${API_ENDPOINTS.REF_REFERENCES}/unsigned/${referenceId}/move-to-folder`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async copyReference(
    referenceId: string,
    data: {
      ref_id: string;
      user_id: string;
      source_folder_id: string;
      target_collection_id?: string;
      target_folder_id?: string;
    }
  ): Promise<APIResponse<any>> {
    return FetchClient.makeRequest<any>(`${API_ENDPOINTS.REF_REFERENCES}/${referenceId}/copy`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================================================
  // DOCUMENTS
  // ============================================================================

  async initUpload(
    userId: string,
    files: FileToUpload[]
  ): Promise<APIResponse<InitUploadResponse>> {
    return FetchClient.makeRequest<InitUploadResponse>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/init-upload`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          files: files,
        }),
      }
    );
  }

  async initImageUpload(
    request: InitImageUploadRequest
  ): Promise<APIResponse<InitImageUploadResponse>> {
    return FetchClient.makeRequest<InitImageUploadResponse>(API_ENDPOINTS.INIT_IMAGE_UPLOAD, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async completeImageUpload(
    request: CompleteImageUploadRequest
  ): Promise<APIResponse<CompleteImageUploadResponse>> {
    return FetchClient.makeRequest<CompleteImageUploadResponse>(
      API_ENDPOINTS.COMPLETE_IMAGE_UPLOAD,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  async createImageRefDocument(
    refId: string,
    file: File,
    options?: { description?: string; metadata?: Record<string, any> }
  ): Promise<APIResponse<{ document: RefDocument }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ref_id', refId);

    if (options?.description) {
      formData.append('description', options.description);
    }

    if (options?.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    return FetchClient.makeDocumentUploadRequest<{ document: RefDocument }>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/image-ref-documents`,
      {
        method: 'POST',
        body: formData,
      }
    );
  }

  async createDocument(
    data: CreateDocumentRequest
  ): Promise<APIResponse<{ document: RefDocument }>> {
    return FetchClient.makeRequest<{ document: RefDocument }>(API_ENDPOINTS.REF_DOCUMENTS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDocument(
    documentId: string,
    includeRelations = false
  ): Promise<APIResponse<{ document: RefDocument }>> {
    const params = new URLSearchParams({
      include_relations: String(includeRelations),
    });
    return FetchClient.makeRequest<{ document: RefDocument }>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/${documentId}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async previewDocument(documentId: string): Promise<APIResponse<PreviewRefDocumentResponse>> {
    return FetchClient.makeRequest<PreviewRefDocumentResponse>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/${documentId}/preview`,
      {
        method: 'POST',
      }
    );
  }

  async publicPreviewDocument(s3Key: string): Promise<APIResponse<PublicPreviewDocumentResponse>> {
    return FetchClient.makeRequest<PublicPreviewDocumentResponse>(
      API_ENDPOINTS.REF_DOCUMENTS_PUBLIC_PREVIEW,
      {
        method: 'POST',
        body: JSON.stringify({ s3_key: s3Key }),
      }
    );
  }

  async listDocuments(
    createdBy: string,
    options?: {
      status?: ExtractionStatus;
      includeDeleted?: boolean;
      pagination?: PaginationParams;
    }
  ): Promise<APIResponse<ListDocumentsResponse>> {
    const params = new URLSearchParams({
      created_by: createdBy,
      include_deleted: String(options?.includeDeleted ?? false),
      skip: String(options?.pagination?.skip ?? 0),
      limit: String(options?.pagination?.limit ?? 100),
    });
    if (options?.status) {
      params.append('status', options.status);
    }
    return FetchClient.makeRequest<ListDocumentsResponse>(
      `${API_ENDPOINTS.REF_DOCUMENTS}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async updateDocument(
    data: UpdateDocumentRequest
  ): Promise<APIResponse<{ document: RefDocument }>> {
    return FetchClient.makeRequest<{ document: RefDocument }>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/${data.document_id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async triggerDocumentExtraction(
    documentId: string
  ): Promise<APIResponse<{ document: RefDocument }>> {
    return FetchClient.makeRequest<{ document: RefDocument }>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/${documentId}/extract`,
      {
        method: 'POST',
      }
    );
  }

  async deleteDocument(
    documentId: string,
    hardDelete = false
  ): Promise<APIResponse<DeleteResponse>> {
    const params = new URLSearchParams({ hard_delete: String(hardDelete) });
    return FetchClient.makeRequest<DeleteResponse>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/${documentId}?${params.toString()}`,
      {
        method: 'DELETE',
      }
    );
  }

  async searchDocuments(
    searchTerm: string,
    createdBy?: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListDocumentsResponse>> {
    const params = new URLSearchParams({
      search_term: searchTerm,
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    if (createdBy) {
      params.append('created_by', createdBy);
    }
    return FetchClient.makeRequest<ListDocumentsResponse>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/search?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async processDocumentExtraction(
    documentId: string,
    extractedText: string,
    success: boolean
  ): Promise<APIResponse<{ document: RefDocument }>> {
    return FetchClient.makeRequest<{ document: RefDocument }>(
      `${API_ENDPOINTS.REF_DOCUMENTS}/${documentId}/extract`,
      {
        method: 'POST',
        body: JSON.stringify({ extracted_text: extractedText, success }),
      }
    );
  }

  // ============================================================================
  // ANNOTATIONS
  // ============================================================================

  async autoAnnotateDocument(
    data: AutoAnnotateRefDocumentRequest
  ): Promise<APIResponse<AutoAnnotateRefDocumentResponse>> {
    return FetchClient.makeRequest<AutoAnnotateRefDocumentResponse>(
      `${API_ENDPOINTS.REF_AI}/auto-annotate`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async createAnnotation(
    data: CreateAnnotationRequest
  ): Promise<APIResponse<{ annotation: RefAnnotation }>> {
    return FetchClient.makeRequest<{ annotation: RefAnnotation }>(API_ENDPOINTS.REF_ANNOTATIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAnnotation(
    annotationId: string,
    includePositions = true
  ): Promise<APIResponse<{ annotation: RefAnnotation }>> {
    const params = new URLSearchParams({
      include_positions: String(includePositions),
    });
    return FetchClient.makeRequest<{ annotation: RefAnnotation }>(
      `${API_ENDPOINTS.REF_ANNOTATIONS}/${annotationId}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async listAnnotations(
    documentId: string,
    options?: {
      annotationType?: AnnotationType;
      createdBy?: string;
      includePositions?: boolean;
      pagination?: PaginationParams;
    }
  ): Promise<APIResponse<ListAnnotationsResponse>> {
    const params = new URLSearchParams({
      document_id: documentId,
      include_positions: String(options?.includePositions ?? false),
      skip: String(options?.pagination?.skip ?? 0),
      limit: String(options?.pagination?.limit ?? 100),
    });
    if (options?.annotationType) {
      params.append('annotation_type', options.annotationType);
    }
    if (options?.createdBy) {
      params.append('created_by', options.createdBy);
    }
    return FetchClient.makeRequest<ListAnnotationsResponse>(
      `${API_ENDPOINTS.REF_ANNOTATIONS}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async updateAnnotation(
    data: UpdateAnnotationRequest
  ): Promise<APIResponse<{ annotation: RefAnnotation }>> {
    return FetchClient.makeRequest<{ annotation: RefAnnotation }>(
      `${API_ENDPOINTS.REF_ANNOTATIONS}/${data.annotation_id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteAnnotation(annotationId: string): Promise<APIResponse<DeleteResponse>> {
    return FetchClient.makeRequest<DeleteResponse>(
      `${API_ENDPOINTS.REF_ANNOTATIONS}/${annotationId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // ============================================================================
  // TAGS
  // ============================================================================

  async createTag(data: CreateTagRequest): Promise<APIResponse<{ tag: RefTag }>> {
    return FetchClient.makeRequest<{ tag: RefTag }>(API_ENDPOINTS.REF_TAGS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createPredefinedTags(
    data: CreatePredefinedTagsRequest
  ): Promise<APIResponse<ListTagsResponse>> {
    return FetchClient.makeRequest<ListTagsResponse>(`${API_ENDPOINTS.REF_TAGS}/predefined`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTag(tagId: string): Promise<APIResponse<{ tag: RefTag }>> {
    return FetchClient.makeRequest<{ tag: RefTag }>(`${API_ENDPOINTS.REF_TAGS}/${tagId}`, {
      method: 'GET',
    });
  }

  async listTags(
    createdBy?: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListTagsResponse>> {
    const params = new URLSearchParams({
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    if (createdBy) {
      params.append('created_by', createdBy);
    }
    return FetchClient.makeRequest<ListTagsResponse>(
      `${API_ENDPOINTS.REF_TAGS}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async updateTag(data: UpdateTagRequest): Promise<APIResponse<{ tag: RefTag }>> {
    return FetchClient.makeRequest<{ tag: RefTag }>(`${API_ENDPOINTS.REF_TAGS}/${data.tag_id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(tagId: string): Promise<APIResponse<DeleteResponse>> {
    return FetchClient.makeRequest<DeleteResponse>(`${API_ENDPOINTS.REF_TAGS}/${tagId}`, {
      method: 'DELETE',
    });
  }

  async searchTags(
    searchTerm: string,
    createdBy?: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListTagsResponse>> {
    const params = new URLSearchParams({
      search_term: searchTerm,
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    if (createdBy) {
      params.append('created_by', createdBy);
    }
    return FetchClient.makeRequest<ListTagsResponse>(
      `${API_ENDPOINTS.REF_TAGS}/search?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async addTagToDocument(
    documentId: string,
    tagId: string,
    addedBy: string
  ): Promise<APIResponse<{ reference_tag: RefDocumentTag }>> {
    const endpoint = `${API_ENDPOINTS.REF_TAGS}/${documentId}/tags`;
    const payload = { document_id: documentId, tag_id: tagId, added_by: addedBy };

    console.log('Adding tag to document - Endpoint:', endpoint);
    console.log('Adding tag to document - Payload:', payload);

    return FetchClient.makeRequest<{ reference_tag: RefDocumentTag }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async removeTagFromDocument(
    documentId: string,
    tagId: string
  ): Promise<APIResponse<DeleteResponse>> {
    return FetchClient.makeRequest<DeleteResponse>(
      `${API_ENDPOINTS.REF_TAGS}/${documentId}/tags/${tagId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async listDocumentTags(
    documentId: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListTagsResponse>> {
    const params = new URLSearchParams({
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 50),
    });
    return FetchClient.makeRequest<ListTagsResponse>(
      `${API_ENDPOINTS.REF_TAGS}/${documentId}/tags?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async listDocumentsWithTag(
    tagId: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListDocumentsResponse>> {
    const params = new URLSearchParams({
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 50),
    });
    return FetchClient.makeRequest<ListDocumentsResponse>(
      `${API_ENDPOINTS.REF_TAGS}/${tagId}/documents?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async bulkAddTagsToDocument(data: BulkAddTagsRequest): Promise<APIResponse<BulkTagResponse>> {
    const { document_id, ...payload } = data;
    return FetchClient.makeRequest<BulkTagResponse>(
      `${API_ENDPOINTS.REF_TAGS}/${document_id}/tags/bulk`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
  }

  async bulkRemoveTagsFromDocument(
    documentId: string,
    tagIds: string[]
  ): Promise<APIResponse<DeleteResponse>> {
    return FetchClient.makeRequest<DeleteResponse>(
      `${API_ENDPOINTS.REF_TAGS}/${documentId}/tags/bulk`,
      {
        method: 'DELETE',
        body: JSON.stringify({ tag_ids: tagIds }),
      }
    );
  }

  // ============================================================================
  // NOTES
  // ============================================================================

  async createNote(data: CreateNoteRequest): Promise<APIResponse<{ note: RefNote }>> {
    return FetchClient.makeRequest<{ note: RefNote }>(API_ENDPOINTS.REF_NOTES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getNote(noteId: string): Promise<APIResponse<{ note: RefNote }>> {
    return FetchClient.makeRequest<{ note: RefNote }>(`${API_ENDPOINTS.REF_NOTES}/${noteId}`, {
      method: 'GET',
    });
  }

  async listNotes(
    documentId: string,
    userId?: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListNotesResponse>> {
    const params = new URLSearchParams({
      reference_id: documentId || '',
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    if (userId) {
      params.append('user_id', userId);
    }
    return FetchClient.makeRequest<ListNotesResponse>(
      `${API_ENDPOINTS.REF_NOTES}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async updateNote(data: UpdateNoteRequest): Promise<APIResponse<{ note: RefNote }>> {
    return FetchClient.makeRequest<{ note: RefNote }>(
      `${API_ENDPOINTS.REF_NOTES}/${data.note_id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteNote(noteId: string): Promise<APIResponse<DeleteResponse>> {
    return FetchClient.makeRequest<DeleteResponse>(`${API_ENDPOINTS.REF_NOTES}/${noteId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // DOCUMENT VERSIONS
  // ============================================================================

  async createVersion(
    data: CreateVersionRequest
  ): Promise<APIResponse<{ version: RefDocumentVersion }>> {
    return FetchClient.makeRequest<{ version: RefDocumentVersion }>(API_ENDPOINTS.REF_VERSIONS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVersion(versionId: string): Promise<APIResponse<{ version: RefDocumentVersion }>> {
    return FetchClient.makeRequest<{ version: RefDocumentVersion }>(
      `${API_ENDPOINTS.REF_VERSIONS}/${versionId}`,
      {
        method: 'GET',
      }
    );
  }

  async listVersions(
    documentId: string,
    pagination?: PaginationParams
  ): Promise<APIResponse<ListVersionsResponse>> {
    const params = new URLSearchParams({
      document_id: documentId,
      skip: String(pagination?.skip ?? 0),
      limit: String(pagination?.limit ?? 100),
    });
    return FetchClient.makeRequest<ListVersionsResponse>(
      `${API_ENDPOINTS.REF_VERSIONS}?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  async restoreVersion(
    versionId: string,
    restoredBy: string
  ): Promise<APIResponse<{ document: RefDocument }>> {
    return FetchClient.makeRequest<{ document: RefDocument }>(
      `${API_ENDPOINTS.REF_VERSIONS}/${versionId}/restore`,
      {
        method: 'POST',
        body: JSON.stringify({ restored_by: restoredBy }),
      }
    );
  }

  // ============================================================================
  // TIMELINE
  // ============================================================================

  async extractTimeline(
    data: DocumentTimelineRequestSchema
  ): Promise<APIResponse<DocumentTimelineResponseSchema>> {
    return FetchClient.makeRequest<DocumentTimelineResponseSchema>(API_ENDPOINTS.TIMELINE_EXTRACT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const referenceManagerService = new ReferenceManagerService();
