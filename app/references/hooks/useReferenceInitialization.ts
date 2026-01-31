'use client';

import { useEffect, useMemo } from 'react';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';
import { useReferenceManagerData } from '@/lib/api/queries/reference-manager/useReferenceManagerData';
import { ReferenceItem, Tag } from '@/types/reference-manager';

export const useReferenceInitialization = () => {
  const {
    setCollections,
    setFoldersByCollection,
    setReferences,
    setTrashedReferences,
    setTags,
    setIsLoading,
    setError,
  } = useReferenceContext();

  const {
    collections,
    foldersByCollection,
    activeReferences,
    trashedReferences,
    tags,
    isLoading,
    isError,
    refresh,
  } = useReferenceManagerData();

  useEffect(() => {
    setIsLoading(isLoading);
  }, [isLoading, setIsLoading]);

  useEffect(() => {
    if (isError) {
      setError('Failed to load reference manager data');
    } else {
      setError(null);
    }
  }, [isError, setError]);

  const uiTags = useMemo<Tag[]>(() => {
    return tags.map((t) => ({
      id: t.id,
      label: t.name,
      color: t.color || '#000000',
    }));
  }, [tags]);

  useEffect(() => {
    if (isLoading) return;

    setCollections(collections);
    setFoldersByCollection(foldersByCollection);

    // Sync references from React Query to Zustand store
    // Use a Map to ensure no duplicates by ID
    setReferences((prev) => {
      const map = new Map<string, ReferenceItem>();

      // First add all references from server (React Query)
      // These are the source of truth
      activeReferences.forEach((r) => {
        map.set(r.id, r);
      });

      // Then merge any local-only references (optimistic updates)
      // that aren't in the server response yet
      prev.forEach((r) => {
        if (!map.has(r.id)) {
          // This is a local-only reference, keep it
          map.set(r.id, r);
        } else {
          // Server has this reference, merge local changes on top
          const serverRef = map.get(r.id)!;
          map.set(r.id, { ...serverRef, ...r, ...serverRef });
        }
      });

      return Array.from(map.values());
    });

    setTrashedReferences(trashedReferences);
    setTags(uiTags);
  }, [
    isLoading,
    collections,
    foldersByCollection,
    activeReferences,
    trashedReferences,
    uiTags,
    setCollections,
    setFoldersByCollection,
    setReferences,
    setTrashedReferences,
    setTags,
  ]);

  // Note: Predefined tags (like "To Read", "Important", etc.) should be seeded
  // in the database by the backend, not created by the frontend.
  // Tags have a GLOBAL unique constraint on 'name', so they're shared across all users.

  return { refresh };
};
