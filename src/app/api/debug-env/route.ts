/**
 * src/app/api/debug-env/route.ts
 *
 * GET /api/debug-env
 *
 * Debug endpoint to inspect environment variables.
 * Useful for verifying that Vercel environment variables are correctly set.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    DEV_BYPASS_AUTH: process.env.DEV_BYPASS_AUTH,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ?? '✗ missing',
    NEXT_PUBLIC_SUPABASE_URL_LENGTH: supabaseUrl?.length ?? 0,
    NEXT_PUBLIC_SUPABASE_URL_CHARS: supabaseUrl ? [...supabaseUrl].map(c => c.charCodeAt(0)).join(',') : [],
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '✗ missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ set' : '✗ missing',
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ? '✓ set' : '✗ missing',
    N8N_CALLBACK_SECRET: process.env.N8N_CALLBACK_SECRET ? '✓ set' : '✗ missing',
  });
}
