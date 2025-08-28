import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/admin',
  '/settings',
  '/api/protected'
];

// Define guest-only routes (redirect authenticated users)
const guestOnlyRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password'
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy',
  '/api/health'
];

// Helper function to check if a route matches any pattern
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    // Exact match
    if (pathname === route) return true;
    
    // Wildcard match (e.g., '/admin' matches '/admin/users')
    if (pathname.startsWith(route + '/')) return true;
    
    return false;
  });
}

// Helper function to get tokens from request
function getTokensFromRequest(request: NextRequest): { accessToken: string | null; refreshToken: string | null } {
  // Try to get tokens from cookies first
  const accessTokenFromCookie = request.cookies.get('access_token')?.value;
  const refreshTokenFromCookie = request.cookies.get('refresh_token')?.value;
  
  if (accessTokenFromCookie) {
    return {
      accessToken: accessTokenFromCookie,
      refreshToken: refreshTokenFromCookie || null
    };
  }

  // Fallback: check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return {
      accessToken: authHeader.substring(7),
      refreshToken: null
    };
  }

  return { accessToken: null, refreshToken: null };
}

// Helper function to validate token format (basic check)
function isValidTokenFormat(token: string): boolean {
  // Basic JWT format check: should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Check if it's valid base64 (basic validation)
    if (!parts[1]) return false;
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has required fields and isn't expired
    if (!payload.exp || !payload.sub) return false;
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return false;
    
    return true;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  
  // Get authentication tokens
  const { accessToken } = getTokensFromRequest(request);
  const isAuthenticated = accessToken ? isValidTokenFormat(accessToken) : false;

  // Handle protected routes
  if (matchesRoute(pathname, protectedRoutes)) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle guest-only routes
  if (matchesRoute(pathname, guestOnlyRoutes)) {
    if (isAuthenticated) {
      // Get return URL from query params or default to dashboard
      const returnTo = request.nextUrl.searchParams.get('returnTo') || '/dashboard';
      const redirectUrl = new URL(returnTo, request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Public API routes
    if (matchesRoute(pathname, publicRoutes)) {
      return NextResponse.next();
    }
    
    // Protected API routes
    if (pathname.startsWith('/api/protected') || pathname.startsWith('/api/v1/auth/me')) {
      if (!isAuthenticated) {
        return NextResponse.json(
          { 
            success: false,
            error: { 
              code: 'UNAUTHORIZED', 
              message: 'Authentication required' 
            } 
          },
          { status: 401 }
        );
      }
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP header for enhanced security - strict mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const cspHeader = isDevelopment
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline/eval in dev for HMR
        "style-src 'self' 'unsafe-inline'", // Allow inline styles in dev
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' ws: wss: http://localhost:* http://127.0.0.1:*",
        "frame-ancestors 'none'"
      ].join('; ')
    : [
        "default-src 'self'",
        "script-src 'self'", // Strict: no inline scripts in production
        "style-src 'self'", // Strict: no inline styles in production  
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
      ].join('; ');
  
  response.headers.set('Content-Security-Policy', cspHeader);
  
  // HSTS header for HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};