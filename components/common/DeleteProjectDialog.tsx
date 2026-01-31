'use client';

import React from 'react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useDeleteModalStore } from '@/store/zustand/useDeleteModalStore';

export default function DeleteProjectDialog() {
  const { isOpen, projectTitle, isLoading, onConfirm, closeModal } = useDeleteModalStore();

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={closeModal}
      onConfirm={onConfirm}
      title="Delete Project"
      message={`Do you really want to delete your project "${projectTitle}"?`}
      confirmText="Delete"
      cancelText="Cancel"
      isLoading={isLoading}
    />
  );
}
