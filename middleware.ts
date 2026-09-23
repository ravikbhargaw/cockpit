import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Publicly accessible paths
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    // If authenticated user visits /login, redirect to homepage /
    if (pathname === '/login') {
      const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
      const isAuthenticated = await verifySessionToken(sessionCookie);
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // Extract session token from HTTP-only cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = await verifySessionToken(sessionCookie);

  if (!isAuthenticated) {
    // 1. API routes return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized. Server authentication required.' },
        { status: 401 }
      );
    }

    // 2. UI page routes redirect to /login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
