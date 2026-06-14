/**
 * src/app/api/webhook-ats-result/route.ts
 *
 * POST /api/webhook-ats-result
 *
 * Callback endpoint invoked by n8n once the AI pipeline finishes
 * analyzing a candidate's CV.
 *
 * ─── Responsibilities ────────────────────────────────────────────────────────
 *
 *  1. Authenticate the request via a shared secret header.
 *  2. Validate and parse the request body.
 *  3. Map the LLM recommendation → next CandidateStatus.
 *  4. UPDATE candidates — set ai_summary, seniority, status.
 *  5. INSERT scores     — full observability record (tokens, latency, JSONB).
 *  6. Return 200 with a structured success payload.
 *
 * ─── Security ────────────────────────────────────────────────────────────────
 *
 *  Uses a shared secret in the `X-Webhook-Secret` header.
 *  Set N8N_CALLBACK_SECRET in .env.local and in your n8n HTTP Request node
 *  under Headers → { "X-Webhook-Secret": "{{ $env.N8N_CALLBACK_SECRET }}" }.
 *
 * ─── Atomicity note ──────────────────────────────────────────────────────────
 *
 *  The Supabase JS client does not support multi-statement transactions.
 *  The two operations are sequential: INSERT scores first (source of truth),
 *  then UPDATE candidates. If the UPDATE fails, the score record is preserved
 *  and the recruiter can manually fix the candidate status.
 *
 *  For true atomicity in production, replace with a Supabase RPC function:
 *    await adminSupabase.rpc('process_ai_result', payload)
 *
 * ─── Expected body (from n8n Code node) ──────────────────────────────────────
 *
 *  {
 *    "candidate_id":      "uuid",
 *    "job_id":            "uuid",
 *    "json_result": {
 *      "summary":         "...",
 *      "seniority":       "Senior",
 *      "score":           87,
 *      "classification":  ["React", "TypeScript"],
 *      "suggestions":     "ADVANCE: ...",
 *      "riskLevel":       "Low"
 *    },
 *    "model_version":     "claude-3-5-sonnet-20241022",
 *    "prompt_tokens":     3200,
 *    "completion_tokens": 480,
 *    "latency_ms":        1840,
 *    "prompt_template_id": "cv-evaluator-v1.0"   // optional
 *  }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient }         from '@/lib/supabase/server';
import type { ScoreInsert }          from '@/types/database.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** The LLM JSON result object (from n8n Code validator node). */
interface LLMResult {
  summary:        string;
  seniority:      'Junior' | 'Semi-Senior' | 'Senior';
  score:          number;          // integer 0–100
  classification: string[];        // skill tags
  suggestions:    string;          // starts with ADVANCE: | INTERVIEW: | TEST: | HOLD: | DISCARD:
  riskLevel:      'Low' | 'Medium' | 'High';
}

/** Full body expected from the n8n HTTP Request node. */
interface AtsWebhookPayload {
  candidate_id:       string;
  job_id:             string;
  json_result:        LLMResult;
  model_version:      string;
  prompt_tokens:      number;
  completion_tokens:  number;
  latency_ms:         number;
  prompt_template_id?: string;
}

/** CandidateStatus values that are valid outcomes of the AI pipeline. */
type AIPipelineStatus = 'screening' | 'interview' | 'rejected' | 'new';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const VALID_SENIORITIES = ['Junior', 'Semi-Senior', 'Senior'] as const;
const VALID_RISK_LEVELS = ['Low', 'Medium', 'High']           as const;
const VALID_SUGGESTION_PREFIXES = ['ADVANCE:', 'INTERVIEW:', 'TEST:', 'HOLD:', 'DISCARD:'] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Standardized error response factory. */
function errorResponse(message: string, status: number, detail?: string) {
  return NextResponse.json(
    { success: false, error: message, ...(detail ? { detail } : {}) },
    { status },
  );
}

/**
 * Maps LLM suggestion → ai_recommendation value.
 *
 *   ADVANCE   → 'advance'
 *   INTERVIEW → 'interview'
 *   TEST      → 'test'
 *   HOLD      → 'hold'
 *   DISCARD   → 'discard'
 */
