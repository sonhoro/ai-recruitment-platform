/**
 * src/lib/supabase/server.ts
 *
 * Server-side Supabase client factory.
 *
 * Exports:
 *  1. `createServerClient()`  — anon key + cookie auth. For Server Components,
 *     Server Actions, and Route Handlers under the logged-in user's context.
 *  2. `createAdminClient()`   — service role key, bypasses RLS. For webhooks,
 *     background jobs, and admin-only routes. NEVER expose to the browser.
 *
 * The regular client uses `@supabase/ssr`'s `createServerClient` so that
 * auth operations (signIn, signOut, refresh) properly set session cookies
 * in the response, and the middleware can detect the logged-in user.
 */

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'http://localhost:54321';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';
const SUPABASE_SRK  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Standard server client  (anon key + cookie-based session)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a typed Supabase client with the anon key.
 * Uses `@supabase/ssr` to automatically read session cookies from the request
 * and write them back on auth operations (signIn / signOut / refresh).
 *
 * @example
 * const supabase = await createServerClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * const { data: jobs }     = await supabase.from('jobs').select('*');
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSsrServerClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        );
      },
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Admin / Service-role client  (bypasses RLS)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a Supabase client with the SERVICE ROLE key.
 * Bypasses ALL Row Level Security policies.
 *
 * ⚠️  Use ONLY in trusted server-side contexts:
 *    - Webhook handlers (e.g. /api/webhook-ats-result)
 *    - Background / cron jobs
 *    - Admin Server Actions
 *
 * @example
 * const admin = createAdminClient();
 * await admin.from('scores').insert(scorePayload);
 */
export function createAdminClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SRK, {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  });
}
