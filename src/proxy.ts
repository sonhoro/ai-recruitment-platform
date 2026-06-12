/**
 * src/proxy.ts
 *
 * Next.js Edge Middleware (Proxy convention) — session refresh + role-based route protection.
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isDevBypass) {
      if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.json(
          {
            error: 'Configuration error',
            message: `Missing Supabase environment variables: ${
              !supabaseUrl && !supabaseAnonKey
                ? 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
                : !supabaseUrl
                  ? 'NEXT_PUBLIC_SUPABASE_URL'
                  : 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
            }`,
          },
          { status: 500 },
        );
      }

      try {
        new URL(supabaseUrl);
      } catch {
        return NextResponse.json(
          {
            error: 'Configuration error',
            message: `NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${supabaseUrl}"`,
          },
          { status: 500 },
        );
      }
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
      supabaseUrl!,
      supabaseAnonKey!,
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
    console.error('[proxy] Error:', err);
    const message = err instanceof Error ? err.message : String(err);
    const url = request?.url ?? 'unknown';
    return NextResponse.json(
      {
        error: 'Middleware error',
        message,
        url,
        type: err instanceof Error ? err.constructor.name : typeof err,
      },
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
