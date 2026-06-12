/**
 * src/types/upload.types.ts
 *
 * Shared types for the CV upload flow.
 * Used by the API Route (server) and the CVUpload component (client).
 */

import type { CandidateRow } from './database.types';

// ─────────────────────────────────────────────────────────────
// Simulated AI Parsing result
// Mirrors what the real n8n/Claude pipeline will return in Phase 2.
// ─────────────────────────────────────────────────────────────

export interface SimulatedCandidateData {
  /** Skills extracted from the CV (simulated values for now). */
  skills: string[];
  /** Total years of professional experience (null = not parsed yet). */
  experience_years: number | null;
  /** Highest education level found (null = not parsed yet). */
  education: string | null;
  /** 2-3 sentence professional summary (null = not parsed yet). */
  summary: string | null;
}

export interface SimulatedParseResult {
  /** false = real AI has not run yet. */
  parsed: false;
  /** Always true in Phase 1 — signals this is mock data. */
  simulated: true;
  /** Human-readable note shown in the UI. */
  ai_note: string;
  /** Placeholder candidate data. */
  candidate_data: SimulatedCandidateData;
}

// ─────────────────────────────────────────────────────────────
// API response shape — POST /api/candidates/upload
// ─────────────────────────────────────────────────────────────

export interface UploadSuccessResponse {
  success: true;
  /** The newly created candidate row. */
  candidate: CandidateRow;
  /** Full public URL to the stored PDF. */
  resume_url: string;
  /** Bucket-relative path (useful for deletion / signing). */
  storage_path: string;
  /** Simulated AI parsing payload. */
  parsing: SimulatedParseResult;
}

export interface UploadErrorResponse {
  success?: false;
  error: string;
}

export type UploadApiResponse = UploadSuccessResponse | UploadErrorResponse;

// ─────────────────────────────────────────────────────────────
// Component-level upload state machine
// ─────────────────────────────────────────────────────────────

export type UploadState =
  | { status: 'idle' }
  | { status: 'dragging' }
  | { status: 'selected'; file: File }
  | { status: 'uploading'; progress: number }
  | { status: 'success'; result: UploadSuccessResponse }
  | { status: 'error'; message: string };
