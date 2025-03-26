import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname;
  
  // Check if the pathname starts with /user or /admin
  if (pathname.startsWith('/user') || pathname.startsWith('/admin')) {
    // Get the session token from cookies
    const token = request.cookies.get('next-auth.session-token');
    
    // If not signed in
    if (!token) {
      // Redirect to sign-in page with callback URL
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/user/:path*', '/admin/:path*']
};

