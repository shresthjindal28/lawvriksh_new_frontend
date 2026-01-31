import 'server-only';

import { cookies } from 'next/headers';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import type { APIResponse } from '@/types/auth';
import type { WorkspaceProjectResponse } from '@/types/workspace';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';

function getErrorMessage(data: any, fallback: string): string {
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
  } catch {
    return fallback;
  }
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseURL) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  }

  const url = `${baseURL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      'ngrok-skip-browser-warning': 'true',
    },
    ...options,
  };

  const cookieStore = await cookies();
  const token = cookieStore.get(STORAGE_KEYS.ACCESS_TOKEN)?.value ?? null;
  if (token) {
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get('content-type') || '';
  let data: any = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Request failed (${response.status})`));
  }

  if (data && typeof data.success === 'boolean') {
    return data;
  }

  return {
    success: true,
    data,
  } as unknown as APIResponse<T>;
}

export async function getWorkspaceServer(
  page: number,
  limit: number
): Promise<APIResponse<WorkspaceProjectResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  return makeRequest<WorkspaceProjectResponse>(`${API_ENDPOINTS.WORKSPACES_PROJECTS}?${params}`, {
    method: 'GET',
  });
}
