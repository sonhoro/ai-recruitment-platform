/**
 * src/middleware.ts
 *
 * Next.js Edge Middleware — session refresh + role-based route protection.
 *
 * Roles:
 *   recruiter    → /dashboard/*
 *   interviewer  → /interviewer/*
 *   candidate    → /candidate/*
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { updateSession } from '@/lib/supabase/middleware';
import type { Database } from '@/types/database.types';

type UserRole = 'recruiter' | 'interviewer' | 'candidate';

const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/dashboard':   ['recruiter'],
  '/interviewer': ['interviewer'],
  '/candidate':   ['candidate'],
};

const PROTECTED_PREFIXES = Object.keys(ROLE_ROUTES);
const AUTH_ROUTES = ['/login', '/register'];

const REDIRECT_MAP: Record<string, string> = {
  recruiter: '/dashboard/jobs',
  interviewer: '/interviewer',
  candidate: '/candidate',
};

function redirectTo(url: string, request: NextRequest): NextResponse {
  const target = request.nextUrl.clone();
  target.pathname = url;
  return NextResponse.redirect(target);
}

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const isDevBypass  = process.env.DEV_BYPASS_AUTH === 'true';

    // Debug endpoint to check env vars
    if (pathname === '/api/debug-env') {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      return NextResponse.json({
        DEV_BYPASS_AUTH: process.env.DEV_BYPASS_AUTH,
        NEXT_PUBLIC_SUPABASE_URL: url ? url : '✗ missing',
        NEXT_PUBLIC_SUPABASE_URL_LENGTH: url ? url.length : 0,
        NEXT_PUBLIC_SUPABASE_URL_CHARS: url ? [...url].map(c => c.charCodeAt(0)).join(',') : [],
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? anon.substring(0, 20) + '...' : '✗ missing',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ set' : '✗ missing',
        N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ? '✓ set' : '✗ missing',
        N8N_CALLBACK_SECRET: process.env.N8N_CALLBACK_SECRET ? '✓ set' : '✗ missing',
      });
    }

    const roleCookie = request.cookies.get('user_role')?.value as UserRole | undefined;

    // ── Dev bypass: skip user session, enforce role from cookie ──
    if (isDevBypass) {
      if (AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
        if (roleCookie && REDIRECT_MAP[roleCookie]) {
          return redirectTo(REDIRECT_MAP[roleCookie], request);
        }
        return NextResponse.next();
      }

      for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(prefix)) {
          if (roleCookie && allowedRoles.includes(roleCookie)) {
            return NextResponse.next();
          }
          return redirectTo('/login', request);
        }
      }

      return NextResponse.next();
    }

    // ── Production: full session + role check ─────────────────
    const response = await updateSession(request);

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();

    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix),
    );
    if (isProtected && !user) {
      return redirectTo('/login', request);
    }

    if (user) {
      for (const [prefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
        if (pathname.startsWith(prefix)) {
          if (!roleCookie || !allowedRoles.includes(roleCookie)) {
            if (roleCookie && REDIRECT_MAP[roleCookie]) {
              return redirectTo(REDIRECT_MAP[roleCookie], request);
            }
            return redirectTo('/login', request);
          }
          break;
        }
      }
    }

    if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && user) {
      const target = roleCookie && REDIRECT_MAP[roleCookie]
        ? REDIRECT_MAP[roleCookie]
        : '/dashboard/jobs';
      return redirectTo(target, request);
    }

    return response;
  } catch (err) {
    console.error('[proxy] Middleware error:', err);
    return NextResponse.json(
      { error: 'Middleware error', message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export default proxy;
