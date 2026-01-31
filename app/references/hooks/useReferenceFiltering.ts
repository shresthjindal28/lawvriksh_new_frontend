'use client';

import { useMemo } from 'react';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';

export const useReferenceFiltering = () => {
  const {
    references,
    trashedReferences,
    selectedCollectionId,
    selectedFolderId,
    searchQuery,
    filterTag,
    isTrashOpen,
  } = useReferenceContext();

  const filteredReferences = useMemo(() => {
    // If trash is open, show only trashed references
    if (isTrashOpen) {
      return trashedReferences;
    }

    // Otherwise, show only non-deleted references
    let base = references;

    // Collection/Folder filtering
    if (selectedCollectionId === 'unsigned') {
      base = base.filter((r) => !r.folderId);
    } else if (selectedCollectionId === 'all') {
      // no extra collection filter
    } else if (selectedFolderId) {
      base = base.filter((r) => r.folderId === selectedFolderId);
    } else if (selectedCollectionId) {
      base = base.filter((r) => r.collectionId === selectedCollectionId);
    }

    // Tag filtering
    if (filterTag) {
      base = base.filter((r) => r.tags?.some((t) => t.id === filterTag.id));
    }

    // Search filtering
    if (!searchQuery.trim()) {
      return base;
    }

    const q = searchQuery.toLowerCase().trim();
    return base.filter((r) => {
      // Search in title
      const inTitle = r.title?.toLowerCase().includes(q) || false;

      // Search in file name
      const inFileName = r.fileName?.toLowerCase().includes(q) || false;

      // Search in tags (both label and color)
      const inTags =
        r.tags?.some(
          (t) => t.label?.toLowerCase().includes(q) || t.color?.toLowerCase().includes(q)
        ) || false;

      // Search in metadata fields (author, abstract, etc.)
      const metadata = r.metadata as any;
      const inMetadata =
        (metadata &&
          Object.values(metadata).some(
            (value) => typeof value === 'string' && value.toLowerCase().includes(q)
          )) ||
        false;

      return inTitle || inFileName || inTags || inMetadata;
    });
  }, [
    references,
    trashedReferences,
    selectedCollectionId,
    selectedFolderId,
    searchQuery,
    filterTag,
    isTrashOpen,
  ]);

  return { filteredReferences };
};
