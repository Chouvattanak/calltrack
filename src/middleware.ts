import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  user_id?: string;
  user_name?: string;
  email?: string;
  exp?: number;
}

// Protected routes that require authentication
const protectedPaths = [
  '/callpipeline',
  '/properties',
  '/leads',
  '/staff',
  '/commission',
  '/reports',
  '/settings'
];

// Public routes that don't require authentication
const publicPaths = [
  '/signin',
  '/signup',
  '/reset-password',
  '/forgot-password'
];

function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Check if token has expiration and if it's still valid
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value || 
                request.headers.get('Authorization')?.replace('Bearer ', '');

  const isAuthenticated = token && isTokenValid(token);
  const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));
  const isPublicRoute = publicPaths.some(path => pathname.startsWith(path));

  // Redirect to signin if accessing protected route without valid token
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth pages while authenticated
  if (isPublicRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/callpipeline';
    return NextResponse.redirect(url);
  }

  // Redirect root to appropriate page
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = isAuthenticated ? '/callpipeline' : '/signin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.).*)',
  ],
}
