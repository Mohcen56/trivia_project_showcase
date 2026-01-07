import { api } from './base';
import { User } from '@/types/game';
import { clearAuthData } from '@/lib/utils/auth-utils';
import { logger } from '@/lib/utils/logger';

/** Extracts error message from API error response */
function extractApiError(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const err = error as { response?: { data?: { error?: string; message?: string } } };
    return err.response?.data?.error || err.response?.data?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

interface AuthResult<T = undefined> {
  success: boolean;
  error?: string;
  token?: string;
  user?: User;
  data?: T;
}

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await api.post('/api/auth/login/', { email, password });
      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error: unknown) {
      logger.warn('Login failed', { email, error });
      return {
        success: false,
        error: extractApiError(error, 'Login failed'),
      };
    }
  },

  register: async (userData: {
    email: string;
    password: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<AuthResult> => {
    try {
      const response = await api.post('/api/auth/register/', {
        username: userData.username || userData.email,
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name || '',
        last_name: userData.last_name || ''
      });
      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error: unknown) {
      logger.warn('Registration failed', { email: userData.email, error });
      return {
        success: false,
        error: extractApiError(error, 'Registration failed'),
      };
    }
  },
  
  logout: async (): Promise<AuthResult> => {
    if (typeof window !== 'undefined') {
      await clearAuthData();
    }
    return { success: true };
  },
  
  getProfile: async (): Promise<AuthResult> => {
    try {
      const response = await api.get('/api/auth/profile/');
      return {
        success: true,
        user: response.data.user,
      };
    } catch (error: unknown) {
      logger.warn('Failed to fetch user profile', { error });
      return {
        success: false,
        error: extractApiError(error, 'Failed to fetch profile'),
      };
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const result = await authAPI.getProfile();
    return result.success ? result.user ?? null : null;
  },

  updateProfile: async (data: { username?: string; email?: string; first_name?: string; last_name?: string }): Promise<AuthResult> => {
    try {
      const response = await api.patch('/api/auth/profile/update/', data);
      return {
        success: true,
        user: response.data.user,
      };
    } catch (error: unknown) {
      logger.warn('Profile update failed', { error });
      return {
        success: false,
        error: extractApiError(error, 'Profile update failed'),
      };
    }
  },

  updateProfilePicture: async (imageFile: File): Promise<AuthResult & { avatar_url?: string }> => {
    try {
      const formData = new FormData();
      formData.append('avatar', imageFile);
      
      const response = await api.patch('/api/auth/profile/avatar/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return {
        success: true,
        avatar_url: response.data.avatar_url,
        user: response.data.user,
      };
    } catch (error: unknown) {
      logger.warn('Profile picture update failed', { error });
      return {
        success: false,
        error: extractApiError(error, 'Profile picture update failed'),
      };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<AuthResult & { message?: string }> => {
    try {
      const response = await api.post('/api/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      return {
        success: true,
        message: response.data.message || 'Password changed successfully',
      };
    } catch (error: unknown) {
      logger.warn('Password change failed', { error });
      return {
        success: false,
        error: extractApiError(error, 'Password change failed'),
      };
    }
  },

  googleOAuth: async (googleToken: string): Promise<AuthResult & { is_new?: boolean }> => {
    try {
      const response = await api.post('/api/auth/google-oauth/', {
        token: googleToken,
      });
      
      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
        is_new: response.data.is_new,
      };
    } catch (error: unknown) {
      logger.warn('Google OAuth failed', { error });
      return {
        success: false,
        error: extractApiError(error, 'Google login failed'),
      };
    }
  },
};