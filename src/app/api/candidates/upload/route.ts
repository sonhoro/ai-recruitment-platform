/**
 * src/app/api/candidates/upload/route.ts
 *
 * POST /api/candidates/upload
 *
 * Responsibilities:
 *   1. Validate request (auth, file type, file size, required fields).
 *   2. Upload the PDF to Supabase Storage bucket 'cv-resumes'.
 *   3. Insert a `candidates` row with status = 'new' (upload recibido).
 *   4. Fire a POST webhook to N8N_WEBHOOK_URL with candidate_id, job_id, cv_url.
 *   5. If n8n responds 2xx → update candidate status to 'screening' (Analizando con IA).
 *   6. Return the final candidate state + webhook metadata.
 *
 * Expected FormData fields:
 *   file        File      (required) — PDF, max 10 MB
 *   job_id      string    (required) — UUID of the target job
 *   full_name   string    (required)
 *   email       string    (required)
 *   phone       string    (optional)
 *   source      string    (optional) — defaults to 'manual_upload'
 *
 * Storage path pattern: {job_id}/{timestamp}_{sanitized_filename}.pdf
 *
 * Required env vars:
 *   SUPABASE_SERVICE_ROLE_KEY   — admin Supabase client
 *   N8N_WEBHOOK_URL             — full URL of the n8n webhook trigger node
 *                                 e.g. https://your-n8n.cloud/webhook/cv-analysis
 *
 * ⚠️  The 'cv-resumes' bucket must exist in Supabase Storage and be set
 *     to PUBLIC (or use signed URLs). Create it from the Supabase Dashboard
 *     → Storage → New bucket → name: cv-resumes → Public: ON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient, createServerClient } from '@/lib/supabase/server';
import { fireN8nWebhook } from '@/lib/n8n-webhook';
import type { CandidateInsert } from '@/types/database.types';
import type { SimulatedParseResult } from '@/types/upload.types';
import type { UserRole } from '@/app/_actions/auth';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const BUCKET_NAME              = 'cv-resumes';
const MAX_SIZE_MB              = 10;
const MAX_SIZE_BYTES           = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES            = ['application/pdf'];
/**
 * Result of the n8n webhook dispatch attempt.
 *   sent    — n8n returned a 2xx response.
 *   failed  — n8n returned a non-2xx OR the request threw (network/timeout).
 *   skipped — N8N_WEBHOOK_URL env var is not configured.
 */
type WebhookStatus = 'sent' | 'failed' | 'skipped';

// ─────────────────────────────────────────────────────────────
// Phase 1: AI Parsing Stub
// buildSimulatedParseResult is kept for the response shape while
// n8n/Claude is not yet integrated end-to-end.
// ─────────────────────────────────────────────────────────────

