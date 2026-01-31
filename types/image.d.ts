export type ImageType = 'profile_image' | 'workspace_image';

export interface InitImageUploadRequest {
  checksum: string;
  file_name: string;
  file_size: number;
  file_type: string;
  image_type: ImageType;
}

export interface InitImageUploadResponse {
  success: boolean;
  image_id: string;
  presigned_url: string;
  expires_in: number;
  error?: string;
}

export interface CompleteImageUploadRequest {
  image_id: string;
  user_id: string;
}

export interface CompleteImageUploadResponse {
  success: boolean;
  image_id: string;
  permanent_url: string;
  file_name: string;
  image_type: ImageType;
  error?: string;
}

export interface ImageData {
  image_id: string;
  file_name: string;
  permanent_url: string;
  created_at: string;
}

export interface ProfileImageResponse {
  success: boolean;
  image_id: string;
  file_name: string;
  permanent_url: string;
  created_at: string;
  error?: string;
}

export interface WorkspaceImagesResponse {
  success: boolean;
  total: number;
  images: ImageData[];
  error?: string;
}

export interface DeleteImageResponse {
  success: boolean;
  image_id: string;
  deleted: boolean;
  error?: string;
}

export interface UploadImageOptions {
  userId: string;
  file: File;
  imageType: ImageType;
  onProgress?: (progress: number) => void;
}

export interface ProfileImageUrlsResponse {
  profile_image_key: string;
  urls: {
    original: string;
    xl: string;
    lg: string;
    md: string;
    sm: string;
  };
  expires_in: number;
}
