'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Types are defined in ./types.ts but we can't re-export types from 'use server' files
// Import types directly from @/lib/auth/types in client components

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Inline type for return values since we can't re-export
interface ActionLoginResult {
  success: boolean;
  error?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

interface ActionRegisterResult {
  success: boolean;
  error?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

/**
 * Server Action: Login user
 * Sets HttpOnly cookie and returns result
 */
export async function loginAction(
  email: string,
  password: string
): Promise<ActionLoginResult> {
  if (!API_BASE_URL) {
    return { success: false, error: 'API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Login failed',
      };
    }

    // Set the auth token in HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('authToken', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Revalidate cached data
    revalidatePath('/');

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Server Action: Register new user
 */
export async function registerAction(userData: {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}): Promise<ActionRegisterResult> {
  if (!API_BASE_URL) {
    return { success: false, error: 'API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: userData.username || userData.email,
        email: userData.email,
        password: userData.password,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Registration failed',
      };
    }

    // Set the auth token in HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('authToken', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Revalidate cached data
    revalidatePath('/');

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Server Action: Logout user
 * Clears the auth cookie and redirects
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expire immediately
  });

  // Revalidate all cached data
  revalidatePath('/');
  
  // Redirect to login page
  redirect('/login');
}

/**
 * Server Action: Google OAuth login
 */
export async function googleLoginAction(credential: string): Promise<ActionLoginResult> {
  if (!API_BASE_URL) {
    return { success: false, error: 'API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/google/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Google login failed',
      };
    }

    // Set the auth token in HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set('authToken', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Revalidate cached data
    revalidatePath('/');

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('Google login error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Server Action: Forgot password request
 */
export async function forgotPasswordAction(email: string): Promise<{ success: boolean; error?: string }> {
  if (!API_BASE_URL) {
    return { success: false, error: 'API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/password-reset/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to send reset email',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Forgot password error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Server Action: Reset password with uid and token
 */
export async function resetPasswordAction(
  uid: string,
  token: string,
  password: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!API_BASE_URL) {
    return { success: false, error: 'API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/password-reset-confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid, token, new_password: password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.detail || data.error || 'Failed to reset password',
      };
    }

    return { 
      success: true,
      message: data.detail || 'Password reset successfully',
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Server Action: Refresh user data in cache
 * Call this after profile updates
 */
export async function refreshUserAction(): Promise<void> {
  revalidatePath('/');
}
