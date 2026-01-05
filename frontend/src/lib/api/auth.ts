import { api } from './base';
import { User } from '@/types/game';
import { clearAuthData } from '@/lib/utils/auth-utils';

export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/login/', {
        email,
        password,
      });
      
      return {
        success: true,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error: unknown) {
      let errorMessage = 'Login failed';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { error?: string } } };
        errorMessage = err.response?.data?.error || errorMessage;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  register: async (userData: {
    email: string;
    password: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  }) => {
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
      let errorMessage = 'Registration failed';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { error?: string } } };
        errorMessage = err.response?.data?.error || errorMessage;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
  
  logout: async () => {
    if (typeof window !== 'undefined') {
      await clearAuthData();
    }
    return { success: true };
  },
  
  getProfile: async () => {
    // Updated path after backend modularization (authentication app)
    const response = await api.get('/api/auth/profile/');
    return {
      user: response.data.user,
    };
  },

  getCurrentUser: async (): Promise<User> => {
    const profile = await authAPI.getProfile();
    return profile.user;
  },

  updateProfile: async (data: { username?: string; email?: string; first_name?: string; last_name?: string }) => {
    try {
      // Updated path after backend modularization
      const response = await api.patch('/api/auth/profile/update/', data);
      return {
        success: true,
        user: response.data.user,
      };
    } catch (error: unknown) {
      let errorMessage = 'Profile update failed';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { error?: string } } };
        errorMessage = err.response?.data?.error || errorMessage;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  updateProfilePicture: async (imageFile: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', imageFile);
      
      // Updated path after backend modularization
      const response = await api.patch('/api/auth/profile/avatar/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        success: true,
        avatar_url: response.data.avatar_url,
        user: response.data.user,
      };
    } catch (error: unknown) {
      let errorMessage = 'Profile picture update failed';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { error?: string } } };
        errorMessage = err.response?.data?.error || errorMessage;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
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
      let errorMessage = 'Password change failed';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { error?: string; detail?: string } } };
        errorMessage = err.response?.data?.error || err.response?.data?.detail || errorMessage;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  googleOAuth: async (googleToken: string) => {
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
      let errorMessage = 'Google login failed';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { error?: string } } };
        errorMessage = err.response?.data?.error || errorMessage;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};