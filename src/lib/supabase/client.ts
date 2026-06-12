/**
 * src/lib/supabase/client.ts
 *
 * Browser-side Supabase client.
 *
 * - Uses NEXT_PUBLIC_* environment variables (safe to expose).
 * - Instantiated once via a singleton pattern to avoid multiple GoTrueClient
 *   warnings in development (React strict mode / HMR).
 * - Suitable for use inside Client Components ('use client').
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Singleton — reuse the same instance across HMR cycles in development.
declare global {
  // eslint-disable-next-line no-var
  var __supabaseBrowserClient: ReturnType<typeof createClient> | undefined;
}

export const supabaseBrowser =
  globalThis.__supabaseBrowserClient ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__supabaseBrowserClient = supabaseBrowser;
}
