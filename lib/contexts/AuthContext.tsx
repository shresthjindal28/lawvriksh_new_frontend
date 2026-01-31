'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api/authService';
import { genAIService } from '@/lib/api/genAiService';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import {
  User,
  AuthTokens,
  LoginRequest,
  SignupRequest,
  VerifyOTPRequest,
  Verify2FARequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  Enable2FARequest,
  Disable2FARequest,
  APIResponse,
  LoginResponseData,
  SignupResponseData,
  UserSetupRequest,
  UserSetupResponse,
  UserProfile,
  UpdateProfileResponse,
  UpdateProfileRequest,
  Enable2FAResponse,
  Disable2FAResponse,
  PreRegisterResponse,
} from '@/types/auth';
import {
  LoginRequestSchema,
  SignupRequestSchema,
  VerifyOTPRequestSchema,
  Verify2FARequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
  Enable2FARequestSchema,
  Disable2FARequestSchema,
  UserSetupRequestSchema,
  UpdateProfileRequestSchema,
  PreregisterRequestSchema,
} from '@/lib/validators/auth/requests';
import { fromZodError } from 'zod-validation-error';
import {
  loginResponseDataSchema,
  signupResponseDataSchema,
  userSetupResponseSchema,
  updateProfileResponseSchema,
  enable2FAResponseSchema,
  disable2FAResponseSchema,
  changePasswordResponseSchema,
  userProfileSchema,
} from '@/lib/validators';
import { validateApiResponse } from '@/lib/utils/helpers';
interface AuthContextType {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isInitialLoading: boolean;
  isLoading: boolean;
  error: string | null;
  profile: UserProfile | null;

  // Auth actions
  preRegister: (data: { email: string }) => Promise<APIResponse<PreRegisterResponse>>;
  login: (credentials: LoginRequest) => Promise<APIResponse<LoginResponseData>>;
  signup: (data: SignupRequest) => Promise<APIResponse<SignupResponseData>>;
  verifyOTP: (data: VerifyOTPRequest) => Promise<APIResponse<LoginResponseData>>;
  verify2FA: (data: Verify2FARequest) => Promise<APIResponse<LoginResponseData>>;
  logout: () => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<APIResponse>;
  resetPassword: (data: ResetPasswordRequest) => Promise<APIResponse>;
  enable2FA: (data: Enable2FARequest) => Promise<APIResponse<Enable2FAResponse>>;
  disable2FA: (data: Disable2FARequest) => Promise<APIResponse<Disable2FAResponse>>;
  UserSetup: (data: UserSetupRequest) => Promise<APIResponse<UserSetupResponse>>;
  getProfile: () => Promise<APIResponse<{ profile: UserProfile }>>;
  updateProfile: (
    data: Partial<UpdateProfileRequest>
  ) => Promise<APIResponse<UpdateProfileResponse>>;

  // Utility actions
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!tokens;

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();