function deriveRecommendation(suggestions: string): string {
  const prefix = suggestions.split(':')[0]?.toUpperCase().trim();
  switch (prefix) {
    case 'ADVANCE':   return 'advance';
    case 'INTERVIEW': return 'interview';
    case 'TEST':      return 'test';
    case 'DISCARD':   return 'discard';
    case 'HOLD':
    default:          return 'hold';
  }
}

/**
 * Derives the next CandidateStatus using Human-in-the-loop approach.
 *
 * For ADVANCE / INTERVIEW / TEST → keep at 'screening'
 *   (recruiter must manually advance via the dashboard).
 * For DISCARD                    → 'rejected' (auto-reject obvious mismatches).
 * For HOLD                       → 'screening' (recruiter to review manually).
 */
function deriveStatus(suggestions: string): AIPipelineStatus {
  const prefix = suggestions.split(':')[0]?.toUpperCase().trim();
  return prefix === 'DISCARD' ? 'rejected' : 'screening';
}

/**
 * Extracts a short keyword from the suggestions string for the
 * `recommendation` column (e.g. "ADVANCE: ..." → "advance").
 */
function extractRecommendation(suggestions: string): string {
  return (suggestions.split(':')[0] ?? 'hold').trim().toLowerCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates the full webhook payload.
 * Returns null when valid, or a human-readable error string when invalid.
 */
function validatePayload(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Body must be a JSON object.';
  }

  const b = body as Record<string, unknown>;

  // Top-level required fields
  if (!b.candidate_id || typeof b.candidate_id !== 'string') {
    return 'candidate_id is required and must be a string (UUID).';
  }
  if (!b.job_id || typeof b.job_id !== 'string') {
    return 'job_id is required and must be a string (UUID).';
  }
  if (!b.model_version || typeof b.model_version !== 'string') {
    return 'model_version is required and must be a string.';
  }
  if (typeof b.prompt_tokens !== 'number' || b.prompt_tokens < 0) {
    return 'prompt_tokens must be a non-negative number.';
  }
  if (typeof b.completion_tokens !== 'number' || b.completion_tokens < 0) {
    return 'completion_tokens must be a non-negative number.';
  }
  if (typeof b.latency_ms !== 'number' || b.latency_ms < 0) {
    return 'latency_ms must be a non-negative number.';
  }

  // json_result object
  if (!b.json_result || typeof b.json_result !== 'object' || Array.isArray(b.json_result)) {
    return 'json_result is required and must be a JSON object.';
  }

  const r = b.json_result as Record<string, unknown>;

  if (typeof r.summary !== 'string' || r.summary.trim() === '') {
    return 'json_result.summary must be a non-empty string.';
  }
  if (!VALID_SENIORITIES.includes(r.seniority as never)) {
    return `json_result.seniority must be one of: ${VALID_SENIORITIES.join(', ')}. Got: "${r.seniority}".`;
  }
  if (!Number.isInteger(r.score) || (r.score as number) < 0 || (r.score as number) > 100) {
    return `json_result.score must be an integer between 0 and 100. Got: ${JSON.stringify(r.score)}.`;
  }
  if (!Array.isArray(r.classification) || r.classification.length === 0) {
    return 'json_result.classification must be a non-empty array of strings.';
  }
  if (
    typeof r.suggestions !== 'string' ||
    !VALID_SUGGESTION_PREFIXES.some((p) => (r.suggestions as string).startsWith(p))
  ) {
    return `json_result.suggestions must start with one of: ${VALID_SUGGESTION_PREFIXES.join(', ')}.`;
  }
  if (!VALID_RISK_LEVELS.includes(r.riskLevel as never)) {
    return `json_result.riskLevel must be one of: ${VALID_RISK_LEVELS.join(', ')}. Got: "${r.riskLevel}".`;
  }

  return null; // valid
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {

  // ── 1. Authenticate via shared secret header ──────────────────────────────
  const expectedSecret = process.env.N8N_CALLBACK_SECRET;
  const receivedSecret  = request.headers.get('x-webhook-secret');

  if (!expectedSecret) {
    // Secret not configured → refuse all requests to prevent open endpoints
    console.error('[ats-result] N8N_CALLBACK_SECRET env var is not set.');
    return errorResponse(
      'Webhook endpoint is not configured. Contact the platform administrator.',
      503,
    );
  }

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    console.warn('[ats-result] Unauthorized webhook attempt — invalid or missing secret.');
    return errorResponse('Unauthorized.', 401);
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }

  if (!body) {
    return errorResponse('Request body is empty.', 400);
  }

  // ── 3. Validate payload ───────────────────────────────────────────────────
  const validationError = validatePayload(body);
  if (validationError) {
    return errorResponse('Payload validation failed.', 422, validationError);
  }

  // Safe to cast — validation guarantees shape
  const payload = body as AtsWebhookPayload;
  const {
    candidate_id,
    job_id,
    json_result,
    model_version,
    prompt_tokens,
    completion_tokens,
    latency_ms,
    prompt_template_id = 'cv-evaluator-v1.0',
  } = payload;

  const adminSupabase = createAdminClient();

  // ── 4. INSERT into scores (source of truth for AI evaluation) ─────────────
  //
  // Inserted FIRST so the observability record exists even if the candidate
  // status update below fails.
  //
  const scorePayload: ScoreInsert = {
    candidate_id,
    job_id,
    stage:             'overall',
    score:             json_result.score,
    recommendation:    extractRecommendation(json_result.suggestions),
    reasoning:         json_result.summary,
    strengths:         json_result.classification,
    weaknesses:        [],                    // LLM v1 doesn't emit a separate weaknesses field
    model_version,
    prompt_tokens,
    completion_tokens,
    // total_tokens is a GENERATED ALWAYS column — must NOT be in Insert
    latency_ms,
    json_result: {
      summary:        json_result.summary,
      seniority:      json_result.seniority,
      score:          json_result.score,
      classification: json_result.classification,
      suggestions:    json_result.suggestions,
      riskLevel:      json_result.riskLevel,
    },
    prompt_template_id,
    error_message: null,
  };

  const { data: scoreRecord, error: scoreError } = await adminSupabase
    .from('scores')
    .insert(scorePayload)
    .select('id, score, recommendation, total_tokens')
    .single();

  if (scoreError) {
    console.error('[ats-result] Failed to insert score record:', scoreError);
    return errorResponse(
      'Database error while saving evaluation score.',
      500,
      scoreError.message,
    );
  }

  // ── 5. UPDATE candidates — denormalized AI fields + status transition ──────
  //
  // Columns updated:
  //   ai_summary  — LLM summary (added in migration 0002)
  //   seniority   — AI-detected level (added in migration 0002)
  //   status      — derived from LLM suggestion keyword
  //   updated_at  — touched automatically by the set_updated_at() trigger
  //
  const nextStatus: AIPipelineStatus = deriveStatus(json_result.suggestions);
  const recommendation: string = deriveRecommendation(json_result.suggestions);

  const { data: updatedCandidate, error: candidateError } = await adminSupabase
    .from('candidates')
    .update({
      ai_summary:         json_result.summary,
      seniority:          json_result.seniority,
      status:             nextStatus,
      ai_recommendation:  recommendation,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq('id', candidate_id)
    .select('id, status, ai_summary, seniority, ai_recommendation')
    .single();

  if (candidateError) {
    // Non-fatal: score record is already written.
    // Log the error and return partial success so n8n doesn't retry.
    console.error(
      '[ats-result] Score inserted but candidate update failed:',
      candidateError,
    );

    return NextResponse.json(
      {
        success:         true,
        partial:         true,
        warning:         'Score recorded but candidate status update failed. Manual intervention may be needed.',
        score_id:        scoreRecord.id,
        candidate_id,
        candidate_error: candidateError.message,
      },
      { status: 200 },
    );
  }

  // ── 6. Success ────────────────────────────────────────────────────────────
  console.info(
    `[ats-result] ✓ candidate=${candidate_id} score=${scoreRecord.score} ` +
    `status=${nextStatus} tokens=${scoreRecord.total_tokens} latency=${latency_ms}ms`,
  );

  return NextResponse.json(
    {
      success: true,
      score: {
        id:             scoreRecord.id,
        score:          scoreRecord.score,
        recommendation: scoreRecord.recommendation,
        total_tokens:   scoreRecord.total_tokens,
      },
      candidate: {
        id:                updatedCandidate.id,
        status:            updatedCandidate.status,
        ai_summary:        updatedCandidate.ai_summary,
        seniority:         updatedCandidate.seniority,
        ai_recommendation: updatedCandidate.ai_recommendation,
      },
    },
    { status: 200 },
  );
}
