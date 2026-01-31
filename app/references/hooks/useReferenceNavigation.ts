'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, useParams, usePathname } from 'next/navigation';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';

export const useReferenceNavigation = () => {
  const {
    setExpandedFolders,
    setSelectedCollectionId,
    setSelectedFolderId,
    setSelectedReferenceId,
    setIsRenaming,
    setIsTrashOpen,
  } = useReferenceContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams() as { collectionId?: string; folderId?: string };
  const pathname = usePathname();

  const isStudent = pathname?.includes('/student');
  const basePath = isStudent
    ? '/dashboard/student/reference-manager'
    : '/dashboard/professional/reference-manager';

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]
    );
  };

  const selectCollection = (id: string) => {
    setSelectedCollectionId(id);
    setSelectedFolderId(null);
    setSelectedReferenceId(null);
    setIsRenaming(false);
    setIsTrashOpen(false);
    router.replace(`${basePath}/${id}`, { scroll: false });
  };

  const selectFolder = (collectionId: string, folderId: string) => {
    setSelectedCollectionId(collectionId);
    setSelectedFolderId(folderId);
    setSelectedReferenceId(null);
    setIsRenaming(false);
    setIsTrashOpen(false);
    setExpandedFolders((prev) => (prev.includes(collectionId) ? prev : [...prev, collectionId]));
    router.replace(`${basePath}/${collectionId}/${folderId}`, { scroll: false });
  };

  const selectReference = (id: string) => {
    setSelectedReferenceId((prev) => (prev === id ? null : id));
    setIsRenaming(false);
  };

  useEffect(() => {
    const collectionFromParams = params.collectionId || searchParams.get('collectionId') || null;
    const folderFromParams = params.folderId || searchParams.get('folderId') || null;
    if (collectionFromParams) {
      setSelectedCollectionId(collectionFromParams);
      setExpandedFolders((prev) =>
        prev.includes(collectionFromParams) ? prev : [...prev, collectionFromParams]
      );
    }
    if (folderFromParams) {
      setSelectedFolderId(folderFromParams);
    } else {
      setSelectedFolderId(null);
    }
  }, [params, searchParams, setSelectedCollectionId, setSelectedFolderId, setExpandedFolders]);

  return {
    toggleFolder,
    selectCollection,
    selectFolder,
    selectReference,
  };
};
