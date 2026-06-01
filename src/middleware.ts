import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('transit_token')?.value;
  const { pathname } = request.nextUrl;

  // Decode token to get user role
  const payload = token ? decodeJwt(token) : null;
  const role = payload?.role; // 'passenger' | 'driver' | 'company'

  // 1. Guard Passenger Portal
  if (pathname.startsWith('/passenger/dashboard')) {
    if (!token || role !== 'passenger') {
      const response = NextResponse.redirect(new URL('/passenger/login', request.url));
      // Clear token cookie if it is invalid or has wrong role
      if (token) {
        response.cookies.delete('transit_token');
        response.cookies.delete('transit_refresh_token');
      }
      return response;
    }
  }

  // 2. Guard Company Portal
  if (pathname.startsWith('/company/dashboard')) {
    if (!token || role !== 'company') {
      const response = NextResponse.redirect(new URL('/company/login', request.url));
      // Clear token cookie if it is invalid or has wrong role
      if (token) {
        response.cookies.delete('transit_token');
        response.cookies.delete('transit_refresh_token');
      }
      return response;
    }
  }

  // 3. Redirect Authenticated Users away from Login/Register pages
  if (pathname === '/passenger/login' || pathname === '/passenger/register') {
    if (token && role === 'passenger') {
      return NextResponse.redirect(new URL('/passenger/dashboard', request.url));
    }
  }

  if (pathname === '/company/login') {
    if (token && role === 'company') {
      return NextResponse.redirect(new URL('/company/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Specify the paths that the middleware should run on
export const config = {
  matcher: [
    '/passenger/:path*',
    '/company/:path*',
  ],
};
