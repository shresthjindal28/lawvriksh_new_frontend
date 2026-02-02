'use client';

import React, { useEffect, useRef, useState } from 'react';
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
    <div className="fixed inset-0 bg-black/75 flex justify-center items-center z-[1000]" onClick={onClose}>
      <motion.div
        className="bg-white p-6 rounded-xl max-w-[500px] w-[90%] flex flex-col items-center gap-5 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)]"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-[300px] h-[300px] rounded-full overflow-hidden border-[3px] border-[#ffe082] shadow-[0_0_15px_rgba(255,224,130,0.4)] relative">
          <Image
            src={previewUrl || imageUrl || DEFAULT_AVATAR}
            alt={userName || 'Profile'}
            fill
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>

        {uploadError && <div className="text-red-500 text-sm text-center">{uploadError}</div>}

        <div className="w-full flex justify-center">
          <button
            className="bg-gradient-to-br from-[#1f2937] to-[#111827] text-white border-none px-5 py-2.5 rounded-md font-medium cursor-pointer shadow-md transition-all duration-200 hover:from-[#111827] hover:to-black hover:-translate-y-px hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
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
