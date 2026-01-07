import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy for Server-Side Route Protection
 * 
 * SECURITY: Auth checks happen on the server using HttpOnly cookies.
 * This prevents unauthenticated users from accessing protected routes
 * BEFORE any client-side code runs.
 */

// Routes that require authentication
const protectedRoutes = [
  '/profile',
  '/game',
  '/dashboard',
  '/settings',
  '/history',
  '/categories',
  '/teams',
  '/membership',
  '/plans',
];

// Routes that should redirect TO home if already authenticated
// Using lowercase for consistent matching
const authRoutes = ['/login', '/signup', '/forgotpassword', '/resetpassword'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath = pathname.toLowerCase(); // Normalize for case-insensitive matching
  const authToken = request.cookies.get('authToken')?.value;

  // Skip proxy for API routes, static files, etc.
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Check if accessing a protected route without auth
  const isProtectedRoute = protectedRoutes.some(route => 
    normalizedPath === route || normalizedPath.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if accessing auth routes while already authenticated
  const isAuthRoute = authRoutes.some(route => 
    normalizedPath === route || normalizedPath.startsWith(`${route}/`)
  );
  
  if (isAuthRoute && authToken) {
    // Get redirect URL from query params, or default to dashboard
    const redirect = request.nextUrl.searchParams.get('redirect') || '/dashboard';
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (already handled above but explicit here)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, images, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|icons|logo|avatars|.*\\..*|og-image).*)',
  ],
};
