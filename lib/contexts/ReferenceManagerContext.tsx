'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Annotation, Note, ReferenceItem, ReferenceType } from '@/types/reference-manager';
import {
  RefCollection,
  RefFolder,
  RefDocument,
  ReferenceTypeEnum,
  PaginationParams,
  CreateAnnotationRequest,
  CollectionHierarchyResponse,
  CreateDocumentRequest,
} from '@/types/reference-manager-api';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { useAuth } from './AuthContext';
import { ReferenceTypeToAPI, apiEnumToUIType } from '@/lib/utils/referenceTypeMapper';
import { useNotificationSound } from '@/hooks/common/useNotificationSound';
import { useSettings } from '@/lib/contexts/SettingsContext';
import { playNotificationSound, primeNotificationSound } from '@/lib/utils/notificationSound';
import type { ImageType } from '@/types/image';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';

export type Collection = {
  id: string;
  title: string;
  icon?: string;
};

export type Folder = {
  id: string;
  title: string;
  icon?: string;
};

export interface Tag {
  id: string;
  label: string;
  color: string;
}

interface ReferenceManagerContextType {
  // State
  collections: Collection[];
  foldersByCollection: Record<string, Folder[]>;
  references: ReferenceItem[];
  trashedReferences: ReferenceItem[];
  tags: Tag[];
  expandedFolders: string[];
  selectedCollectionId: string | null;
  selectedFolderId: string | null;
  selectedReferenceId: string | null;
  isRenaming: boolean;
  error: string | null;
  isLoading: boolean;

  // Computed
  selectedReference: ReferenceItem | null;
  filteredReferences: ReferenceItem[];
  searchQuery: string;

  // Collection Actions
  addCollection: () => Promise<void>;
  renameCollection: (id: string, newTitle: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  selectCollection: (id: string) => void;

  // Folder Actions
  addFolderToCollection: (
    collectionId: string,
    title?: string,
    type?: ReferenceTypeEnum
  ) => Promise<string>;
  renameFolder: (collectionId: string, folderId: string, newTitle: string) => Promise<void>;
  deleteFolder: (collectionId: string, folderId: string) => Promise<void>;
  selectFolder: (collectionId: string, folderId: string) => void;
  toggleFolder: (folderId: string) => void;

  // Reference Actions
  uploadFile: (file: File) => Promise<void>;
  uploadUrls: (urls: string[]) => Promise<void>;
  attachFileToReference: (referenceId: string, file: File) => Promise<void>;
  attachUrlToReference: (referenceId: string, url: string) => Promise<void>;
  unlinkFileFromReference: (referenceId: string) => Promise<void>;
  addReference: (
    collectionId: string,
    folderId: string,
    ref: Omit<ReferenceItem, 'id' | 'collectionId' | 'folderId'>,
    refId?: string
  ) => Promise<string>;
  updateReference: (id: string, updates: Partial<ReferenceItem>) => Promise<void>;
  deleteReference: (id: string) => Promise<void>;
  restoreReference: (id: string) => Promise<void>;
  hardDeleteReference: (id: string) => Promise<void>;
  createEmptyReference: (type: ReferenceType, refId?: string) => Promise<void>;
  createBackendReference: (type: ReferenceType, iconId?: string) => Promise<string | undefined>;
  selectReference: (id: string) => void;
  getReference: (id: string) => ReferenceItem | undefined;
  updateAnnotation: (
    referenceId: string,
    annotationId: string,
    updates: Partial<Annotation>
  ) => void;
  changeCollectionIcon: (id: string, icon: string) => void;
  changeFolderIcon: (collectionId: string, folderId: string, icon: string) => void;

  // Note Actions
  addIndependentNote: (referenceId: string, content: string) => Promise<void>;
  editNote: (referenceId: string, noteId: string, newContent: string) => Promise<void>;
  deleteNote: (referenceId: string, noteId: string) => Promise<void>;

  // Tag Actions
  createTag: () => void;
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setIsRenaming: React.Dispatch<React.SetStateAction<boolean>>;

  // Error handling & search
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;

  // NEW: Collection Actions
  getCollectionHierarchy: (
    collectionId: string
  ) => Promise<CollectionHierarchyResponse | undefined>;
  getCollectionStatistics: (collectionId: string) => Promise<any>;
  searchCollections: (searchTerm: string, pagination?: PaginationParams) => Promise<void>;

  // NEW: Folder Actions
  moveFolderToCollection: (folderId: string, targetCollectionId: string) => Promise<void>;
  reorderFolders: (
    collectionId: string,
    folderOrders: Array<{ folder_id: string; sort_order: number }>
  ) => Promise<void>;
  reorderDocumentsInFolder: (
    folderId: string,
    documentOrders: Array<{ document_id: string; sort_order: number }>
  ) => Promise<void>;
  removeDocumentFromFolder: (folderId: string, documentId: string) => Promise<void>;

  // NEW: Reference Actions
  searchReferences: (searchTerm: string, pagination?: PaginationParams) => Promise<void>;
  getReferenceWithDocuments: (referenceId: string) => Promise<any>;
  detachReference: (referenceId: string) => Promise<void>;

  // NEW: Document Actions
  getDocument: (documentId: string, includeRelations?: boolean) => Promise<any>;
  processDocumentExtraction: (
    documentId: string,
    extractedText: string,
    success: boolean
  ) => Promise<void>;

  // NEW: Annotation Actions
  createAnnotation: (
    documentId: string,
    data: Omit<CreateAnnotationRequest, 'document_id' | 'created_by'>
  ) => Promise<void>;
  getAnnotation: (annotationId: string, includePositions?: boolean) => Promise<any>;
  listAnnotations: (documentId: string, options?: any) => Promise<void>;
  deleteAnnotation: (annotationId: string) => Promise<void>;

  // NEW: Tag Actions (beyond existing createTag)
  getTag: (tagId: string) => Promise<any>;
  updateTag: (tagId: string, updates: { name?: string; color?: string }) => Promise<void>;
  deleteTag: (tagId: string) => Promise<void>;
  searchTagsAPI: (searchTerm: string, pagination?: PaginationParams) => Promise<void>;
  addTagToDocument: (documentId: string, tagId: string) => Promise<void>;
  removeTagFromDocument: (documentId: string, tagId: string) => Promise<void>;
  listDocumentTags: (documentId: string, pagination?: PaginationParams) => Promise<any>;
  listDocumentsWithTag: (tagId: string, pagination?: PaginationParams) => Promise<any>;
  bulkAddTagsToDocument: (documentId: string, tagIds: string[]) => Promise<void>;
  bulkRemoveTagsFromDocument: (documentId: string, tagIds: string[]) => Promise<void>;

  // NEW: Note Actions (beyond existing addIndependentNote, editNote, deleteNote)
  getNote: (noteId: string) => Promise<any>;
  listNotes: (referenceId: string, pagination?: PaginationParams) => Promise<void>;

  // NEW: Document Version Actions
  createVersion: (
    documentId: string,
    metadataSnapshot?: string,
    diffData?: string
  ) => Promise<void>;
  getVersion: (versionId: string) => Promise<any>;
  listVersions: (documentId: string, pagination?: PaginationParams) => Promise<any>;
  restoreVersion: (versionId: string) => Promise<void>;
}

const ReferenceManagerContext = createContext<ReferenceManagerContextType | undefined>(undefined);

export function ReferenceManagerProvider({ children }: { children: ReactNode }) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>(['collections']);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const userId = user?.user_id || '';
  const { playSuccess } = useNotificationSound();
  const { settings } = useSettings();

  const [tags, setTags] = useState<Tag[]>([]);

  const [collections, setCollections] = useState<Collection[]>([
    { id: 'collections', title: 'Collections' },
  ]);
  const [foldersByCollection, setFoldersByCollection] = useState<Record<string, Folder[]>>({
    collections: [{ id: 'f-a-1', title: 'Subfolder A1' }],
  });
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [trashedReferences, setTrashedReferences] = useState<ReferenceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const taskWsRef = useRef<WebSocket | null>(null);

