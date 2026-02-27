import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    let res = NextResponse.next({ request: { headers: req.headers } });

    // createServerClient reads AND refreshes the session cookie via the handlers below
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    return req.cookies.get(name)?.value;
                },
                set(name, value, options) {
                    req.cookies.set({ name, value, ...options });
                    res = NextResponse.next({ request: { headers: req.headers } });
                    res.cookies.set({ name, value, ...options });
                },
                remove(name, options) {
                    req.cookies.set({ name, value: '', ...options });
                    res = NextResponse.next({ request: { headers: req.headers } });
                    res.cookies.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { data: { session } } = await supabase.auth.getSession();

    const { pathname } = req.nextUrl;

    const publicPaths = ['/login', '/signup', '/pricing', '/auth/callback'];
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    if (!session && !isPublicPath && pathname !== '/') {
        return NextResponse.redirect(new URL('/login', req.url));
    }
    if (session && (pathname === '/login' || pathname === '/signup')) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (pathname === '/') {
        return NextResponse.redirect(new URL(session ? '/dashboard' : '/login', req.url));
    }

    return res;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|admin).*)'],
};
