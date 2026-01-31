// utils/editorImageUploader.ts

import { dmsImageService } from '@/lib/api/imageService';

interface ImageUploaderConfig {
  userId: string;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: () => void;
}

export class EditorImageUploader {
  private userId: string;
  private onUploadStart?: () => void;
  private onUploadProgress?: (progress: number) => void;
  private onUploadComplete?: () => void;

  constructor(config: ImageUploaderConfig) {
    this.userId = config.userId;
    this.onUploadStart = config.onUploadStart;
    this.onUploadProgress = config.onUploadProgress;
    this.onUploadComplete = config.onUploadComplete;
  }

  //Upload image by file
  async uploadByFile(file: File): Promise<{ success: number; file: { url: string } }> {
    try {
      this.onUploadStart?.();

      console.log('[EditorImageUploader] Starting upload for:', file.name, file.size, 'bytes');

      const response = await dmsImageService.uploadImage({
        userId: this.userId,
        file,
        imageType: 'workspace_image',
        onProgress: (progress) => {
          console.log('[EditorImageUploader] Upload progress:', progress);
          this.onUploadProgress?.(progress);
        },
      });

      this.onUploadComplete?.();

      console.log('[EditorImageUploader] Upload response:', response);

      if (response.success && response.data?.permanent_url) {
        // Transform AWS S3 URL to LocalStack URL in development
        let imageUrl = response.data.permanent_url;
        if (
          process.env.NODE_ENV === 'development' ||
          process.env.NEXT_PUBLIC_USE_LOCALSTACK === 'true'
        ) {
          // Check if URL is AWS S3 format and transform to LocalStack
          const awsS3Pattern = /https:\/\/([^.]+)\.s3\.[^/]+\.amazonaws\.com\/(.*)/;
          const match = imageUrl.match(awsS3Pattern);
          if (match) {
            const bucket = match[1];
            const key = match[2];
            imageUrl = `http://localhost:4566/${bucket}/${key}`;
            console.log('[EditorImageUploader] Transformed URL for LocalStack:', imageUrl);
          }
        }
        console.log('[EditorImageUploader] Success! URL:', imageUrl);
        return {
          success: 1,
          file: {
            url: imageUrl,
          },
        };
      } else {
        console.error('[EditorImageUploader] Upload failed:', response.message);
        return {
          success: 0,
          file: { url: '' },
        };
      }
    } catch (error) {
      console.error('[EditorImageUploader] Error during upload:', error);
      this.onUploadComplete?.();
      return {
        success: 0,
        file: { url: '' },
      };
    }
  }

  //Upload image by URL (optional)
  async uploadByUrl(url: string): Promise<{ success: number; file: { url: string } }> {
    try {
      // Fetch the image from URL
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });

      // Use the same upload logic
      return this.uploadByFile(file);
    } catch (error) {
      console.error('Editor.js image URL upload error:', error);
      throw error;
    }
  }
}
