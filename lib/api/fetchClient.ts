import { APIResponse } from '@/types/auth';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';

class fetchClient {
  private baseURL: string;
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL!;
  }

  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'ngrok-skip-browser-warning': 'true',
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = this.getAccessTokenFromCookie();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // try to parse text fallback
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { raw: text };
        }
      }

      if (!response.ok) {
        const errMsg = this.getErrorMessage(data, 'Request failed');

        const error = new Error(errMsg);
        // attach extra info for debugging
        (error as any).status = response.status;
        (error as any).body = data;
        throw error;
      }

      // Normalize success/data shape to match frontend expectations.
      // If the backend already returns an object with a `success` boolean
      // or `data` wrapper, preserve it. Otherwise wrap the raw response
      // body into `{ success: true, data: <body> }` so callers can use
      // `response.success` and `response.data` uniformly.
      if (data && typeof data.success === 'boolean') {
        return data;
      }

      return {
        success: true,
        data,
      } as unknown as APIResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async makeFileRequest(
    endpoint: string,
    options: RequestInit = {},
    filename?: string
  ): Promise<APIResponse> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'ngrok-skip-browser-warning': 'true',
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = this.getAccessTokenFromCookie();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let body: any = null;
        try {
          const ct = response.headers.get('content-type') || '';
          body = ct.includes('application/json') ? await response.json() : await response.text();
        } catch (e) {
          body = null;
        }
        const err = new Error(`Request failed: ${response.status} ${response.statusText}`);
        (err as any).status = response.status;
        (err as any).body = body;
        throw err;
      }

      const blob = await response.blob();

      // Auto-download the file
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      if (filename) {
        link.download = filename;
      } else {
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          link.download = filenameMatch ? filenameMatch[1] : 'export-file';
        } else {
          link.download = 'export-file';
        }
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return {
        success: true,
        message: 'File downloaded successfully',
        data: null,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Download failed',
        data: null,
      };
    }
  }

  upload({
    url,
    file,
    signal,
    onProgress,
    method = 'PUT',
    body,
    isS3 = false,
  }: {
    url: string;
    file: File;
    signal: AbortSignal;
    onProgress: (progress: number) => void;
    method?: 'PUT' | 'POST';
    body?: FormData; // For direct backend uploads with extra data
    isS3?: boolean; // S3 presigned URLs don't need auth headers
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);

      // Add auth token only for direct-to-backend uploads, not for S3.
      if (!isS3 && typeof window !== 'undefined') {
        const token = this.getAccessTokenFromCookie();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
      }

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () =>
        reject(new Error('A network error occurred during upload'))
      );
      xhr.addEventListener('abort', () => reject(new Error('The upload was cancelled')));

      signal.addEventListener('abort', () => xhr.abort());

      xhr.send(body || file);
    });
  }

  async makeDocumentUploadRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = this.getAccessTokenFromCookie();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { raw: text };
        }
      }

      if (!response.ok) {
        const error = new Error(this.getErrorMessage(data, 'Request failed'));
        (error as any).status = response.status;
        (error as any).body = data;
        throw error;
      }

      // Normalize success/data shape
      if (data && typeof data.success === 'boolean') {
        return data;
      }

      return {
        success: true,
        data,
      } as unknown as APIResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  private getAccessTokenFromCookie(): string | null {
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

  private getErrorMessage(data: any, fallback: string): string {
    if (!data) return fallback;
    if (typeof data === 'string') return data;
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    if (data.error && typeof data.error.message === 'string') return data.error.message;
    if (data.error && typeof data.error.detail === 'string') return data.error.detail;
    if (data.detail) return JSON.stringify(data.detail);
    try {
      return JSON.stringify(data);
    } catch (e) {
      return fallback;
    }
  }
}

export const FetchClient = new fetchClient();