  // Type mapping helpers (incoming from API only)

  // Removed local enum-to-type mapper in favor of centralized util

  // Convert API types to UI types
  const convertCollectionToUI = (apiCollection: RefCollection): Collection => ({
    id: apiCollection.id,
    title: apiCollection.name,
    icon: undefined, // Store icon separately in metadata if needed
  });

  const convertFolderToUI = (apiFolder: RefFolder): Folder => ({
    id: apiFolder.id,
    title: apiFolder.name,
    icon: undefined,
  });

  const convertDocumentToUI = (apiDoc: RefDocument): ReferenceItem => {
    if (!apiDoc) {
      console.warn('convertDocumentToUI received undefined/null document');
      return {
        id: 'invalid',
        type: 'general_document',
        title: 'Invalid Document',
        metadata: {},
        document_source_type: 'weblink',
        createdAt: new Date().toISOString(),
      } as ReferenceItem;
    }

    let type: ReferenceType = 'general_document';
    let collectionId: string | undefined = undefined;
    let folderId: string | undefined = undefined;
    const docAny = apiDoc as any;

    try {
      const rawMetadata: any = (apiDoc as any).metadata;
      const meta =
        typeof rawMetadata === 'string'
          ? rawMetadata
            ? JSON.parse(rawMetadata)
            : {}
          : rawMetadata && typeof rawMetadata === 'object'
            ? rawMetadata
            : {};
      const typeStr = meta.type || 'DOCUMENT';
      type = apiEnumToUIType(typeStr);
      collectionId = meta.collection_id || meta.collectionId || undefined;
      folderId = meta.folder_id || meta.folderId || undefined;
    } catch (e) {
      console.warn('Failed to parse document metadata:', e);
    }

    const rawMetadata: any = docAny.metadata;
    const parsedMetadata =
      typeof rawMetadata === 'string'
        ? rawMetadata
          ? JSON.parse(rawMetadata)
          : {}
        : rawMetadata && typeof rawMetadata === 'object'
          ? rawMetadata
          : {};

    return {
      id: docAny.id,
      documentId: docAny.id,
      type,
      title: docAny.name ?? docAny.title,
      metadata: parsedMetadata,
      document_source_type: docAny.document_source_type === 'FILE' ? 'file' : 'weblink',
      file_url: docAny.file_url,
      s3_key: docAny.s3_key,
      web_url: docAny.web_url,
      size: docAny.size ? `${docAny.size} bytes` : undefined,
      createdAt: docAny.created_at,
      modifiedAt: docAny.updated_at,
      // Prefer explicit mapping from metadata if available; otherwise these
      // will be populated via folder-document lookup code.
      collectionId,
      folderId,
      refId: docAny.ref_id,
    };
  };

