import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/check
 * 
 * Simple endpoint to check if user is authenticated.
 * Returns 200 if authToken cookie exists, 401 otherwise.
 * Used by client components to check auth state without exposing the token.
 */
export async function GET() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;

  if (authToken) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