    return () => {
      // Cleanup timer on unmount
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up automatic token refresh when tokens change
  useEffect(() => {
    if (tokens?.access_token && tokens?.expires_in) {
      scheduleTokenRefresh(tokens.expires_in);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  //Refreshes 5 minutes before expiry or at 80% of token lifetime
  const scheduleTokenRefresh = (expiresIn: number) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Calculate when to refresh (5 minutes before expiry or 80% of lifetime)
    const fiveMinutes = 5 * 60 * 1000;
    const eightyPercent = expiresIn * 0.8 * 1000;
    const refreshIn = Math.min(expiresIn * 1000 - fiveMinutes, eightyPercent);

    // Only schedule if we have time before expiration
    if (refreshIn > 0) {
      refreshTimerRef.current = setTimeout(() => {
        refreshTokenSilently();
      }, refreshIn);
    }
  };

  const initializeAuth = async () => {
    try {
      setError(null);
      const storedTokens = authService.getStoredTokens();

      if (!storedTokens.accessToken || !storedTokens.refreshToken) {
        setIsInitialLoading(false);
        return;
      }

      // Set tokens first so they're available for API calls
      setTokens({
        access_token: storedTokens.accessToken,
        refresh_token: storedTokens.refreshToken,
        token_type: 'bearer',
        expires_in: 0,
      });

      // Check if access token is expired
      if (authService.isTokenExpired(storedTokens.accessToken)) {
        // Token is expired, try to refresh
        const refreshSuccess = await refreshTokenSilently();
        if (!refreshSuccess) {
          // Refresh failed, clear everything
          authService.clearTokens();
          setTokens(null);
          setIsInitialLoading(false);
          return;
        }
      }

      // Get current user (this will auto-refresh if needed via withTokenRefresh)
      const profileSuccess = await fetchUserProfile();

      if (!profileSuccess) {
        console.error('Failed to load profile during auth initialization');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  //Refresh token with race condition protection
  const refreshTokenSilently = async (): Promise<boolean> => {
    // If a refresh is already in progress, wait for it
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    // Create new refresh promise
    const refreshPromise = (async () => {
      try {
        const storedTokens = authService.getStoredTokens();
        if (!storedTokens.refreshToken) {
          return false;
        }

        const response = await authService.refreshToken(storedTokens.refreshToken);

        if (response.success && response.data) {
          const newTokens: AuthTokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            token_type: 'bearer',
            expires_in: response.data.expires_in,
          };

          authService.storeTokens(newTokens.access_token, newTokens.refresh_token);
          setTokens(newTokens);

          return true;
        }

        return false;
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Don't call logout here - let the caller decide what to do
        return false;
      } finally {
        // Clear the refresh promise
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  };

  const getErrorStatus = (err: any): number | undefined => {
    return err?.status ?? err?.response?.status;
  };

  // Helper to handle profile image URLs storage
  const handleProfileImageUrls = (urls?: Record<string, string>) => {
    if (urls && Object.keys(urls).length > 0) {
      authService.storeProfileImageUrls(urls);
      return urls;
    }
    // Fallback to stored URLs if not provided
    return authService.getStoredProfileImageUrls() || undefined;
  };

  // Fetch user profile with automatic retry on 401
  const fetchUserProfile = async (retryCount = 0): Promise<boolean> => {
    try {
      const response = await authService.getCurrentUser();

      if (response.success && response.data?.profile) {
        const validatedProfile = userProfileSchema.parse(response.data.profile);

        // Handle profile image URLs (store if new, retrieve if missing)
        const profileImageUrls = handleProfileImageUrls(validatedProfile.profile_image_urls);

        const normalizedProfile = {
          ...validatedProfile,
          created_at: validatedProfile.created_at ?? '',
          profile_image_urls: profileImageUrls,
        } as UserProfile;
        setProfile(normalizedProfile);
        const userId = normalizedProfile.user_id || '';
        setUser({
          email: normalizedProfile.email || '',
          user_id: userId,
          role: normalizedProfile.role,
          two_fa_enabled: normalizedProfile.two_fa_enabled || false,
          profile_image_urls: profileImageUrls,
          name: normalizedProfile.name || undefined,
          username: normalizedProfile.username || undefined,
          picture: normalizedProfile.picture || undefined,
        });
        // Store user_id for WebSocket authentication
        if (typeof window !== 'undefined' && userId) {
          localStorage.setItem('user_id', userId);
        }
        return true;
      }

      return false;
    } catch (error: any) {
      // If 401 and haven't retried yet, try refreshing token and retry
      if (getErrorStatus(error) === 401 && retryCount === 0) {
        const refreshSuccess = await refreshTokenSilently();
        if (refreshSuccess) {
          return fetchUserProfile(retryCount + 1);
        }
      }

      console.error('Failed to fetch user profile:', error);
      return false;
    }
  };

  //Wrapper for authenticated API calls with automatic token refresh
  const withTokenRefresh = async <T,>(apiCall: () => Promise<T>, retryCount = 0): Promise<T> => {
    try {
      return await apiCall();
    } catch (error: any) {
      // If 401 Unauthorized and haven't retried yet
      if (getErrorStatus(error) === 401 && retryCount === 0) {
        // Try to refresh the token
        const refreshSuccess = await refreshTokenSilently();

        if (refreshSuccess) {
          // Retry the original API call
          return withTokenRefresh(apiCall, retryCount + 1);
        } else {
          // Refresh failed, logout user
          await logout();
        }
      }

      throw error;
    }
  };

  const getProfile = async (): Promise<APIResponse<{ profile: UserProfile }>> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await withTokenRefresh(() => authService.getCurrentUser());

      if (response.success && response.data?.profile) {
        const validatedProfile = userProfileSchema.parse(response.data.profile);
        const normalizedProfile = {
          ...validatedProfile,
          created_at: validatedProfile.created_at ?? '',
        } as UserProfile;
        setProfile(normalizedProfile);
        return response;
      } else {
        const errorMessage = response.message || 'Failed to get current user';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current user';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<APIResponse<LoginResponseData>> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = LoginRequestSchema.safeParse(credentials);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        throw new Error(validationError.message);
      }

      const response = await authService.login(parsed.data);

      if (response.success && response.data) {
        const validatedData = validateApiResponse(response, loginResponseDataSchema, 'Login');

        if (validatedData.requires_2fa) {
          // 2FA required, don't set tokens yet
          return response;
        }

        setError(null);

        const newTokens: AuthTokens = {
          access_token: validatedData.access_token,
          refresh_token: validatedData.refresh_token,
          token_type: validatedData.token_type,
          expires_in: validatedData.expires_in,
        };

        authService.storeTokens(newTokens.access_token, newTokens.refresh_token);
        setTokens(newTokens);

        // Handle profile image URLs from login response
        const profileImageUrls = handleProfileImageUrls(validatedData.user.profile_image_urls);
        setUser({
          ...validatedData.user,
          profile_image_urls: profileImageUrls,
        });

        // Fetch user profile
        await fetchUserProfile();

        return response;
      } else {
        const errorMessage = response.message || 'Login failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const preRegister = async (data: {
    email: string;
  }): Promise<APIResponse<PreRegisterResponse>> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = PreregisterRequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        throw new Error(validationError.message);
      }

      const response = await authService.preregister(parsed.data);
      if (response.success) {
        setError(null);
        return response;
      } else {
        const errorMessage = response.message || 'Pre-Register Check failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Pre-Register Check failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupRequest): Promise<APIResponse<SignupResponseData>> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = SignupRequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        throw new Error(validationError.message);
      }

      const response = await authService.signup(parsed.data);

      if (response.success) {
        validateApiResponse(response, signupResponseDataSchema, 'Signup');
        setError(null);
        return response;
      } else {
        const errorMessage = response.message || 'Signup failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (data: VerifyOTPRequest): Promise<APIResponse<LoginResponseData>> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = VerifyOTPRequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        throw new Error(validationError.message);
      }

      const response = await authService.verifyOTP(parsed.data);

      if (response.success && response.data) {
        const validatedData = validateApiResponse(response, loginResponseDataSchema, 'Verify OTP');
        setError(null);

        const newTokens: AuthTokens = {
          access_token: validatedData.access_token,
          refresh_token: validatedData.refresh_token,
          token_type: validatedData.token_type,
          expires_in: validatedData.expires_in,
        };

        authService.storeTokens(newTokens.access_token, newTokens.refresh_token);
        setTokens(newTokens);

        // Handle profile image URLs from verify response
        const profileImageUrls = handleProfileImageUrls(validatedData.user.profile_image_urls);
        setUser({
          ...validatedData.user,
          profile_image_urls: profileImageUrls,
        });

        const deviceInfo = genAIService.getDeviceInfo();
        const mouseMovements = (deviceInfo.mouse_movements || []).map((movement) => ({
          x: movement.additionalProp1 ?? 0,
          y: movement.additionalProp2 ?? 0,
          timestamp: movement.additionalProp3 ?? Date.now(),
        }));

        genAIService.evaluateRisk({
          mouse_movements: mouseMovements,
          completion_time_seconds: deviceInfo.form_completion_time ?? 0,
          email: validatedData.user.email,
          device_info: deviceInfo,
          event_type: 'registration',
        });

        if (validatedData.user.user_id) {
          referenceManagerService
            .createPredefinedTags({ created_by: validatedData.user.user_id })
            .catch(() => {});
        }

        await fetchUserProfile();

        return response;
      } else {
        const errorMessage = response.message || 'OTP verification failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const UserSetup = async (data: UserSetupRequest): Promise<APIResponse<UserSetupResponse>> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = UserSetupRequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        throw new Error(validationError.message);
      }

      const response = await withTokenRefresh(() => authService.userSetup(parsed.data));

      if (response.success) {
        validateApiResponse(response, userSetupResponseSchema, 'User Setup');
        setError(null);

        await fetchUserProfile();
        return response;
      } else {
        const errorMessage = response.message || 'User setup failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'User setup failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    data: Partial<UpdateProfileRequest>
  ): Promise<APIResponse<UpdateProfileResponse>> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = UpdateProfileRequestSchema.partial().safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        throw new Error(validationError.message);
      }

      const response = await withTokenRefresh(() => authService.updateProfile(parsed.data));

      if (response.success) {
        validateApiResponse(response, updateProfileResponseSchema, 'Update Profile');
        setError(null);
        await fetchUserProfile();
        return response;
      } else {
        const errorMessage = response.message || 'Profile update failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (data: Verify2FARequest): Promise<APIResponse<LoginResponseData>> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = Verify2FARequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        return { success: false, message: validationError.message };
      }

      const response = await authService.verify2FA(parsed.data);

      if (response.success && response.data) {
        const validatedData = validateApiResponse(response, loginResponseDataSchema, 'Verify 2FA');
        setError(null);

        const newTokens: AuthTokens = {
          access_token: validatedData.access_token,
          refresh_token: validatedData.refresh_token,
          token_type: validatedData.token_type,
          expires_in: validatedData.expires_in,
        };

        authService.storeTokens(newTokens.access_token, newTokens.refresh_token);
        setTokens(newTokens);

        // Handle profile image URLs from 2FA response
        const profileImageUrls = handleProfileImageUrls(validatedData.user.profile_image_urls);
        setUser({
          ...validatedData.user,
          profile_image_urls: profileImageUrls,
        });

        await fetchUserProfile();

        return response;
      } else {
        const errorMessage = response.message || '2FA verification failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '2FA verification failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Clear the refresh timer
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearTokens();
      setUser(null);
      setProfile(null);
      setTokens(null);
      setError(null);
      setIsLoading(false);
      // Clear user_id from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_id');
      }
      router.push('/login');
    }
  };

  const forgotPassword = async (data: ForgotPasswordRequest): Promise<APIResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = ForgotPasswordRequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        throw new Error(validationError.message);
      }

      const response = await authService.forgotPassword(parsed.data);

      if (response.success) {
        setError(null);
        return response;
      } else {
        const errorMessage = response.message || 'Password reset request failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset request failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordRequest): Promise<APIResponse> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = ResetPasswordRequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        return { success: false, message: validationError.message };
      }

      const response = await authService.resetPassword(parsed.data);

      if (response.success) {
        if (response.data) {
          validateApiResponse(response, changePasswordResponseSchema, 'Reset Password');
        }
        setError(null);
        return response;
      } else {
        const errorMessage = response.message || 'Password reset failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const enable2FA = async (data: Enable2FARequest): Promise<APIResponse<Enable2FAResponse>> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = Enable2FARequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        return { success: false, message: validationError.message };
      }

      const response = await withTokenRefresh(() => authService.enable2FA(parsed.data));

      if (response.success && user) {
        const validatedData = validateApiResponse(response, enable2FAResponseSchema, 'Enable 2FA');
        setError(null);
        setUser({ ...user, two_fa_enabled: validatedData.two_fa_enabled });
        return response;
      } else {
        const errorMessage = response.message || 'Failed to enable 2FA';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable 2FA';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disable2FA = async (data: Disable2FARequest): Promise<APIResponse<Disable2FAResponse>> => {
    try {
      setIsLoading(true);
      setError(null);

      const parsed = Disable2FARequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        return { success: false, message: validationError.message };
      }

      const response = await withTokenRefresh(() => authService.disable2FA(parsed.data));

      if (response.success && user) {
        const validatedData = validateApiResponse(
          response,
          disable2FAResponseSchema,
          'Disable 2FA'
        );
        setError(null);
        setUser({ ...user, two_fa_enabled: validatedData.two_fa_enabled });
        return response;
      } else {
        const errorMessage = response.message || 'Failed to disable 2FA';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable 2FA';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const refreshUser = async () => {
    try {
      await fetchUserProfile();
      setError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh user';
      setError(errorMessage);
    }
  };

  const value: AuthContextType = {
    // State
    user,
    tokens,
    isAuthenticated,
    isInitialLoading,
    isLoading,
    error,
    profile,

    // Actions
    preRegister,
    login,
    signup,
    verifyOTP,
    verify2FA,
    logout,
    forgotPassword,
    resetPassword,
    enable2FA,
    disable2FA,
    clearError,
    refreshUser,
    UserSetup,
    getProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
