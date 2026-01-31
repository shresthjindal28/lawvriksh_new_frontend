// hooks/useImageUpload.ts

import { useState, useCallback } from 'react';
import { dmsImageService } from '@/lib/api/imageService';
import { ImageType, ImageData, CompleteImageUploadResponse } from '@/types/image';

interface UseImageUploadOptions {
  userId: string;
  onSuccess?: (response: CompleteImageUploadResponse) => void;
  onError?: (error: string) => void;
}

export const useImageUpload = (options: UseImageUploadOptions) => {
  const { userId, onSuccess, onError } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (file: File, imageType: ImageType) => {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      try {
        const response = await dmsImageService.uploadImage({
          userId,
          file,
          imageType,
          onProgress: setUploadProgress,
        });

        if (response.success && response.data) {
          onSuccess?.(response.data);
          return response.data;
        } else {
          const errorMsg = response.message || 'Upload failed';
          setUploadError(errorMsg);
          onError?.(errorMsg);
          return null;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Upload failed';
        setUploadError(errorMsg);
        onError?.(errorMsg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [userId, onSuccess, onError]
  );

  const resetUpload = useCallback(() => {
    setUploadProgress(0);
    setUploadError(null);
  }, []);

  return {
    uploadImage,
    isUploading,
    uploadProgress,
    uploadError,
    resetUpload,
  };
};

// Hook for managing all images
interface UseImagesOptions {
  userId: string;
  autoFetch?: boolean;
}

export const useImages = (options: UseImagesOptions) => {
  const { userId, autoFetch = true } = options;

  const [profileImage, setProfileImage] = useState<ImageData | null>(null);
  const [workspaceImages, setWorkspaceImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile image
  const fetchProfileImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await dmsImageService.getProfileImage(userId);

      if (response.success && response.data) {
        setProfileImage({
          image_id: response.data.image_id,
          file_name: response.data.file_name,
          permanent_url: response.data.permanent_url,
          created_at: response.data.created_at,
        });
      } else {
        setProfileImage(null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch profile image';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch workspace images
  const fetchWorkspaceImages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await dmsImageService.getWorkspaceImages(userId);

      if (response.success && response.data) {
        setWorkspaceImages(response.data.images);
      } else {
        setWorkspaceImages([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch workspace images';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Delete image
  const deleteImage = useCallback(
    async (imageId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await dmsImageService.deleteImage(imageId, userId);

        if (response.success) {
          // Remove from local state
          setWorkspaceImages((prev) => prev.filter((img) => img.image_id !== imageId));

          if (profileImage?.image_id === imageId) {
            setProfileImage(null);
          }

          return true;
        } else {
          setError(response.message || 'Failed to delete image');
          return false;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete image';
        setError(errorMsg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [userId, profileImage]
  );

  // Auto-fetch on mount if enabled
  useState(() => {
    if (autoFetch && userId) {
      fetchProfileImage();
      fetchWorkspaceImages();
    }
  });

  return {
    profileImage,
    workspaceImages,
    isLoading,
    error,
    fetchProfileImage,
    fetchWorkspaceImages,
    deleteImage,
    refetch: () => {
      fetchProfileImage();
      fetchWorkspaceImages();
    },
  };
};