  // Load initial data only when userId is available
  useEffect(() => {
    if (!userId) return;
    loadCollections();
    loadTags();
    loadAllDocumentsForUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const response = await referenceManagerService.listCollections(userId);

      if (!response || !response.success) {
        console.warn('listCollections returned unexpected response', response);
        setError('Failed to load collections');
        return;
      }

      if (!response.data || !Array.isArray(response.data.collections)) {
        console.warn('listCollections missing data.collections', response);
        setCollections([{ id: 'collections', title: 'Collections' }]);
        return;
      }

      const activeCollections = response.data.collections.filter((col) => !col.is_deleted);
      const uiCollections = activeCollections.map(convertCollectionToUI);
      setCollections([{ id: 'collections', title: 'Collections' }, ...uiCollections]);

      // Load folders for each collection
      for (const collection of response.data.collections) {
        await loadFoldersForCollection(collection.id);
      }
    } catch (err) {
      setError('Failed to load collections');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFoldersForCollection = async (collectionId: string) => {
    try {
      const response = await referenceManagerService.listFolders(collectionId);

      if (!response || !response.success) {
        console.warn('listFolders returned unexpected response for', collectionId, response);
        return;
      }

      const data = response.data;
      const foldersArray = Array.isArray(data?.folders)
        ? data.folders
        : Array.isArray(data)
          ? data
          : [];

      if (!foldersArray.length) {
        console.warn('listFolders missing folder array for', collectionId, response);
        setFoldersByCollection((prev) => ({ ...prev, [collectionId]: [] }));
        return;
      }

      const uiFolders = foldersArray.map(convertFolderToUI);
      setFoldersByCollection((prev) => ({
        ...prev,
        [collectionId]: uiFolders,
      }));

      // ✅ SAFE: foldersArray is guaranteed here
      for (const folder of foldersArray) {
        await loadDocumentsForFolder(collectionId, folder.id);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  };

  const loadDocumentsForFolder = async (collectionId: string, folderId: string) => {
    const allResp = await referenceManagerService.listDocuments(userId, {
      includeDeleted: false,
    });
    if (allResp?.success && Array.isArray(allResp.data?.documents)) {
      const docsForFolder = allResp.data.documents
        .filter((doc) => {
          try {
            const rawMetadata: any = (doc as any).metadata;
            const meta =
              typeof rawMetadata === 'string'
                ? rawMetadata
                  ? JSON.parse(rawMetadata)
                  : {}
                : rawMetadata && typeof rawMetadata === 'object'
                  ? rawMetadata
                  : {};
            const fId = meta.folder_id || meta.folderId;
            return fId === folderId;
          } catch {
            return false;
          }
        })
        .map((doc) => ({
          ...convertDocumentToUI(doc),
          collectionId,
          folderId,
        }));

      setReferences((prev) => {
        const filtered = prev.filter((r) => r.folderId !== folderId);
        return [...filtered, ...docsForFolder];
      });
    }
  };

  // Fetch tags for selected reference - REMOVED per user request to move to InfoPanel
  // useEffect(() => { ... }, []);

  const loadTags = async () => {
    try {
      const response = await referenceManagerService.listTags();

      if (!response || !response.success) {
        console.warn('listTags returned unexpected response', response);
        return;
      }

      // Backend may return tags in different shapes:
      // 1) { tags: [...] }
      // 2) { data: { tags: [...] } }
      // 3) { success: true, data: [...tags] }
      const data: any = (response as any).data ?? response;
      const tagsArray: any[] = Array.isArray(data?.tags)
        ? data.tags
        : Array.isArray(data)
          ? data
          : Array.isArray((response as any).tags)
            ? (response as any).tags
            : [];

      if (!tagsArray.length) {
        console.warn('listTags missing tag array in expected locations', response);
        setTags([]);
        return;
      }

      const uiTags = tagsArray.map((tag: any) => ({
        id: tag.id,
        label: tag.name,
        color: tag.color || '#000000',
      }));
      setTags(uiTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
      setError('Failed to load tags');
    }
  };

  // Load all documents created by the current user so that references
  // (including trashed ones) reappear correctly after a page reload,
  // even if folder loading has issues.
  const loadAllDocumentsForUser = async () => {
    if (!userId) return;

    try {
      const response = await referenceManagerService.listDocuments(userId, {
        includeDeleted: true,
      });

      if (!response || !response.success) {
        console.warn('listDocuments returned unexpected response', response);
        return;
      }

      if (!response.data || !Array.isArray(response.data.documents)) {
        console.warn('listDocuments missing data.documents', response);
        return;
      }

      const activeDocs = response.data.documents.filter((doc) => !doc.is_deleted);
      const trashedDocs = response.data.documents.filter((doc) => doc.is_deleted);

      const uiActive = activeDocs.map((doc) => convertDocumentToUI(doc));
      const uiTrashed = trashedDocs.map((doc) => convertDocumentToUI(doc));

      // Link children to parents (populate documentId for parents that have file children)
      uiActive.forEach((doc) => {
        if (doc.refId && doc.s3_key) {
          const parent = uiActive.find((p) => p.id === doc.refId);
          if (parent) {
            parent.documentId = doc.id;
            // Ensure parent knows it has a file so UI shows it (e.g. icon, etc.)
            if (!parent.s3_key) parent.s3_key = doc.s3_key;
          }
        }
      });

      setReferences((prev) => {
        const prevMap = new Map(prev.map((r) => [r.id, r]));
        uiActive.forEach((r) => prevMap.set(r.id, r));
        return Array.from(prevMap.values());
      });

      setTrashedReferences((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const merged = uiTrashed.filter((r) => !existingIds.has(r.id));
        return [...prev, ...merged];
      });
    } catch (err) {
      console.error('Failed to load user documents:', err);
      setError('Failed to load user documents');
    }
  };

  // Helper Functions
  const generateRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Collection Actions
  const addCollection = async () => {
    try {
      setIsLoading(true);
      const response = await referenceManagerService.createCollection({
        name: 'New Collection',
        owner_id: userId,
      });

      if (response && response.success && response.data) {
        // Backend may return either `{ collection: {...} }` or the collection object directly.
        const apiCollection = response.data.collection ? response.data.collection : response.data;
        const newCollection = convertCollectionToUI(apiCollection as any);

        setCollections((prev) => {
          const idx = prev.findIndex((n) => n.id === 'collections');
          if (idx === -1) return [...prev, newCollection];
          const copy = [...prev];
          copy.splice(idx + 1, 0, newCollection);
          return copy;
        });

        if (!expandedFolders.includes('collections')) {
          setExpandedFolders((prev) => [...prev, 'collections']);
        }

        setSelectedCollectionId(newCollection.id);
        setSelectedFolderId(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to create collection: ${msg}`);
      console.error('Failed to create collection', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renameCollection = async (id: string, newTitle: string) => {
    // When newTitle is empty, this call is coming from the context menu to *start* renaming.
    // We only update local state to trigger inline rename and avoid sending an invalid payload.
    if (!newTitle.trim()) {
      setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, title: '' } : c)));
      setIsRenaming(true);
      return;
    }

    try {
      const response = await referenceManagerService.updateCollection({
        collection_id: id,
        owner_id: userId,
        name: newTitle,
      });

      if (response && response.success && response.data && response.data.collection) {
        const updated = convertCollectionToUI(response.data.collection);
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c))
        );
        await loadCollections();
      } else if (response && response.success) {
        setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
        await loadCollections();
      } else {
        console.warn('updateCollection returned unexpected response', response);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to rename collection: ${msg}`);
      console.error('Failed to rename collection', err);
    }
  };

  const changeCollectionIcon = (id: string, newIcon: string) => {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, icon: newIcon } : c)));
  };

  const changeFolderIcon = (collectionId: string, folderId: string, newIcon: string) => {
    setFoldersByCollection((prev) => ({
      ...prev,
      [collectionId]: (prev[collectionId] || []).map((f) =>
        f.id === folderId ? { ...f, icon: newIcon } : f
      ),
    }));
  };

  const deleteCollection = async (id: string) => {
    try {
      const response = await referenceManagerService.deleteCollection(id, userId, false);

      if (response.success) {
        const refsToTrash = references.filter((r) => r.collectionId === id);
        if (refsToTrash.length > 0) {
          setTrashedReferences((prev) => [...prev, ...refsToTrash]);
        }

        setReferences((prev) => prev.filter((r) => r.collectionId !== id));
        setFoldersByCollection((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        setCollections((prev) => prev.filter((c) => c.id !== id));
        setExpandedFolders((prev) => prev.filter((x) => x !== id));

        if (selectedCollectionId === id) {
          setSelectedCollectionId(null);
          setSelectedFolderId(null);
        }
        // Refresh collections from server to ensure deleted items don't reappear
        await loadCollections();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete collection: ${msg}`);
      console.error('Failed to delete collection', err);
    }
  };

  const selectCollection = (id: string) => {
    setSelectedCollectionId(id);
    setSelectedFolderId(null);
    setSelectedReferenceId(null);
  };

  // Folder Actions
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const addFolderToCollection = async (
    collectionId: string,
    title = 'New Folder',
    type: ReferenceTypeEnum = 'DOCUMENT'
  ): Promise<string> => {
    try {
      const response = await referenceManagerService.createFolder({
        collection_id: collectionId,
        name: title,
        type,
        created_by: userId,
      });

      if (response.success && response.data) {
        const newFolder = convertFolderToUI(response.data.folder);

        setFoldersByCollection((prev) => ({
          ...prev,
          [collectionId]: [...(prev[collectionId] || []), newFolder],
        }));

        if (!expandedFolders.includes(collectionId)) {
          setExpandedFolders((prev) => [...prev, collectionId]);
        }

        return newFolder.id;
      }
      throw new Error('Failed to create folder');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to create folder: ${msg}`);
      console.error('Failed to create folder', err);
      throw err;
    }
  };

  const renameFolder = async (collectionId: string, folderId: string, newTitle: string) => {
    // Empty title from context menu indicates the user is about to type a new name.
    // Only update local state so CollectionNode can show the inline input.
    if (!newTitle.trim()) {
      setFoldersByCollection((prev) => ({
        ...prev,
        [collectionId]: (prev[collectionId] || []).map((f) =>
          f.id === folderId ? { ...f, title: '' } : f
        ),
      }));
      return;
    }

    try {
      const response = await referenceManagerService.updateFolder({
        folder_id: folderId,
        name: newTitle,
      });

      if (response.success) {
        setFoldersByCollection((prev) => ({
          ...prev,
          [collectionId]: (prev[collectionId] || []).map((f) =>
            f.id === folderId ? { ...f, title: newTitle } : f
          ),
        }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to rename folder: ${msg}`);
      console.error('Failed to rename folder', err);
    }
  };

  const deleteFolder = async (collectionId: string, folderId: string) => {
    try {
      const response = await referenceManagerService.deleteFolder(folderId, false);

      if (response.success) {
        const refsToTrash = references.filter(
          (r) => r.folderId === folderId && r.collectionId === collectionId
        );
        if (refsToTrash.length > 0) {
          setTrashedReferences((prev) => [...prev, ...refsToTrash]);
        }

        setFoldersByCollection((prev) => ({
          ...prev,
          [collectionId]: (prev[collectionId] || []).filter((f) => f.id !== folderId),
        }));

        setReferences((prev) => prev.filter((r) => r.folderId !== folderId));

        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to delete folder: ${msg}`);
      console.error('Failed to delete folder', err);
    }
  };

  const selectFolder = (collectionId: string, folderId: string) => {
    setSelectedCollectionId(collectionId);
    setSelectedFolderId(folderId);
    setSelectedReferenceId(null);
  };

  const imageMimeByExtension: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    tiff: 'image/tiff',
    tif: 'image/tiff',
    ico: 'image/x-icon',
    heic: 'image/heic',
    heif: 'image/heif',
  };

  const inferContentType = (file: File) => {
    if (file.type) return file.type;
    const extension = file.name.toLowerCase().split('.').pop();
    if (extension && imageMimeByExtension[extension]) {
      return imageMimeByExtension[extension];
    }
    return extension === 'pdf' ? 'application/pdf' : 'application/octet-stream';
  };

  const isImageFile = (file: File) => {
    if (file.type && file.type.startsWith('image/')) return true;
    const extension = file.name.toLowerCase().split('.').pop();
    return Boolean(extension && imageMimeByExtension[extension]);
  };

  const initUploadForReference = async (file: File) => {
    if (!userId) {
      throw new Error('User not authenticated.');
    }

    const contentType = inferContentType(file);

    if (isImageFile(file)) {
      const imageType: ImageType = 'workspace_image';
      const initImage = await referenceManagerService.initImageUpload({
        file_name: file.name,
        file_size: file.size,
        file_type: contentType,
        image_type: imageType,
        checksum: '',
      });

      if (!initImage.success || !initImage.data?.presigned_url || !initImage.data?.image_id) {
        throw new Error('Failed to initialize image upload');
      }

      const imageId = initImage.data.image_id;
      const s3Key = `users/${userId}/${imageType}/${imageId}/${file.name}`;

      return {
        presignedUrl: initImage.data.presigned_url,
        s3Key,
        contentType,
        imageId,
        usesImageFlow: true,
      };
    }

    const init = await referenceManagerService.initUpload(userId, [
      {
        name: file.name,
        size: file.size,
        type: contentType,
      },
    ]);

    if (!init.success || !init.data?.files?.length) {
      throw new Error('Failed to initialize upload');
    }

    const { presigned_url, s3_key } = init.data.files[0];

    return {
      presignedUrl: presigned_url,
      s3Key: s3_key,
      contentType,
      usesImageFlow: false,
    };
  };

  const startTaskWebSocket = async (createDocRes: any) => {
    try {
      let taskId = createDocRes?.data?.task_id;
      if (!taskId) {
        const metadataStr = createDocRes?.data?.document?.metadata;
        if (metadataStr) {
          try {
            const meta = typeof metadataStr === 'string' ? JSON.parse(metadataStr) : metadataStr;
            taskId = meta?.task_id;
          } catch (e) {
            console.error('Failed to parse metadata', e);
          }
        }
      }

      if (!taskId) return;

      let token = createDocRes?.data?.token || '';
      if (!token && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, ...rest] = cookie.trim().split('=');
          if (name === STORAGE_KEYS.ACCESS_TOKEN) {
            token = decodeURIComponent(rest.join('='));
            break;
          }
        }
      }

      if (!token) {
        console.error('No access token found for WebSocket connection');
        return;
      }

      // Set cookie for WebSocket authentication (backend requirement)
      // Secure flag required for HTTPS in production, SameSite=Strict for CSRF protection
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      document.cookie = `ws_access_token=${token}; path=/; max-age=3600; SameSite=Strict${isSecure ? '; Secure' : ''}`;
      const taskWsBase = process.env.NEXT_PUBLIC_TASK_WS_URL || 'ws://localhost:8000/ws/tasks';
      const wsUrl = `${taskWsBase}/${taskId}?token=${token}`;

      const ws = new WebSocket(wsUrl);
      taskWsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data?.status === 'COMPLETED' || data?.status === 'FAILED') {
            ws.close();
          }
        } catch (e) {
          console.error('Error parsing task WebSocket message:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('Task WebSocket error:', error);
      };

      ws.onclose = () => {
        if (taskWsRef.current === ws) {
          taskWsRef.current = null;
        }
      };
    } catch (e) {
      console.error('Error starting task WebSocket:', e);
    }
  };

  const uploadFile = async (file: File) => {
    if (!userId || !selectedFolderId) {
      setError('Select a folder before uploading.');
      return;
    }

    setIsLoading(true);
    if (settings.notifications.soundEnabled) {
      void primeNotificationSound(settings.notifications.soundChoice);
    }

    try {
      const refRes = await referenceManagerService.createReference({
        title: file.name,
        type: 'DOCUMENT',
        created_by: userId,
        folder_id: selectedFolderId,
      });

      if (!refRes.success || !refRes.data?.reference) {
        throw new Error('Failed to create reference');
      }

      const refId = refRes.data.reference.id;

      const initUpload = await initUploadForReference(file);

      const { presignedUrl, s3Key, contentType, imageId, usesImageFlow } = initUpload;

      const refDocPromise = usesImageFlow
        ? referenceManagerService.createImageRefDocument(refId, file).catch((err) => {
            return null;
          })
        : null;

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage');
      }

      if (usesImageFlow && imageId) {
        const completeResp = await referenceManagerService.completeImageUpload({
          image_id: imageId,
          user_id: userId,
        });
      }

      if (usesImageFlow) {
        const refDocResponse = await refDocPromise;
        if (!refDocResponse || !(refDocResponse as any).success) {
          throw new Error('Failed to create image reference document');
        }

        await startTaskWebSocket(refDocResponse);
        await loadDocumentsForFolder(selectedCollectionId!, selectedFolderId);
        playSuccess();
        return;
      }

      // Create document record in DB after successful upload
      // Log the payload before sending
      const payload: CreateDocumentRequest = {
        title: file.name,
        created_by: userId,
        s3_key: s3Key,
        file_type: contentType,
        file_size: file.size,
        folder_id: selectedFolderId,
        reference_id: refId,
      };

      const createDocRes = await referenceManagerService.createDocument(payload);

      if (!createDocRes.success) {
        throw new Error('Failed to create document record in database');
      }

      await loadDocumentsForFolder(selectedCollectionId!, selectedFolderId);
      playSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Upload failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadUrls = async (urls: string[]) => {
    if (!selectedCollectionId || !selectedFolderId) {
      setError('Select a collection folder before adding URLs.');
      return;
    }

    setIsLoading(true);
    try {
      for (const url of urls) {
        await addReference(selectedCollectionId, selectedFolderId, {
          type: 'general_document',
          title: url,
          metadata: {},
          document_source_type: 'weblink',
          web_url: url,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('URL upload failed', err);
      setError('Failed to add URLs.');
    } finally {
      setIsLoading(false);
    }
  };

  const attachFileToReference = async (referenceId: string, file: File) => {
    if (!userId) {
      setError('User not authenticated.');
      return;
    }
    if (settings.notifications.soundEnabled) {
      void primeNotificationSound(settings.notifications.soundChoice);
    }
    try {
      const resolveRefId = async (id: string): Promise<string> => {
        try {
          const refResp = await referenceManagerService.getReference(id);
          if (refResp.success && refResp.data?.reference?.id) {
            return id;
          }
        } catch {}
        try {
          const resp = await referenceManagerService.getDocument(id, true);
          const doc: any = resp?.data?.document;
          if (resp.success && doc) {
            try {
              const meta =
                doc.metadata && typeof doc.metadata === 'string'
                  ? JSON.parse(doc.metadata)
                  : doc.metadata || {};
              if (meta.reference_id) return meta.reference_id;
            } catch {}
          }
        } catch {}
        return id;
      };

      let ensuredRefId = await resolveRefId(referenceId);

      try {
        const refCheck = await referenceManagerService.getReference(ensuredRefId);
        if (!refCheck.success || !refCheck.data?.reference?.id) {
          if (!selectedFolderId) {
            throw new Error('No folder selected');
          }
          const created = await referenceManagerService.createReference({
            title: file.name,
            type: 'DOCUMENT',
            created_by: userId,
            folder_id: selectedFolderId,
          });
          if (!created.success || !created.data?.reference?.id) {
            throw new Error('Failed to create reference');
          }
          ensuredRefId = created.data.reference.id;
        }
      } catch {}

      const initUpload = await initUploadForReference(file);

      const { presignedUrl, s3Key, contentType, imageId, usesImageFlow } = initUpload;

      const refDocPromise = usesImageFlow
        ? referenceManagerService.createImageRefDocument(ensuredRefId, file).catch((err) => {
            return null;
          })
        : null;

      const uploadRes = await fetch(`/api/proxy-upload?url=${encodeURIComponent(presignedUrl)}`, {
        method: 'POST',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Create document record
      if (usesImageFlow && imageId) {
        const completeResp = await referenceManagerService.completeImageUpload({
          image_id: imageId,
          user_id: userId,
        });
      }

      let newDocId: string | undefined;
      let isSuccess = false;

      if (usesImageFlow) {
        const refDocResponse = await refDocPromise;
        if (!refDocResponse || !(refDocResponse as any).success) {
          throw new Error('Failed to create image reference document');
        }
        await startTaskWebSocket(refDocResponse);

        const createdDoc = (refDocResponse as any).data?.document as any;
        newDocId = createdDoc?.id || createdDoc?.document_id;
        isSuccess = true;
      } else {
        const payload: CreateDocumentRequest = {
          title: file.name,
          created_by: userId,
          s3_key: s3Key,
          file_type: contentType,
          file_size: file.size,
          reference_id: ensuredRefId,
        };

        const createResp = await referenceManagerService.createDocument(payload);

        // Capture the new document ID from response
        newDocId =
          createResp.success && (createResp.data as any)?.document?.id
            ? (createResp.data as any).document.id
            : (createResp.data as any)?.id;

        isSuccess = createResp.success;
      }

      // Update local state - the document was already created by initUpload
      // and extraction will be triggered automatically after a short delay
      setReferences((prev) =>
        prev.map((ref) =>
          ref.id === ensuredRefId
            ? {
                ...ref,
                s3_key: s3Key,
                web_url: undefined,
                document_source_type: 'file',
                fileName: file.name,
                modifiedAt: new Date().toISOString(),
                documentId: newDocId || ref.documentId, // Store child ID
              }
            : ref
        )
      );
      if (isSuccess) {
        playSuccess();
      }
    } catch (err) {
      console.error('Attach file failed', err);
      setError('Failed to attach file.');
      throw err;
    }
  };

  const attachUrlToReference = async (referenceId: string, url: string) => {
    try {
      // Get the reference to extract its type
      const ref = references.find((r) => r.id === referenceId);
      const refType = ref?.type ? ReferenceTypeToAPI[ref.type] : 'DOCUMENT';

      // Create a new document with the web_url - this will trigger extraction
      const response = await referenceManagerService.createDocument({
        title: url,
        created_by: userId,
        s3_key: '',
        file_type: 'text/html',
        file_size: 0,
        reference_id: referenceId,
        metadata: {
          web_url: url,
          type: refType,
        },
      });

      if (response.success) {
        // Update local state
        setReferences((prev) =>
          prev.map((r) =>
            r.id === referenceId
              ? {
                  ...r,
                  web_url: url,
                  file_url: undefined,
                  s3_key: undefined,
                  document_source_type: 'weblink',
                  modifiedAt: new Date().toISOString(),
                }
              : r
          )
        );
      } else {
        setError('Failed to attach URL to reference.');
      }
    } catch (err) {
      console.error('Attach URL failed', err);
      setError('Failed to attach URL.');
      throw err;
    }
  };

  const unlinkFileFromReference = async (referenceId: string) => {
    try {
      const response = await referenceManagerService.detachReference(referenceId);
      if (response && response.success) {
        setReferences((prev) =>
          prev.map((r) =>
            r.id === referenceId
              ? {
                  ...r,
                  file_url: undefined,
                  s3_key: undefined,
                  web_url: undefined,
                  fileName: undefined,
                  modifiedAt: new Date().toISOString(),
                }
              : r
          )
        );
      } else {
        setError('Failed to unlink file from reference.');
        throw new Error('Failed to unlink file from reference.');
      }
    } catch (err) {
      setError('Failed to unlink file.');
      throw err;
    }
  };

  // Reference Actions
  const addReference = async (
    collectionId: string,
    folderId: string,
    ref: Omit<ReferenceItem, 'id' | 'collectionId' | 'folderId'>,
    refId?: string
  ): Promise<string> => {
    try {
      // Create document
      const createResponse = await referenceManagerService.createDocument({
        title: ref.title,
        created_by: userId,
        folder_id: refId ? undefined : folderId,
        reference_id: refId,
        s3_key: ref.s3_key ?? '',
        file_type: ref.document_source_type === 'file' ? 'application/pdf' : 'text/html',
        file_size: 0,
        metadata: {
          ...ref.metadata,
          type: ReferenceTypeToAPI[ref.type],
          // Persist location hints so reload can reconstruct even if
          // folder-document mapping fails for some legacy data.
          collection_id: collectionId,
          folder_id: folderId,
          file_url: ref.file_url,
          web_url: ref.web_url,
        },
      });

      if (createResponse && createResponse.success && createResponse.data) {
        // Backend may return `{ document: {...} }` or the document directly
        const apiDoc = createResponse.data.document
          ? createResponse.data.document
          : createResponse.data;
        const docId = (apiDoc as any).id;

        // When refId is not provided (legacy path), explicitly add document to folder via REST API
        if (!refId) {
          await referenceManagerService.addDocumentToFolder({
            folder_id: folderId,
            document_id: docId,
            added_by: userId,
          });
        }

        const newRef: ReferenceItem = {
          ...ref,
          id: docId,
          collectionId,
          folderId,
          createdAt: new Date().toISOString(),
        };

        setReferences((prev) => [...prev, newRef]);
        return docId;
      }
      throw new Error('Failed to create document');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to add reference: ${msg}`);
      console.error('Failed to add reference', err);
      throw err;
    }
  };

  const updateReference = async (id: string, updates: Partial<ReferenceItem>) => {
    try {
      const hasIsLink = Object.prototype.hasOwnProperty.call(updates, 'is_link');
      const hasIconId = Object.prototype.hasOwnProperty.call(updates, 'icon_id');
      if (hasIsLink || hasIconId) {
        await referenceManagerService.updateReference(id, {
          is_link: (updates as any).is_link,
          icon_id: (updates as any).icon_id,
        });
      }
      if (updates.title || updates.metadata) {
        await referenceManagerService.updateDocument({
          document_id: id,
          title: updates.title,
          metadata:
            updates.metadata && typeof updates.metadata === 'object' ? updates.metadata : undefined,
        });
      }
      setReferences((prev) =>
        prev.map((ref) =>
          ref.id === id
            ? {
                ...ref,
                title: updates.title ?? ref.title,
                metadata: updates.metadata ?? ref.metadata,
                modifiedAt: new Date().toISOString(),
              }
            : ref
        )
      );
    } catch (err) {
      setError('Failed to update reference');
    }
  };

  const deleteReference = async (id: string) => {
    try {
      const response = await referenceManagerService.deleteReference(id, false);
      if (response.success) {
        const ref = references.find((r) => r.id === id);
        if (ref) {
          setTrashedReferences((prev) => [...prev, ref]);
        }
        setReferences((prev) => prev.filter((r) => r.id !== id));
        if (selectedReferenceId === id) {
          setSelectedReferenceId(null);
        }
      }
    } catch (err) {
      setError('Failed to delete reference');
    }
  };

  const restoreReference = async (id: string) => {
    try {
      const ref = trashedReferences.find((r) => r.id === id);
      if (!ref) return;

      // Call backend API to restore the reference
      const response = await referenceManagerService.restoreReference(id);

      if (response.success) {
        setTrashedReferences((prev) => prev.filter((r) => r.id !== id));
        setReferences((prev) => [...prev, ref]);
      } else {
        setError('Failed to restore reference');
      }
    } catch (err) {
      setError('Failed to restore reference');
      console.error(err);
    }
  };

  const hardDeleteReference = async (id: string) => {
    try {
      const response = await referenceManagerService.deleteReference(id, true);
      if (response.success) {
        setTrashedReferences((prev) => prev.filter((r) => r.id !== id));
        if (selectedReferenceId === id) {
          setSelectedReferenceId(null);
        }
      }
    } catch (err) {
      setError('Failed to permanently delete reference');
    }
  };

  const createEmptyReference = async (type: ReferenceType, refId?: string) => {
    if (!selectedCollectionId || !selectedFolderId) {
      setError('Please create and select a sub-collection (folder) before adding references.');
      return;
    }

    await addReference(
      selectedCollectionId,
      selectedFolderId,
      {
        type,
        title: 'Empty Reference',
        metadata: {},
        document_source_type: 'weblink',
        createdAt: new Date().toISOString(),
      } as any,
      refId
    );
  };

  const createBackendReference = async (
    type: ReferenceType,
    _iconId?: string
  ): Promise<string | undefined> => {
    if (!userId || !selectedCollectionId || !selectedFolderId) {
      setError('Please create and select a sub-collection (folder) before adding references.');
      return;
    }

    try {
      const response = await referenceManagerService.createReference({
        title: `Untitled ${type}`,
        type: ReferenceTypeToAPI[type],
        created_by: userId,
        folder_id: selectedFolderId,
      });

      if (response?.success && response.data?.reference) {
        return response.data.reference.id;
      }
      return undefined;
    } catch (err) {
      setError('Failed to create backend reference');
      return undefined;
    }
  };

  const selectReference = (id: string) => {
    setSelectedReferenceId((prev) => (prev === id ? null : id));
  };

  const getReference = (id: string) => {
    return references.find((r) => r.id === id);
  };

  // Note Actions
  const addIndependentNote = async (referenceId: string, content: string) => {
    try {
      const response = await referenceManagerService.createNote({
        reference_id: referenceId,
        user_id: userId,
        note_text: content,
      });

      if (response.success && response.data) {
        const newNote: Note = {
          id: response.data.note.id,
          content: response.data.note.note_text,
          type: 'independent',
          createdBy: response.data.note.user_id,
          createdAt: response.data.note.created_at,
          modifiedAt: response.data.note.updated_at,
        };

        const ref = references.find((r) => r.id === referenceId);
        if (ref) {
          updateReference(referenceId, {
            independentNotes: [...(ref.independentNotes || []), newNote],
          });
          playSuccess();
        }
      }
    } catch (err: any) {
      // Check if it's the specific IntegrityError related to missing foreign key
      const errorMsg = err?.body?.error?.message || err?.message || JSON.stringify(err);

      if (errorMsg.includes('IntegrityError') && errorMsg.includes('foreign key constraint')) {
        console.warn(
          'Caught expected IntegrityError for potentially dummy reference. Treating as success for UI.'
        );
        // Fallback: Create a local-only note
        const newNote: Note = {
          id: `temp_note_${Date.now()}`,
          content: content,
          type: 'independent',
          createdBy: userId,
          createdAt: new Date().toISOString(),
        };

        const ref = references.find((r) => r.id === referenceId);
        if (ref) {
          updateReference(referenceId, {
            independentNotes: [...(ref.independentNotes || []), newNote],
          });
          playNotificationSound();
        }
      } else {
        setError('Failed to add note');
        console.error(err);
      }
    }
  };

  const editNote = async (referenceId: string, noteId: string, newContent: string) => {
    try {
      const response = await referenceManagerService.updateNote({
        note_id: noteId,
        note_text: newContent,
      });

      if (response.success) {
        const ref = references.find((r) => r.id === referenceId);
        if (!ref) return;

        updateReference(referenceId, {
          independentNotes: ref.independentNotes?.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  content: newContent,
                  modifiedAt: new Date().toISOString(),
                }
              : note
          ),
        });
      }
    } catch (err) {
      setError('Failed to edit note');
      console.error(err);
    }
  };

  const deleteNote = async (referenceId: string, noteId: string) => {
    try {
      const response = await referenceManagerService.deleteNote(noteId);

      if (response.success) {
        const ref = references.find((r) => r.id === referenceId);
        if (!ref) return;

        updateReference(referenceId, {
          independentNotes: ref.independentNotes?.filter((note) => note.id !== noteId),
        });
      }
    } catch (err) {
      setError('Failed to delete note');
      console.error(err);
    }
  };

  // Tag Actions
  const createTag = async () => {
    try {
      const color = generateRandomColor();
      const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const placeholderName = `New Tag ${suffix}`;

      const response = await referenceManagerService.createTag({
        name: placeholderName,
        created_by: userId,
        color,
      });

      if (response.success && response.data) {
        const apiTag = response.data.tag;

        const newTag: Tag = {
          id: apiTag.id,
          // Empty label triggers inline rename in the sidebar;
          // backend is created with a placeholder name.
          label: '',
          color: apiTag.color || color,
        };

        setTags((prev) => {
          // Check if tag already exists to prevent duplicates (e.g. race condition with loadTags)
          if (prev.some((t) => t.id === newTag.id)) {
            return prev;
          }
          return [...prev, newTag];
        });
        setIsRenaming(true);
      }
    } catch (err) {
      setError('Failed to create tag');
      console.error(err);
    }
  };

  const updateAnnotation = (
    referenceId: string,
    annotationId: string,
    updates: Partial<Annotation>
  ) => {
    const ref = references.find((r) => r.id === referenceId);
    if (!ref) return;

    updateReference(referenceId, {
      annotations: ref.annotations?.map((ann) =>
        ann.id === annotationId ? { ...ann, ...updates } : ann
      ),
    });
  };

  // Computed Values
  const selectedReference = references.find((r) => r.id === selectedReferenceId) || null;

  const filteredReferences = (() => {
    let base = references;

    if (selectedCollectionId === 'all') {
      // no extra collection filter
    } else if (selectedFolderId) {
      base = base.filter((r) => r.folderId === selectedFolderId);
    } else if (selectedCollectionId) {
      base = base.filter((r) => r.collectionId === selectedCollectionId);
    }

    if (!searchQuery.trim()) {
      return base;
    }

    const q = searchQuery.toLowerCase();
    return base.filter((r) => {
      const inTitle = r.title.toLowerCase().includes(q);
      const inFileName = r.fileName?.toLowerCase().includes(q);
      const inTags = r.tags?.some((t) => t.label.toLowerCase().includes(q));
      return inTitle || inFileName || inTags;
    });
  })();

  // ============================================================================
  // NEW COLLECTION ACTIONS
  // ============================================================================

  const getCollectionHierarchy = async (collectionId: string) => {
    try {
      const response = await referenceManagerService.getCollectionHierarchy(collectionId, userId);
      if (response.success && response.data) {
        // You can update state here if needed
        return response.data;
      }
    } catch (err) {
      setError('Failed to get collection hierarchy');
      console.error(err);
    }
  };

  const getCollectionStatistics = async (collectionId: string) => {
    try {
      const response = await referenceManagerService.getCollectionStatistics(collectionId, userId);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to get collection statistics');
      console.error(err);
    }
  };

  const searchCollections = async (searchTerm: string, pagination?: PaginationParams) => {
    try {
      const response = await referenceManagerService.searchCollections(
        userId,
        searchTerm,
        pagination
      );
      if (response.success && response.data) {
        const uiCollections = response.data.collections.map(convertCollectionToUI);
        setCollections([{ id: 'collections', title: 'Collections' }, ...uiCollections]);
      }
    } catch (err) {
      setError('Failed to search collections');
      console.error(err);
    }
  };

  // ============================================================================
  // NEW FOLDER ACTIONS
  // ============================================================================

  const moveFolderToCollection = async (folderId: string, targetCollectionId: string) => {
    try {
      const response = await referenceManagerService.moveFolderToCollection(
        folderId,
        targetCollectionId
      );
      if (response.success) {
        // Reload folders for both collections
        await loadCollections();
      }
    } catch (err) {
      setError('Failed to move folder');
      console.error(err);
    }
  };

  const reorderFolders = async (
    collectionId: string,
    folderOrders: Array<{ folder_id: string; sort_order: number }>
  ) => {
    try {
      const response = await referenceManagerService.reorderFolders({
        collection_id: collectionId,
        folder_orders: folderOrders,
      });
      if (response.success) {
        // Reload folders to get updated order
        await loadFoldersForCollection(collectionId);
      }
    } catch (err) {
      setError('Failed to reorder folders');
      console.error(err);
    }
  };

  const reorderDocumentsInFolder = async (
    folderId: string,
    documentOrders: Array<{ document_id: string; sort_order: number }>
  ) => {
    try {
      const response = await referenceManagerService.reorderDocumentsInFolder({
        folder_id: folderId,
        document_orders: documentOrders,
      });
      if (response.success) {
        // Reload documents to get updated order
        const ref = references.find((r) => r.folderId === folderId);
        if (ref) {
          await loadDocumentsForFolder(ref.collectionId!, folderId);
        }
      }
    } catch (err) {
      setError('Failed to reorder documents');
      console.error(err);
    }
  };

  const removeDocumentFromFolder = async (folderId: string, documentId: string) => {
    try {
      const response = await referenceManagerService.removeDocumentFromFolder(folderId, documentId);
      if (response.success) {
        // Remove from references state
        setReferences((prev) =>
          prev.filter((r) => !(r.id === documentId && r.folderId === folderId))
        );
      }
    } catch (err) {
      setError('Failed to remove document from folder');
      console.error(err);
    }
  };

  // ============================================================================
  // NEW REFERENCE ACTIONS
  // ============================================================================

  const searchReferences = async (searchTerm: string, pagination?: PaginationParams) => {
    try {
      const response = await referenceManagerService.searchReferences(searchTerm, pagination);
      if (response.success && response.data) {
        // Update references state with search results
      }
    } catch (err) {
      setError('Failed to search references');
      console.error(err);
    }
  };

  const getReferenceWithDocuments = async (referenceId: string) => {
    try {
      const response = await referenceManagerService.getReferenceWithDocuments(referenceId);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to get reference with documents');
      console.error(err);
    }
  };

  const detachReference = async (referenceId: string) => {
    try {
      const response = await referenceManagerService.detachReference(referenceId);
      if (response.success && response.data) {
      }
    } catch (err) {
      setError('Failed to detach reference');
      console.error(err);
    }
  };

  // ============================================================================
  // NEW DOCUMENT ACTIONS
  // ============================================================================

  const getDocument = async (documentId: string, includeRelations = false) => {
    try {
      const response = await referenceManagerService.getDocument(documentId, includeRelations);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to get document');
      console.error(err);
    }
  };

  const processDocumentExtraction = async (
    documentId: string,
    extractedText: string,
    success: boolean
  ) => {
    try {
      const response = await referenceManagerService.processDocumentExtraction(
        documentId,
        extractedText,
        success
      );
      if (response.success && response.data) {
        // Update document in state
        const updatedDoc = convertDocumentToUI(response.data.document);
        setReferences((prev) =>
          prev.map((ref) => (ref.id === documentId ? { ...ref, ...updatedDoc } : ref))
        );
      }
    } catch (err) {
      setError('Failed to process document extraction');
      console.error(err);
    }
  };

  // ============================================================================
  // NEW ANNOTATION ACTIONS
  // ============================================================================

  const createAnnotation = async (
    documentId: string,
    data: Omit<CreateAnnotationRequest, 'document_id' | 'user_id'>
  ) => {
    try {
      if (!userId) {
        setError('User not authenticated.');
        return;
      }
      const response = await referenceManagerService.createAnnotation({
        document_id: documentId,
        user_id: userId,
        ...data,
      });
      if (response.success && response.data) {
        const apiAnn = response.data.annotation;
        const newAnnotation: Annotation = {
          id: apiAnn.id,
          textSelected: '',
          note: apiAnn.content,
          highlightColor: apiAnn.color || '#FFEB3B',
          locationInDocument: {
            page: apiAnn.page_number,
            coordinates: apiAnn.coordinates as unknown as
              | { x: number; y: number; width: number; height: number }
              | undefined,
          },
          createdBy: userId,
          createdAt: apiAnn.created_at,
          type:
            apiAnn.type === 'NOTE'
              ? 'manual_note'
              : apiAnn.type === 'HIGHLIGHT'
                ? 'manual_highlight'
                : 'auto_annotate',
        };

        const ref = references.find((r) => r.id === documentId);
        if (ref) {
          updateReference(documentId, {
            annotations: [...(ref.annotations || []), newAnnotation],
          });
        }
      }
    } catch (err) {
      setError('Failed to create annotation');
      console.error(err);
    }
  };

  const getAnnotation = async (annotationId: string, includePositions = true) => {
    try {
      const response = await referenceManagerService.getAnnotation(annotationId, includePositions);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to get annotation');
      console.error(err);
    }
  };

  const listAnnotations = async (documentId: string, options?: any) => {
    try {
      const response = await referenceManagerService.listAnnotations(documentId, options);
      if (response.success && response.data) {
        // Update annotations in state

        const fetchedAnnotations: Annotation[] = (response.data.annotations || []).map(
          (ann: any) => ({
            id: ann.id,
            textSelected: ann.text || '',
            highlightColor: ann.color || '#FFEB3B',
            locationInDocument: {
              page: ann.positions?.[0]?.page_number || 1,
              coordinates:
                ann.positions?.[0]?.bbox && Array.isArray(ann.positions[0].bbox)
                  ? {
                      x: ann.positions[0].bbox[0] || 0,
                      y: ann.positions[0].bbox[1] || 0,
                      width: ann.positions[0].bbox[2] || 0,
                      height: ann.positions[0].bbox[3] || 0,
                    }
                  : { x: 0, y: 0, width: 0, height: 0 },
              charStart: ann.char_start || 0,
              charEnd: ann.char_end || 0,
            },
            note: ann.reason || '',
            createdBy: ann.created_by,
            createdAt: ann.created_at,
            type: ann.type as 'manual_highlight' | 'manual_note' | 'auto_annotate',
          })
        );

        setReferences((prev) =>
          prev.map((ref) =>
            ref.id === documentId || ref.documentId === documentId
              ? { ...ref, annotations: fetchedAnnotations }
              : ref
          )
        );
      }
    } catch (err) {
      setError('Failed to list annotations');
      console.error(err);
    }
  };

  const deleteAnnotation = async (annotationId: string) => {
    try {
      const response = await referenceManagerService.deleteAnnotation(annotationId);
      if (response.success) {
        // Remove annotation from references
        setReferences((prev) =>
          prev.map((ref) => ({
            ...ref,
            annotations: ref.annotations?.filter((ann) => ann.id !== annotationId),
          }))
        );
      }
    } catch (err) {
      setError('Failed to delete annotation');
      console.error(err);
    }
  };

  // ============================================================================
  // NEW TAG ACTIONS
  // ============================================================================

  const getTag = async (tagId: string) => {
    try {
      const response = await referenceManagerService.getTag(tagId);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to get tag');
      console.error(err);
    }
  };

  const updateTag = async (tagId: string, updates: { name?: string; color?: string }) => {
    try {
      const response = await referenceManagerService.updateTag({
        tag_id: tagId,
        ...updates,
      });
      if (response.success && response.data) {
        setTags((prev) =>
          prev.map((tag) =>
            tag.id === tagId
              ? {
                  ...tag,
                  label: updates.name || tag.label,
                  color: updates.color || tag.color,
                }
              : tag
          )
        );
      }
    } catch (err) {
      setError('Failed to update tag');
      console.error(err);
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const response = await referenceManagerService.deleteTag(tagId);
      if (response.success) {
        setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      }
    } catch (err) {
      setError('Failed to delete tag');
      console.error(err);
    }
  };

  const searchTagsAPI = async (searchTerm: string, pagination?: PaginationParams) => {
    try {
      const response = await referenceManagerService.searchTags(searchTerm, userId, pagination);
      if (response.success && response.data) {
        const uiTags = response.data.tags.map((tag) => ({
          id: tag.id,
          label: tag.name,
          color: tag.color || '#000000',
        }));
        setTags(uiTags);
      }
    } catch (err) {
      setError('Failed to search tags');
      console.error(err);
    }
  };

  const addTagToDocument = async (documentId: string, tagId: string) => {
    try {
      const ref = references.find((r) => r.id === documentId);
      const targetId = ref?.documentId || documentId;
      const response = await referenceManagerService.addTagToDocument(targetId, tagId, userId);
      if (response.success) {
        const tag = tags.find((t) => t.id === tagId);
        if (tag) {
          const ref = references.find((r) => r.id === documentId);
          if (ref) {
            updateReference(documentId, {
              tags: [...(ref.tags || []), tag],
            });
          }
        }
      }
    } catch (err) {
      setError('Failed to add tag to document');
      console.error(err);
    }
  };

  const removeTagFromDocument = async (documentId: string, tagId: string) => {
    try {
      const ref = references.find((r) => r.id === documentId);
      const targetId = ref?.documentId || documentId;
      const response = await referenceManagerService.removeTagFromDocument(targetId, tagId);
      if (response.success) {
        const ref = references.find((r) => r.id === documentId);
        if (ref) {
          updateReference(documentId, {
            tags: ref.tags?.filter((tag) => tag.id !== tagId),
          });
        }
      }
    } catch (err) {
      setError('Failed to remove tag from document');
      console.error(err);
    }
  };

  const listDocumentTags = async (documentId: string, pagination?: PaginationParams) => {
    try {
      const ref = references.find((r) => r.id === documentId);
      const targetId = ref?.documentId || documentId;
      const response = await referenceManagerService.listDocumentTags(targetId, pagination);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to list document tags');
      console.error(err);
    }
  };

  const listDocumentsWithTag = async (tagId: string, pagination?: PaginationParams) => {
    try {
      const response = await referenceManagerService.listDocumentsWithTag(tagId, pagination);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to list documents with tag');
      console.error(err);
    }
  };

  const bulkAddTagsToDocument = async (documentId: string, tagIds: string[]) => {
    try {
      const ref = references.find((r) => r.id === documentId);
      const targetId = ref?.documentId || documentId;
      const response = await referenceManagerService.bulkAddTagsToDocument({
        document_id: targetId,
        tag_ids: tagIds,
        added_by: userId,
      });
      if (response.success) {
        const newTags = tags.filter((t) => tagIds.includes(t.id));
        const ref = references.find((r) => r.id === documentId);
        if (ref) {
          updateReference(documentId, {
            tags: [...(ref.tags || []), ...newTags],
          });
        }
      }
    } catch (err) {
      setError('Failed to bulk add tags');
      console.error(err);
    }
  };

  const bulkRemoveTagsFromDocument = async (documentId: string, tagIds: string[]) => {
    try {
      const ref = references.find((r) => r.id === documentId);
      const targetId = ref?.documentId || documentId;
      const response = await referenceManagerService.bulkRemoveTagsFromDocument(targetId, tagIds);
      if (response.success) {
        const ref = references.find((r) => r.id === documentId);
        if (ref) {
          updateReference(documentId, {
            tags: ref.tags?.filter((tag) => !tagIds.includes(tag.id)),
          });
        }
      }
    } catch (err) {
      setError('Failed to bulk remove tags');
      console.error(err);
    }
  };

  // ============================================================================
  // NEW NOTE ACTIONS
  // ============================================================================

  const getNote = async (noteId: string) => {
    try {
      const response = await referenceManagerService.getNote(noteId);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to get note');
      console.error(err);
    }
  };

  const listNotes = async (referenceId: string, pagination?: PaginationParams) => {
    try {
      const refObj = references.find((r) => r.id === referenceId);
      let documentId = refObj?.documentId || referenceId;
      try {
        const rel = await referenceManagerService.getReferenceWithDocuments(referenceId);
        const candidate = (rel as any)?.data?.documents?.[0]?.id;
        if (candidate) documentId = candidate;
      } catch {}
      const response = await referenceManagerService.listNotes(documentId, userId, pagination);
      if (response.success && response.data) {
        const notesList = response.data.notes || [];
        const mappedNotes = notesList.map((n) => ({
          id: n.id,
          content: n.note_text,
          type: 'independent' as const,
          createdBy: n.user_id,
          createdAt: n.created_at,
          modifiedAt: n.updated_at,
        }));
        setReferences((prev) =>
          prev.map((ref) =>
            ref.id === referenceId ? { ...ref, independentNotes: mappedNotes } : ref
          )
        );
      }
    } catch (err) {
      setError('Failed to list notes');
      console.error(err);
    }
  };

  // ============================================================================
  // NEW DOCUMENT VERSION ACTIONS
  // ============================================================================

  const createVersion = async (
    documentId: string,
    metadataSnapshot?: string,
    diffData?: string
  ) => {
    try {
      const response = await referenceManagerService.createVersion({
        document_id: documentId,
        created_by: userId,
        metadata_snapshot: metadataSnapshot,
        diff_data: diffData,
      });
      if (response.success && response.data) {
      }
    } catch (err) {
      setError('Failed to create version');
      console.error(err);
    }
  };

  const getVersion = async (versionId: string) => {
    try {
      const response = await referenceManagerService.getVersion(versionId);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to get version');
      console.error(err);
    }
  };

  const listVersions = async (documentId: string, pagination?: PaginationParams) => {
    try {
      const response = await referenceManagerService.listVersions(documentId, pagination);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      setError('Failed to list versions');
      console.error(err);
    }
  };

  const restoreVersion = async (versionId: string) => {
    try {
      const response = await referenceManagerService.restoreVersion(versionId, userId);
      if (response.success && response.data) {
        const updatedDoc = convertDocumentToUI(response.data.document);
        setReferences((prev) =>
          prev.map((ref) => (ref.id === updatedDoc.id ? { ...ref, ...updatedDoc } : ref))
        );
      }
    } catch (err) {
      setError('Failed to restore version');
      console.error(err);
    }
  };

  const value: ReferenceManagerContextType = {
    collections,
    foldersByCollection,
    references,
    trashedReferences,
    tags,
    expandedFolders,
    selectedCollectionId,
    selectedFolderId,
    selectedReferenceId,
    isRenaming,
    error,
    isLoading,
    selectedReference,
    filteredReferences,
    searchQuery,
    addCollection,
    renameCollection,
    deleteCollection,
    selectCollection,
    changeCollectionIcon,
    changeFolderIcon,
    addFolderToCollection,
    renameFolder,
    deleteFolder,
    selectFolder,
    toggleFolder,
    addReference,
    updateReference,
    deleteReference,
    restoreReference,
    hardDeleteReference,
    createEmptyReference,
    createBackendReference,
    selectReference,
    getReference,
    updateAnnotation,
    addIndependentNote,
    editNote,
    deleteNote,
    createTag,
    setTags,
    setIsRenaming,
    setError,
    setSearchQuery,
    uploadFile,
    uploadUrls,
    attachFileToReference,
    attachUrlToReference,
    unlinkFileFromReference,

    // NEW: Collection Actions
    getCollectionHierarchy,
    getCollectionStatistics,
    searchCollections,

    // NEW: Folder Actions
    moveFolderToCollection,
    reorderFolders,
    reorderDocumentsInFolder,
    removeDocumentFromFolder,

    // NEW: Reference Actions
    searchReferences,
    getReferenceWithDocuments,
    detachReference,

    // NEW: Document Actions
    getDocument,
    processDocumentExtraction,

    // NEW: Annotation Actions
    createAnnotation,
    getAnnotation,
    listAnnotations,
    deleteAnnotation,

    // NEW: Tag Actions
    getTag,
    updateTag,
    deleteTag,
    searchTagsAPI,
    addTagToDocument,
    removeTagFromDocument,
    listDocumentTags,
    listDocumentsWithTag,
    bulkAddTagsToDocument,
    bulkRemoveTagsFromDocument,

    // NEW: Note Actions
    getNote,
    listNotes,

    // NEW: Version Actions
    createVersion,
    getVersion,
    listVersions,
    restoreVersion,
  };

  return (
    <ReferenceManagerContext.Provider value={value}>{children}</ReferenceManagerContext.Provider>
  );
}

export function useReferenceManager() {
  const context = useContext(ReferenceManagerContext);
  if (context === undefined) {
    throw new Error('useReferenceManager must be used within a ReferenceManagerProvider');
  }
  return context;
}
