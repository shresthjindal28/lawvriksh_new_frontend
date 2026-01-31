// services/dmsImageService.ts

import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import type { APIResponse } from '@/types/auth';
import {
  InitImageUploadRequest,
  InitImageUploadResponse,
  CompleteImageUploadResponse,
  ProfileImageResponse,
  WorkspaceImagesResponse,
  DeleteImageResponse,
  UploadImageOptions,
  ImageData,
  ProfileImageUrlsResponse,
} from '@/types/image';

class DMSImageService {
  // Calculate checksum for file
  private async calculateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  // Init upload
  private async initUpload(
    request: InitImageUploadRequest
  ): Promise<APIResponse<InitImageUploadResponse>> {
    return FetchClient.makeRequest<InitImageUploadResponse>(API_ENDPOINTS.INIT_IMAGE_UPLOAD, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Upload to S3
  private async uploadToS3(
    file: File,
    presignedUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        const proxyUrl = `/api/proxy-upload?url=${encodeURIComponent(presignedUrl)}`;

        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          try {
            const statusCode = xhr.status;
            if (statusCode < 200 || statusCode >= 300) {
              console.error('Proxy upload failed with HTTP status:', statusCode, xhr.statusText);
              reject(new Error(`Proxy upload failed: ${statusCode} ${xhr.statusText}`));
              return;
            }

            const responseJson = JSON.parse(xhr.responseText || '{}');
            if (responseJson.ok !== true) {
              console.error('Proxy upload reported failure:', responseJson);
              reject(
                new Error(
                  `Proxy upload failed with upstream status: ${responseJson.status ?? 'unknown'}`
                )
              );
              return;
            }

            resolve(true);
          } catch (err) {
            console.error('Error parsing proxy upload response:', err, xhr.responseText);
            reject(new Error('Failed to parse proxy upload response'));
          }
        });

        xhr.addEventListener('error', () => {
          console.error('Proxy upload network error');
          reject(new Error('Proxy upload failed due to network error'));
        });

        xhr.addEventListener('abort', () => {
          console.error('Proxy upload aborted');
          reject(new Error('Proxy upload was aborted'));
        });

        xhr.open('POST', proxyUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

        xhr.send(file);
      });
    } catch (error) {
      console.error('S3 upload error via proxy:', error);
      return false;
    }
  }

  // Helper to get token
  private getToken(): string | null {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, ...rest] = cookie.trim().split('=');
      if (name === STORAGE_KEYS.ACCESS_TOKEN) {
        return decodeURIComponent(rest.join('='));
      }
    }
    return null;
  }

  // Upload profile image directly
  private async uploadProfileImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<APIResponse<CompleteImageUploadResponse>> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      // Ensure baseURL ends with / or endpoint starts with /
      const endpoint = API_ENDPOINTS.UPLOAD_PROFILE_IMAGE;
      const url =
        baseURL.endsWith('/') || endpoint.startsWith('/')
          ? `${baseURL}${endpoint}`
          : `${baseURL}/${endpoint}`;

      xhr.open('POST', url);

      const token = this.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');

      const formData = new FormData();
      formData.append('file', file);

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const data = response.data || response;

            const result: CompleteImageUploadResponse = {
              success: true,
              image_id: data.image_id || 'profile-image',
              file_name: data.file_name || file.name,
              permanent_url: data.permanent_url || data.url || data.picture || data.avatar,
              image_type: 'profile_image',
            };

            resolve({
              success: true,
              message: response.message || 'Profile image uploaded successfully',
              data: result,
            });
          } catch (e) {
            resolve({
              success: false,
              message: 'Failed to parse response',
            });
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            resolve({
              success: false,
              message: err.detail || err.message || `Upload failed with status ${xhr.status}`,
            });
          } catch {
            resolve({
              success: false,
              message: `Upload failed with status ${xhr.status}`,
            });
          }
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          message: 'Network error occurred',
        });
      });

      xhr.send(formData);
    });
  }

  // Complete upload
  private async completeUpload(request: {
    image_id: string;
    image_type: string;
  }): Promise<APIResponse<string>> {
    return FetchClient.makeRequest<string>(API_ENDPOINTS.COMPLETE_IMAGE_UPLOAD, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Upload image (main method)
  async uploadImage(
    options: UploadImageOptions
  ): Promise<APIResponse<CompleteImageUploadResponse>> {
    const { userId, file, imageType, onProgress } = options;

    // Use direct upload for profile images
    if (imageType === 'profile_image') {
      return this.uploadProfileImage(file, onProgress);
    }

    try {
      // Calculate checksum
      const checksum = await this.calculateChecksum(file);
      console.log('Image upload debug:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        imageType: imageType,
        checksum: checksum,
      });

      // Step 1: Initialize upload
      const initRequest: InitImageUploadRequest = {
        checksum,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        image_type: imageType,
      };

      console.log('Init upload request:', initRequest);
      const initResponse = await this.initUpload(initRequest);

      if (!initResponse.success || !initResponse.data?.presigned_url) {
        const errorMessage =
          initResponse.data?.error || initResponse.message || 'Failed to initialize upload';
        console.error('Init upload failed:', {
          success: initResponse.success,
          data: initResponse.data,
          message: initResponse.message,
          error: initResponse.data?.error,
        });
        return {
          success: false,
          message: errorMessage,
        };
      }

      const { presigned_url, image_id } = initResponse.data;

      // Step 2: Upload to S3
      console.log('[DMSImageService] Uploading to S3:', presigned_url);
      let uploadSuccess = false;
      try {
        uploadSuccess = await this.uploadToS3(file, presigned_url, onProgress);
        console.log('[DMSImageService] S3 upload result:', uploadSuccess);
      } catch (s3Error) {
        console.error('[DMSImageService] S3 upload failed:', s3Error);
        return {
          success: false,
          message: `S3 upload failed: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`,
        };
      }

      if (!uploadSuccess) {
        console.error('[DMSImageService] S3 upload failed, not calling complete-upload');
        return {
          success: false,
          message: 'Failed to upload file to storage',
        };
      }

      // Step 3: Complete upload (Required for all types except profile_image)
      if (image_id) {
        const completeRes = await this.completeUpload({ image_id, image_type: imageType });
        if (!completeRes.success) {
          console.error('Complete upload failed:', completeRes);
          return {
            success: false,
            message: completeRes.message || 'Failed to complete upload',
          };
        }
      }

      if (imageType === 'workspace_image') {
        const workspaceResponse = await this.getWorkspaceImages(userId);

        if (
          !workspaceResponse.success ||
          !workspaceResponse.data ||
          !workspaceResponse.data.images.length
        ) {
          return {
            success: false,
            message: workspaceResponse.message || 'Failed to fetch workspace images after upload',
          };
        }

        const latestImage = workspaceResponse.data.images.at(-1) as ImageData;

        const data: CompleteImageUploadResponse = {
          success: true,
          image_id: latestImage.image_id,
          file_name: latestImage.file_name,
          permanent_url: latestImage.permanent_url,
          image_type: imageType,
        };

        return {
          success: true,
          message: workspaceResponse.message,
          data,
        };
      }

      return {
        success: true,
        message: 'Image uploaded successfully',
        // Fallback data if not workspace image
        data: {
          success: true,
          image_id: image_id || 'unknown',
          file_name: file.name,
          permanent_url: '', // We might need to get this from completeUpload response if available, but typings say it returns plain string? User provided 200 "string".
          image_type: imageType,
        },
      } as APIResponse<CompleteImageUploadResponse>;
    } catch (error) {
      console.error('Image upload error:', error);

      // Extract detailed error information
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        // Check if we have detailed error body from 422 response
        const errorBody = (error as any).body;
        if (errorBody && errorBody.detail) {
          // Handle validation error format
          if (Array.isArray(errorBody.detail)) {
            errorMessage = errorBody.detail
              .map((err: any) => `${err.loc?.join('.') || 'field'}: ${err.msg}`)
              .join(', ');
          } else {
            errorMessage = errorBody.detail;
          }
        } else if (errorBody && errorBody.message) {
          errorMessage = errorBody.message;
        } else {
          errorMessage = error.message;
        }

        console.error('Error details:', {
          message: error.message,
          status: (error as any).status,
          body: errorBody,
          bodyDetail: errorBody?.detail,
          bodyMessage: errorBody?.message,
        });
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  // Get profile image
  async getProfileImage(userId: string): Promise<APIResponse<ProfileImageResponse>> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return FetchClient.makeRequest<ProfileImageResponse>(
      `${API_ENDPOINTS.GET_PROFILE_IMAGE}?user_id=${userId}`,
      {
        method: 'GET',
      }
    );
  }

  // Get profile image URLs
  async getProfileImageUrls(): Promise<APIResponse<ProfileImageUrlsResponse>> {
    return FetchClient.makeRequest<ProfileImageUrlsResponse>(API_ENDPOINTS.GET_PROFILE_IMAGE_URLS, {
      method: 'GET',
    });
  }

  // Get workspace images
  async getWorkspaceImages(userId: string): Promise<APIResponse<WorkspaceImagesResponse>> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return FetchClient.makeRequest<WorkspaceImagesResponse>(
      `${API_ENDPOINTS.GET_WORKSPACE_IMAGES}?user_id=${userId}`,
      {
        method: 'GET',
      }
    );
  }

  // Delete image
  async deleteImage(imageId: string, userId: string): Promise<APIResponse<DeleteImageResponse>> {
    if (!imageId || !userId) {
      throw new Error('Image ID and User ID are required');
    }

    return FetchClient.makeRequest<DeleteImageResponse>(
      `${API_ENDPOINTS.DELETE_IMAGE(imageId)}?user_id=${userId}`,
      {
        method: 'DELETE',
      }
    );
  }
}

export const dmsImageService = new DMSImageService();
