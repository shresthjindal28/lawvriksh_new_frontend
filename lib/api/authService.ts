// Authentication service
import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import type {
  LoginRequest,
  SignupRequest,
  ResetPasswordRequest,
  UserProfile,
  APIResponse,
  ProfileCompletion,
  ProfileUpdateRequest,
  SessionsResponseData,
  LoginResponseData,
  GoogleAuthUrlData,
  Disable2FARequest,
  Enable2FARequest,
  ForgotPasswordRequest,
  Verify2FARequest,
  VerifyOTPRequest,
  SignupResponseData,
  UserSetupRequest,
  UserSetupResponse,
  ProfileData,
  UpdateProfileRequest,
  UpdateProfileResponse,
  Enable2FAResponse,
  Disable2FAResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  AccountDeleteRequest,
  PreRegisterResponse,
} from '@/types/auth';

class AuthService {
  async preregister(data: { email: string }): Promise<APIResponse<PreRegisterResponse>> {
    return FetchClient.makeRequest<PreRegisterResponse>(API_ENDPOINTS.PREREGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async signup(data: SignupRequest): Promise<APIResponse<SignupResponseData>> {
    return FetchClient.makeRequest<SignupResponseData>(API_ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyOTP(data: VerifyOTPRequest): Promise<APIResponse<LoginResponseData>> {
    return FetchClient.makeRequest<LoginResponseData>(API_ENDPOINTS.VERIFY_OTP, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<APIResponse<LoginResponseData>> {
    return FetchClient.makeRequest<LoginResponseData>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verify2FA(data: Verify2FARequest): Promise<APIResponse<LoginResponseData>> {
    return FetchClient.makeRequest<LoginResponseData>(API_ENDPOINTS.VERIFY_2FA, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetPassword(data: ResetPasswordRequest): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest): Promise<APIResponse<ChangePasswordResponse>> {
    const { current_password, new_password } = data;
    const params = new URLSearchParams({
      current_password,
      new_password,
    });
    const url = API_ENDPOINTS.CHANGE_PASSWORD + `?${params.toString()}`;
    return FetchClient.makeRequest<ChangePasswordResponse>(url, {
      method: 'POST',
    });
  }

  async accountDelete(data: AccountDeleteRequest): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.ACCOUNT_DELETE, {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(
    refreshToken: string
  ): Promise<APIResponse<{ access_token: string; refresh_token: string; expires_in: number }>> {
    return FetchClient.makeRequest<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
    }>(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }

  async enable2FA(data: Enable2FARequest): Promise<APIResponse<Enable2FAResponse>> {
    return FetchClient.makeRequest<Enable2FAResponse>(API_ENDPOINTS.ENABLE_2FA, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async disable2FA(data: Disable2FARequest): Promise<APIResponse<Disable2FAResponse>> {
    return FetchClient.makeRequest<Disable2FAResponse>(API_ENDPOINTS.DISABLE_2FA, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Google OAuth
  async getGoogleAuthUrl(): Promise<APIResponse<GoogleAuthUrlData>> {
    return FetchClient.makeRequest<GoogleAuthUrlData>(API_ENDPOINTS.GOOGLE_AUTH_URL, {
      method: 'GET',
    });
  }

  async googleCallback(code: string, state?: string): Promise<APIResponse<LoginResponseData>> {
    const params = new URLSearchParams({ code });
    if (state) params.append('state', state);

    return FetchClient.makeRequest<LoginResponseData>(
      API_ENDPOINTS.GOOGLE_CALLBACK + `?${params.toString()}`,
      {
        method: 'GET',
      }
    );
  }

  //linkedin Oauth

  // Session management
  async logout(): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  }

  async logoutAllSessions(): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.LOGOUT_ALL, {
      method: 'POST',
    });
  }

  async getSessions(): Promise<APIResponse<SessionsResponseData>> {
    return FetchClient.makeRequest<SessionsResponseData>(API_ENDPOINTS.SESSIONS, {
      method: 'GET',
    });
  }

  async deleteSession(sessionId: string): Promise<APIResponse> {
    return FetchClient.makeRequest(API_ENDPOINTS.SESSIONS + `/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Profile management
  async userSetup(data: UserSetupRequest): Promise<APIResponse<UserSetupResponse>> {
    return FetchClient.makeRequest<UserSetupResponse>(API_ENDPOINTS.USER_SETUP, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<APIResponse<ProfileData>> {
    return FetchClient.makeRequest<ProfileData>(API_ENDPOINTS.ME, {
      method: 'GET',
    });
  }

  async updateProfile(
    data: Partial<UpdateProfileRequest>
  ): Promise<APIResponse<UpdateProfileResponse>> {
    return FetchClient.makeRequest<UpdateProfileResponse>(API_ENDPOINTS.USER_SETUP, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateUsername(username: string): Promise<APIResponse> {
    return FetchClient.makeRequest('/profile/username', {
      method: 'PUT',
      body: JSON.stringify({ username }),
    });
  }

  async getUserProfile(userId: string): Promise<APIResponse<UserProfile>> {
    return FetchClient.makeRequest<UserProfile>(`/profile/user/${userId}`, {
      method: 'GET',
    });
  }

  async getPublicProfile(userId: string): Promise<APIResponse<UserProfile>> {
    return FetchClient.makeRequest<UserProfile>(`api/users/${userId}/public`, {
      method: 'GET',
    });
  }

  async getProfileCompletion(): Promise<APIResponse<ProfileCompletion>> {
    return FetchClient.makeRequest<ProfileCompletion>('/profile/completion', {
      method: 'GET',
    });
  }
  // Utility methods
  storeTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      const maxAgeSeconds = 60 * 60 * 24 * 30;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = `${STORAGE_KEYS.ACCESS_TOKEN}=${encodeURIComponent(
        accessToken
      )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
      document.cookie = `${STORAGE_KEYS.REFRESH_TOKEN}=${encodeURIComponent(
        refreshToken
      )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;

      try {
        sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      } catch {}
    }
  }

  storeProfileImageUrls(urls: Record<string, string>): void {
    if (typeof window !== 'undefined') {
      const maxAgeSeconds = 60 * 60 * 24 * 30;
      const secure = window.location.protocol === 'https:' ? '; Secure' : '';
      const urlsString = JSON.stringify(urls);
      document.cookie = `${STORAGE_KEYS.PROFILE_IMAGE_URLS}=${encodeURIComponent(
        urlsString
      )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;

      try {
        sessionStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE_URLS, urlsString);
        localStorage.removeItem(STORAGE_KEYS.PROFILE_IMAGE_URLS);
      } catch {}
    }
  }

  getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
    const accessToken =
      this.getTokenFromCookie(STORAGE_KEYS.ACCESS_TOKEN) ??
      (typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) : null);
    const refreshToken =
      this.getTokenFromCookie(STORAGE_KEYS.REFRESH_TOKEN) ??
      (typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) : null);
    return { accessToken, refreshToken };
  }

  getStoredProfileImageUrls(): Record<string, string> | null {
    const urlsString =
      this.getTokenFromCookie(STORAGE_KEYS.PROFILE_IMAGE_URLS) ??
      (typeof window !== 'undefined'
        ? sessionStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE_URLS)
        : null);

    if (!urlsString) return null;
    try {
      return JSON.parse(urlsString);
    } catch {
      return null;
    }
  }

  clearTokens(): void {
    if (typeof window !== 'undefined') {
      document.cookie = `${STORAGE_KEYS.ACCESS_TOKEN}=; path=/; max-age=0`;
      document.cookie = `${STORAGE_KEYS.REFRESH_TOKEN}=; path=/; max-age=0`;
      document.cookie = `${STORAGE_KEYS.PROFILE_IMAGE_URLS}=; path=/; max-age=0`;

      try {
        sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.PROFILE_IMAGE_URLS);
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.PROFILE_IMAGE_URLS);
      } catch {}
    }
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload || typeof payload.exp !== 'number') {
        return false;
      }
      return payload.exp * 1000 < Date.now();
    } catch {
      return false;
    }
  }

  getUserDetailsFromToken(): any | null {
    if (typeof window === 'undefined') return null;
    const token =
      this.getTokenFromCookie(STORAGE_KEYS.ACCESS_TOKEN) ??
      sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  }

  private getTokenFromCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, ...rest] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(rest.join('='));
      }
    }
    return null;
  }
}

export const authService = new AuthService();
