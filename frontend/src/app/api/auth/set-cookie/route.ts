import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/set-cookie
 * Sets an HTTP-only authToken cookie for SSR authentication.
 * Called from client after successful login/signup.
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const cookieStore = await cookies();

    // Set HTTP-only cookie with secure settings
    cookieStore.set('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // 30 days expiry (match your token expiry)
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to set cookie', detail: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/set-cookie
 * Clears the authToken cookie on logout.
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();

    cookieStore.set('authToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cookie', detail: (error as Error).message },
      { status: 500 }
    );
  }
}
