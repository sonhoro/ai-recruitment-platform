/**
 * src/lib/supabase/middleware.ts
 *
 * Supabase session refresh helper for Next.js Middleware.
 *
 * This function is called from `src/middleware.ts` on every request.
 * Its sole responsibility is to:
 *   1. Read the current session cookie.
 *   2. Refresh the access token if it has expired.
 *   3. Write the updated cookie back to both the request and the response
 *      so that Server Components always receive a valid session.
 *
 * It does NOT perform route protection — that logic belongs in middleware.ts.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Start with a "pass-through" response that can be mutated with cookies.
  let supabaseResponse = NextResponse.next({ request });

  createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Write cookies to the outgoing request (for Server Components).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // 2. Re-create the response so it carries the new cookies to the browser.
          supabaseResponse = NextResponse.next({ request });

          // 3. Write cookies to the response (for the browser).
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not add logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make tokens harder to
  // refresh and your users randomly logged out.

  return supabaseResponse;
}
