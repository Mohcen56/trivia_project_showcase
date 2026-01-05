import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Route Protection
 * 
 * SECURITY: Auth checks happen on the server using HttpOnly cookies.
 * This prevents unauthenticated users from accessing protected routes.
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
];

// Routes that should redirect TO home if already authenticated
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('authToken')?.value;

  // Check if accessing a protected route without auth
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if accessing auth routes while already authenticated
  const isAuthRoute = authRoutes.some(route => pathname === route);
  
  if (isAuthRoute && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|avatars|icons|logo|ads.txt).*)',
  ],
};
