import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('jobs')
    .select('id, title, description, requirements, department, location, remote_policy, skills_required, status')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
