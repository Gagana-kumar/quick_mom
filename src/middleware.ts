import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const sessionCookie = request.cookies.get('session'); // Flask default session cookie name
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register');

    if (!sessionCookie && !isAuthPage) {
        // Redirect to login for all protected pages including home
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Allow access to login/register even if session cookie exists
    // This prevents infinite loops if the session is invalid (e.g. DB reset)
    // if (sessionCookie && isAuthPage) {
    //     return NextResponse.redirect(new URL('/', request.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/meetings/:path*', '/login', '/register'],
};