function buildSimulatedParseResult(): SimulatedParseResult {
  return {
    parsed: false,
    simulated: true,
    ai_note:
      'n8n webhook disparado. El análisis real de Claude se recibirá vía callback.',
    candidate_data: {
      skills: [
        'JavaScript',
        'TypeScript',
        'React',
        'Node.js',
        'PostgreSQL',
      ],
      experience_years: null,
      education: null,
      summary: null,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Sanitize a filename for safe storage path usage. */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/** Return a standardized JSON error response. */
function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ─────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 1. Authenticate the user ─────────────────────────────
  let authEmail: string | undefined;
  let authUserId: string | undefined;

  if (process.env.DEV_BYPASS_AUTH === 'true') {
    const c = await cookies();
    const role = c.get('user_role')?.value as UserRole | undefined;
    const email = c.get('user_email')?.value;
    if (role !== 'candidate' || !email) {
      return errorResponse('No autorizado. Por favor inicia sesión.', 401);
    }
    authEmail = email;
  } else {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse('No autorizado. Por favor inicia sesión.', 401);
    }
    authEmail  = user.email ?? undefined;
    authUserId = user.id;
  }

  // ── 2. Parse FormData ──────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('El cuerpo de la solicitud no es FormData válido.', 400);
  }

  const file      = formData.get('file')    as File   | null;
  const jobId     = formData.get('job_id')  ?.toString().trim();
  const fullName  = formData.get('full_name')?.toString().trim();
  const email     = formData.get('email')   ?.toString().trim().toLowerCase() || authEmail;
  const phone     = formData.get('phone')   ?.toString().trim() || null;
  const source    = formData.get('source')  ?.toString().trim() || 'manual_upload';

  // ── 3. Validate required fields ───────────────────────────
  if (!file)      return errorResponse('El archivo PDF es requerido.',              400);
  if (!email)     return errorResponse('El correo electrónico es requerido.',       400);

  // full_name falls back to email prefix when not provided
  const displayName = fullName || email.split('@')[0] || 'Candidato';

  // ── 4. Validate file ──────────────────────────────────────
  if (!ALLOWED_TYPES.includes(file.type)) {
    return errorResponse(
      `Tipo de archivo no permitido (${file.type}). Solo se aceptan PDFs.`,
      415,
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return errorResponse(
      `El archivo supera el tamaño máximo de ${MAX_SIZE_MB} MB.`,
      413,
    );
  }

  if (file.size === 0) {
    return errorResponse('El archivo está vacío.', 400);
  }

  // ── 5. Build storage path ─────────────────────────────────
  const timestamp    = Date.now();
  const safeName     = sanitizeFilename(file.name);
  const folder       = jobId || 'general';
  const storagePath  = `${folder}/${timestamp}_${safeName}`;

  // ── 6. Upload to Supabase Storage ─────────────────────────
  const adminSupabase = createAdminClient();

  // Ensure the bucket exists (create if missing)
  const { data: buckets } = await adminSupabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

  if (!bucketExists) {
    const { error: createError } = await adminSupabase.storage.createBucket(
      BUCKET_NAME,
      { public: true },
    );
    if (createError) {
      console.error('[upload] Failed to create bucket:', createError);
      return errorResponse(
        `Error al crear el bucket '${BUCKET_NAME}'.`,
        500,
      );
    }
    console.log(`[upload] Bucket '${BUCKET_NAME}' created.`);
  }

  // Convert File to ArrayBuffer for the Supabase Storage SDK
  const arrayBuffer = await file.arrayBuffer();

  const { error: storageError } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, arrayBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (storageError) {
    console.error('[upload] Supabase Storage error:', storageError);
    return errorResponse(
      'Error al subir el archivo. Intenta de nuevo más tarde.',
      500,
    );
  }

  // ── 7. Resolve the public URL ──────────────────────────────
  const { data: urlData } = adminSupabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  const resumeUrl = urlData.publicUrl;

  // ── 8. Save as main CV when uploading without a specific job ──
  if (!jobId) {
    const c = await cookies();
    c.set('main_resume_url', resumeUrl, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
    c.set('main_resume_name', file.name, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });

    // Also persist to user_metadata so applyToJob() can find it
    if (authUserId) {
      await adminSupabase.auth.admin.updateUserById(authUserId, {
        user_metadata: {
          main_resume_url: resumeUrl,
          main_resume_name: file.name,
        },
      });
    }

    // Update existing candidate rows with the new resume URL
    if (authEmail) {
      await adminSupabase
        .from('candidates')
        .update({ resume_url: resumeUrl })
        .eq('email', authEmail)
        .neq('resume_url', resumeUrl);
    }
  }

  // ── 9. Upsert candidate record & dispatch webhook ─────────
  //
  // If a job_id was provided, create a new application (candidate) row
  // and fire the n8n webhook for AI analysis.
  // If no job_id, just upload the file — the candidate can apply later.
  //
  let finalCandidate: Record<string, unknown> | null = null;
  let webhookStatus: WebhookStatus = 'skipped';
  const parsing = buildSimulatedParseResult();

  if (jobId) {
    // Check if the candidate already has an application for this job
    const { data: existing } = await adminSupabase
      .from('candidates')
      .select('id, status')
      .eq('email', email)
      .eq('job_id', jobId)
      .maybeSingle();

    let candidate: Record<string, unknown> | null;

    if (existing) {
      // Update the existing application's CV
      const { data: updated, error: updateError } = await adminSupabase
        .from('candidates')
        .update({ resume_url: resumeUrl, full_name: displayName, phone })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('[upload] DB update error:', updateError);
        await adminSupabase.storage.from(BUCKET_NAME).remove([storagePath]);
        return errorResponse('Error al actualizar el CV.', 500);
      }

      candidate = updated;
    } else {
      // Create a new application
      const candidatePayload: CandidateInsert = {
        job_id: jobId, full_name: displayName, email, phone,
        resume_url: resumeUrl, status: 'new', source,
      };

      const { data: inserted, error: insertError } = await adminSupabase
        .from('candidates')
        .insert(candidatePayload)
        .select()
        .single();

      if (insertError) {
        console.error('[upload] DB insert error:', insertError);
        await adminSupabase.storage.from(BUCKET_NAME).remove([storagePath]);
        return errorResponse('Error al registrar al candidato.', 500);
      }

      candidate = inserted;
    }

    finalCandidate = candidate!;

    // ── 9. Dispatch n8n webhook ─────────────────────────────
    const webhookResult = await fireN8nWebhook({
      candidate_id: candidate!.id as string,
      job_id:       jobId,
      cv_url:       resumeUrl,
    });

    if (webhookResult.ok) {
      webhookStatus = 'sent';

      const { data: promoted } = await adminSupabase
        .from('candidates')
        .update({ status: 'screening' })
        .eq('id', candidate!.id)
        .select()
        .single();

      if (promoted) finalCandidate = promoted;
    } else {
      webhookStatus = process.env.N8N_WEBHOOK_URL ? 'failed' : 'skipped';
    }
  }

  // ── 10. Build and return success payload ──────────────────
  const responseBody: Record<string, unknown> = {
    success:      true,
    resume_url:   resumeUrl,
    storage_path: storagePath,
    parsing,
  };

  if (finalCandidate) {
    responseBody.candidate = finalCandidate;
    responseBody.webhook   = { status: webhookStatus };
  }

  return NextResponse.json(responseBody, { status: 201 });
}
