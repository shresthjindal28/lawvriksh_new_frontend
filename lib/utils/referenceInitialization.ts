import type { ReferenceItem } from '@/types/reference-manager';
import { apiEnumToUIType } from './referenceTypeMapper';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function buildReferenceListsFromFolderData(params: {
  refsData: any[];
  fallbackFolderId: string;
  collectionId: string;
}): { active: ReferenceItem[]; trashed: ReferenceItem[] } {
  const active: ReferenceItem[] = [];
  const trashed: ReferenceItem[] = [];

  for (const item of params.refsData || []) {
    const r = item.reference || item;
    const documents = item.documents || [];
    const docData = documents.length > 0 ? documents[0] : null;

    let parsedMetadata: any = {};
    if (docData?.metadata) {
      try {
        parsedMetadata =
          typeof docData.metadata === 'string' ? JSON.parse(docData.metadata) : docData.metadata;
      } catch {
        parsedMetadata = {};
      }
    }

    const folderId = r.folder_id || params.fallbackFolderId;

    const uiRef: ReferenceItem = {
      id: r.id,
      collectionId: params.collectionId,
      folderId: folderId,
      documentId: docData?.id,
      type: apiEnumToUIType(r.ref_type),
      title:
        docData?.title ||
        parsedMetadata?.title ||
        parsedMetadata?.Title ||
        r.title ||
        `Reference ${r.id?.slice(0, 8) || 'Unknown'}`,
      file_url: docData?.file_url || parsedMetadata?.real_file_url,
      s3_key: docData?.s3_key || (docData?.file_url ? docData.file_url : undefined),
      web_url: docData?.web_url,
      document_source_type: docData?.file_url
        ? ('file' as const)
        : docData?.web_url
          ? ('weblink' as const)
          : undefined,
      fileName: docData?.title || docData?.name,
      size: docData?.size ? formatBytes(docData.size) : undefined,
      dateUploaded: r.created_at,
      metadata: {
        author: parsedMetadata?.Author || parsedMetadata?.author || r.metadata?.author || '',
        date:
          parsedMetadata?.Date ||
          parsedMetadata?.date ||
          (r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : ''),
        publisher:
          parsedMetadata?.Publisher || parsedMetadata?.publisher || r.metadata?.publisher || '',
        url: parsedMetadata?.URL || parsedMetadata?.url || docData?.web_url || '',
        abstract: parsedMetadata?.Abstract || parsedMetadata?.abstract || docData?.abstract || '',
        callNumber: parsedMetadata?.['Call number'] || parsedMetadata?.callNumber || '',
        language: parsedMetadata?.Language || parsedMetadata?.language || '',
        university: parsedMetadata?.University || parsedMetadata?.university || '',
        place: parsedMetadata?.Place || parsedMetadata?.place || '',
        license: parsedMetadata?.License || parsedMetadata?.license || '',
        numberOfPages: parsedMetadata?.['No. of Pages'] || parsedMetadata?.numberOfPages || '',
        type: parsedMetadata?.Type || parsedMetadata?.type || '',
        ...parsedMetadata,
      },
      tags: [],
      annotations: [],
      createdAt: r.created_at,
      modifiedAt: r.updated_at,
    };

    if (r.is_deleted) {
      trashed.push(uiRef);
    } else {
      active.push(uiRef);
    }
  }

  return { active, trashed };
}
