import {
  RefCollection,
  RefFolder,
  RefDocument,
  ReferenceTypeEnum,
} from '@/types/reference-manager-api';
import { ReferenceItem, ReferenceType } from '@/types/reference-manager';
import { Collection, Folder } from '@/store/zustand/useReferenceStore';

export const mapReferenceTypeToBackendInt = (typeStr: string | undefined): number => {
  if (!typeStr) return 2; // Default to DOCUMENT (2)
  const upper = typeStr.toUpperCase();
  const mapping: Record<string, number> = {
    ARTICLE: 1,
    DOCUMENT: 2,
    GENERAL_DOCUMENT: 2,
    HEARING: 3,
    LEGAL_CASE: 4,
    LEGISLATION: 5,
    RESEARCH_PAPER: 6,
    CONFERENCE_PAPER: 6,
    THESIS: 7,
    REGULATION: 8,
    REPORT: 9,
    BILL: 10,
    BOOK: 11,
  };
  return mapping[upper] || 2; // Default to DOCUMENT
};

export const mapEnumToReferenceType = (enumType: ReferenceTypeEnum | string): ReferenceType => {
  const normalizedType = (enumType || 'DOCUMENT').toLowerCase();
  const mapping: Record<string, ReferenceType> = {
    article: 'article',
    document: 'general_document',
    hearing: 'hearing',
    legal_case: 'legal_case',
    legislation: 'legislation',
    research_paper: 'conference_paper',
    thesis: 'thesis',
    regulation: 'regulation',
    report: 'report',
    bill: 'bill',
    book: 'book',
  };
  return mapping[normalizedType] || 'general_document';
};

export const convertCollectionToUI = (apiCollection: RefCollection): Collection => ({
  id: apiCollection.id,
  title: apiCollection.name,
  icon: undefined,
});

export const convertFolderToUI = (apiFolder: RefFolder): Folder => ({
  id: apiFolder.id,
  title: apiFolder.name,
  icon: undefined,
});

export const convertDocumentToUI = (apiDoc: RefDocument): ReferenceItem => {
  const docAny = apiDoc as any;
  let parsedMetadata: any = {};
  let collectionId: string | undefined = undefined;
  let folderId: string | undefined = undefined;
  try {
    const rawMetadata: any = docAny.metadata;
    if (typeof rawMetadata === 'string') {
      parsedMetadata = rawMetadata ? JSON.parse(rawMetadata) : {};
    } else if (rawMetadata && typeof rawMetadata === 'object') {
      parsedMetadata = rawMetadata;
    } else {
      parsedMetadata = {};
    }
    collectionId = parsedMetadata.collection_id || parsedMetadata.collectionId || undefined;
    folderId = parsedMetadata.folder_id || parsedMetadata.folderId || undefined;
  } catch (e) {}

  // Ensure top-level fields are mapped to metadata for UI
  parsedMetadata.summary = docAny.summary || parsedMetadata.summary;
  parsedMetadata.abstract = docAny.abstract || parsedMetadata.abstract;

  const type = mapEnumToReferenceType(parsedMetadata.type || 'DOCUMENT');

  // Determine title: use backend name/title, but for unsigned refs with default titles, show "Unsigned"
  let title = docAny.name ?? docAny.title;
  const isDefaultTitle = title?.startsWith('Untitled ') || !title;
  if (!folderId && isDefaultTitle) {
    title = 'Unsigned';
  }

  return {
    id: apiDoc.id,
    type,
    title,
    metadata: parsedMetadata,
    document_source_type: docAny.document_source_type === 'FILE' ? 'file' : 'weblink',
    file_url: docAny.file_url,
    s3_key: docAny.s3_key,
    web_url: docAny.web_url,
    size: docAny.size ? `${docAny.size} bytes` : undefined,
    createdAt: docAny.created_at,
    modifiedAt: docAny.updated_at,
    // Prefer metadata-provided mapping if the backend included it.
    // Fallbacks (like applyFolderMapping) can still override or fill these.
    collectionId,
    folderId,
  };
};

export const applyFolderMapping = (
  items: ReferenceItem[],
  docIdToFolderId: Record<string, string>,
  folderIdToCollectionId: Record<string, string>
): ReferenceItem[] => {
  return items.map((item) => {
    const folderId = docIdToFolderId[item.id];
    if (!folderId) return item;
    const collectionId = folderIdToCollectionId[folderId];
    return {
      ...item,
      folderId,
      collectionId,
    };
  });
};
