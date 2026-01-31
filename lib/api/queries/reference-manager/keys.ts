export const referenceKeys = {
  all: ['reference-manager'] as const,
  collections: (userId: string) => [...referenceKeys.all, 'collections', userId] as const,
  folders: (collectionId: string) => [...referenceKeys.all, 'folders', collectionId] as const,
  allFolders: (userId: string) => [...referenceKeys.all, 'all-folders', userId] as const,
  documents: (folderId: string) => [...referenceKeys.all, 'documents', folderId] as const,
  allDocuments: (userId: string) => [...referenceKeys.all, 'all-documents', userId] as const,
  tags: (userId: string) => [...referenceKeys.all, 'tags', userId] as const,
  documentTags: (documentId: string) =>
    [...referenceKeys.all, 'document-tags', documentId] as const,
  notes: (documentId: string) => [...referenceKeys.all, 'notes', documentId] as const,
  annotations: (documentId: string, includePositions: boolean) =>
    [
      ...referenceKeys.all,
      'annotations',
      documentId,
      includePositions ? 'with-pos' : 'no-pos',
    ] as const,
  referenceWithDocuments: (referenceId: string) =>
    [...referenceKeys.all, 'reference-with-documents', referenceId] as const,
  document: (documentId: string) => [...referenceKeys.all, 'document', documentId] as const,
  preview: (documentId: string) => [...referenceKeys.all, 'preview', documentId] as const,
  recentReferences: (limit: number) => [...referenceKeys.all, 'recent-references', limit] as const,
  unsigned: () => [...referenceKeys.all, 'unsigned'] as const,

  // Paginated query keys for infinite scroll
  documentsPaginated: (folderId: string) =>
    [...referenceKeys.all, 'documents', folderId, 'paginated'] as const,
  unsignedPaginated: () => [...referenceKeys.all, 'unsigned', 'paginated'] as const,
  collectionsPaginated: (userId: string) =>
    [...referenceKeys.all, 'collections', userId, 'paginated'] as const,
  tagsPaginated: (userId: string) => [...referenceKeys.all, 'tags', userId, 'paginated'] as const,
};
