'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useImageUpload } from '@/hooks/common/useImageUpload';
import { motion } from 'framer-motion';
import { dmsImageService } from '@/lib/api/imageService';
import { authService } from '@/lib/api/authService';

interface ProfileImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null | undefined;
  userName?: string;
  userId: string;
  onImageUpdated: (data: {
    previewUrl?: string;
    profileImageUrls?: Record<string, string>;
  }) => void;
}

const DEFAULT_AVATAR = '/assets/images/logos/lawVriksh-logo.png';

export default function ProfileImageDialog({
  isOpen,
  onClose,
  imageUrl,
  userName,
  userId,
  onImageUpdated,
}: ProfileImageDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { uploadImage, isUploading, uploadProgress, uploadError } = useImageUpload({
    userId,
    onSuccess: async () => {
      try {
        const response = await dmsImageService.getProfileImageUrls();
        if (response.success && response.data?.urls) {
          authService.storeProfileImageUrls(response.data.urls);
          setPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
          onImageUpdated({ profileImageUrls: response.data.urls });
        } else {
          onImageUpdated({});
        }
      } catch {
        onImageUpdated({});
      }
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const nextPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextPreviewUrl;
      });
      onImageUpdated({ previewUrl: nextPreviewUrl });
      await uploadImage(file, 'profile_image');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Use a cleanup pattern that doesn't trigger the lint warning
      const currentPreview = previewUrl;
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
        setPreviewUrl(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="profile-image-modal-overlay" onClick={onClose}>
      <motion.div
        className="profile-image-modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="modal-image-container" style={{ position: 'relative' }}>
          <Image
            src={previewUrl || imageUrl || DEFAULT_AVATAR}
            alt={userName || 'Profile'}
            fill
            className="modal-profile-image"
            unoptimized
          />
        </div>

        {uploadError && <div className="modal-error">{uploadError}</div>}

        <div className="modal-actions">
          <button
            className="btn-change-photo"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Change Photo'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
