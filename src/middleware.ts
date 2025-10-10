import type { NextFetchEvent, NextRequest } from 'next/server';
import { detectBot } from '@arcjet/next';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import arcjet from '@/libs/Arcjet';
import { routing } from './libs/I18nRouting';

const handleI18nRouting = createMiddleware(routing);

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/admin',
];

// Improve security with Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    // Block all bots except the following
    allow: [
      // See https://docs.arcjet.com/bot-protection/identifying-bots
      'CATEGORY:SEARCH_ENGINE', // Allow search engines
      'CATEGORY:PREVIEW', // Allow preview links to show OG images
      'CATEGORY:MONITOR', // Allow uptime monitoring services
    ],
  }),
);

export default async function middleware(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  // Get the pathname from the request
  const pathname = request.nextUrl.pathname;

  // Skip middleware for NextAuth routes - let NextAuth handle them completely
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // Handle all API routes - skip i18n routing for all API endpoints
  if (pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Add CORS headers to all API responses and return immediately
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Return response for all API routes - don't let them go through i18n routing
    return response;
  }

  // Skip middleware for tRPC routes
  if (pathname.startsWith('/api/trpc')) {
    return NextResponse.next();
  }

  // Verify the request with Arcjet
  // Use `process.env` instead of Env to reduce bundle size in middleware
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.includes(route)
  );

  if (isProtectedRoute) {
    // Get the JWT token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      // Extract locale from pathname for localized login
      const locale = pathname.match(/^\/([^\/]+)\//)?.at(1) ?? 'vi';
      
      // Redirect to localized login page with callback URL
      const signInUrl = new URL(`/${locale}/login`, request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      
      return NextResponse.redirect(signInUrl);
    }

    // Check admin routes
    if (pathname.includes('/admin')) {
      const userRole = (token as any)?.role;
      console.log('Admin route access attempt:', { pathname, userRole, token: !!token });
      
      // Allow access for super admin (1) and admin (2)
      if (userRole !== 1 && userRole !== 2) {
        // For API routes, return 403
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
        }
        
        // For page routes, redirect non-admin users to regular dashboard
        const locale = pathname.match(/^\/([^\/]+)\//)?.at(1) ?? 'en';
        console.log('Redirecting non-admin user to dashboard');
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
      }
      
      // For admin API routes, skip i18n routing and return early
      if (pathname.startsWith('/api/admin/') || pathname.includes('/api/admin/')) {
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return response;
      }
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next`, `/_vercel` or `monitoring`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
  runtime: 'nodejs',
};
