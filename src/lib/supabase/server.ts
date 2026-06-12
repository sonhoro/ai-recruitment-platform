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
 * Both clients use `createClient<Database>` from `@supabase/supabase-js` directly
 * so TypeScript can fully resolve the Database generic and `.from()` returns the
 * correct typed builder instead of `never`.
 *
 * Cookie handling for session auth is wired manually via the `global.fetch`
 * interceptor pattern — compatible with Next.js 15 App Router.
 */

import { cookies }      from 'next/headers';
import { createClient } from '@supabase/supabase-js';
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
 * Reads the auth token from the Next.js cookie store so
 * Supabase Auth can resolve the logged-in user server-side.
 *
 * @example
 * const supabase = await createServerClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * const { data: jobs }     = await supabase.from('jobs').select('*');
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  // Build a cookie-string header that supabase-js sends on every request
  // so the PostgREST RLS context sees the correct JWT.
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        Cookie: cookieHeader,
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
