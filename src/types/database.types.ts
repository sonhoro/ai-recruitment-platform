/**
 * database.types.ts
 *
 * Hand-crafted TypeScript types that mirror the PostgreSQL schema defined in
 * supabase/migrations/20260610000001_initial_schema.sql
 *
 * In production you can replace / augment this file with the output of:
 *   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/database.types.ts
 *
 * Naming convention:
 *   - `Row`    → what you SELECT from the table
 *   - `Insert` → payload for INSERT (required fields only)
 *   - `Update` → payload for UPDATE (all fields optional)
 */

// ─────────────────────────────────────────────
// ENUMS  (must match the SQL CREATE TYPE values)
// ─────────────────────────────────────────────

export type JobStatus =
  | 'draft'
  | 'open'
  | 'paused'
  | 'closed'
  | 'archived';

export type CandidateStatus =
  | 'new'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export type InterviewType =
  | 'phone_screen'
  | 'technical'
  | 'behavioral'
  | 'panel'
  | 'final'
  | 'offer';

export type InterviewStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type ScoreStage =
  | 'resume_screening'
  | 'skills_match'
  | 'culture_fit'
  | 'technical_assessment'
  | 'overall';

// ─────────────────────────────────────────────
// TABLE: recruiters
// ─────────────────────────────────────────────

export type RecruiterRole = 'recruiter' | 'interviewer';

export interface RecruiterRow {
  id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  company_name: string | null;
  department: string | null;
  avatar_url: string | null;
  is_active: boolean;
  role: RecruiterRole;
  created_at: string; // ISO 8601 timestamptz
  updated_at: string;
}

export interface RecruiterInsert {
  id?: string;
  auth_user_id?: string | null;
  full_name: string;
  email: string;
  company_name?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RecruiterUpdate {
  auth_user_id?: string | null;
  full_name?: string;
  email?: string;
  company_name?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

// ─────────────────────────────────────────────
// TABLE: jobs
// ─────────────────────────────────────────────

export interface JobRow {
  id: string;
  recruiter_id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  location: string | null;
  remote_policy: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string;
  status: JobStatus;
  department: string | null;
  employment_type: string | null;
  skills_required: string[] | null;
  published_at: string | null;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobInsert {
  id?: string;
  recruiter_id: string;
  title: string;
  description?: string | null;
  requirements?: string | null;
  location?: string | null;
  remote_policy?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  status?: JobStatus;
  department?: string | null;
  employment_type?: string | null;
  skills_required?: string[] | null;
  published_at?: string | null;
  closes_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobUpdate {
  recruiter_id?: string;
  title?: string;
  description?: string | null;
  requirements?: string | null;
  location?: string | null;
  remote_policy?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string;
  status?: JobStatus;
  department?: string | null;
  employment_type?: string | null;
  skills_required?: string[] | null;
  published_at?: string | null;
  closes_at?: string | null;
  updated_at?: string;
}

// ─────────────────────────────────────────────
// TABLE: candidates
// ─────────────────────────────────────────────

export interface CandidateRow {
  id: string;
  job_id: string;
  auth_user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  resume_text: string | null;
  status: CandidateStatus;
  source: string | null;
  applied_at: string;
  notes: string | null;
  /** AI-generated professional summary. Null until first AI evaluation. */
  ai_summary: string | null;
  /** AI-detected seniority level. Null until first AI evaluation. */
  seniority: 'Junior' | 'Semi-Senior' | 'Senior' | null;
  /** AI suggestion for next step. Null until first AI evaluation. */
  ai_recommendation: 'advance' | 'interview' | 'test' | 'hold' | 'discard' | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateInsert {
  id?: string;
  job_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  resume_url?: string | null;
  resume_text?: string | null;
  status?: CandidateStatus;
  source?: string | null;
  applied_at?: string;
  notes?: string | null;
  /** Populated by the AI pipeline after CV analysis. */
  ai_summary?: string | null;
  /** Populated by the AI pipeline after CV analysis. */
  seniority?: 'Junior' | 'Semi-Senior' | 'Senior' | null;
  /** Set by the AI pipeline for Human-in-the-loop. */
  ai_recommendation?: 'advance' | 'interview' | 'test' | 'hold' | 'discard' | null;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateUpdate {
  job_id?: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  location?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  resume_url?: string | null;
  resume_text?: string | null;
  status?: CandidateStatus;
  source?: string | null;
  applied_at?: string;
  notes?: string | null;
  /** Set by the AI pipeline callback — do not update manually. */
  ai_summary?: string | null;
  /** Set by the AI pipeline callback — do not update manually. */
  seniority?: 'Junior' | 'Semi-Senior' | 'Senior' | null;
  /** Set by the AI pipeline for Human-in-the-loop. */
  ai_recommendation?: 'advance' | 'interview' | 'test' | 'hold' | 'discard' | null;
  updated_at?: string;
}

// ─────────────────────────────────────────────
// TABLE: scores  (AI evaluations + observability)
// ─────────────────────────────────────────────

/** Raw LLM response stored in scores.json_result */
export interface LLMJsonResult {
  raw_response?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  choices?: Array<{
    message?: { role: string; content: string };
    finish_reason?: string;
  }>;
  [key: string]: unknown; // allow arbitrary extra fields from the provider
}

export interface ScoreRow {
  id: string;
  candidate_id: string;
  job_id: string;
  stage: ScoreStage;
  score: number;                    // 0.00 – 100.00
  recommendation: string | null;    // 'advance' | 'reject' | 'hold'
  reasoning: string | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  // ── Observability ──
  model_version: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;             // computed column (read-only)
  latency_ms: number;
  json_result: LLMJsonResult | null;
  prompt_template_id: string | null;
  error_message: string | null;
  // ── Timestamps ──
  evaluated_at: string;
  created_at: string;
}

export interface ScoreInsert {
  id?: string;
  candidate_id: string;
  job_id: string;
  stage?: ScoreStage;
  score: number;
  recommendation?: string | null;
  reasoning?: string | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  model_version: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  // total_tokens is a generated column — do NOT include in Insert
  latency_ms?: number;
  json_result?: LLMJsonResult | null;
  prompt_template_id?: string | null;
  error_message?: string | null;
  evaluated_at?: string;
  created_at?: string;
}

export interface ScoreUpdate {
  stage?: ScoreStage;
  score?: number;
  recommendation?: string | null;
  reasoning?: string | null;
  strengths?: string[] | null;
  weaknesses?: string[] | null;
  model_version?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  latency_ms?: number;
  json_result?: LLMJsonResult | null;
  prompt_template_id?: string | null;
  error_message?: string | null;
  evaluated_at?: string;
}

// ─────────────────────────────────────────────
// TABLE: interviews
// ─────────────────────────────────────────────

export interface InterviewRow {
  id: string;
  candidate_id: string;
  job_id: string;
  recruiter_id: string;
  interview_type: InterviewType;
  status: InterviewStatus;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  meeting_url: string | null;
  meeting_platform: string | null;
  location_address: string | null;
  interviewer_ids: string[] | null;
  feedback: string | null;
  rating: number | null;            // 1 – 5
  outcome: string | null;           // 'pass' | 'fail' | 'pending'
  feedback_submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewInsert {
  id?: string;
  candidate_id: string;
  job_id: string;
  recruiter_id: string;
  interview_type?: InterviewType;
  status?: InterviewStatus;
  scheduled_at: string;
  duration_minutes?: number;
  timezone?: string;
  meeting_url?: string | null;
  meeting_platform?: string | null;
  location_address?: string | null;
  interviewer_ids?: string[] | null;
  feedback?: string | null;
  rating?: number | null;
  outcome?: string | null;
  feedback_submitted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InterviewUpdate {
  interview_type?: InterviewType;
  status?: InterviewStatus;
  scheduled_at?: string;
  duration_minutes?: number;
  timezone?: string;
  meeting_url?: string | null;
  meeting_platform?: string | null;
  location_address?: string | null;
  interviewer_ids?: string[] | null;
  feedback?: string | null;
  rating?: number | null;
  outcome?: string | null;
  feedback_submitted_at?: string | null;
  updated_at?: string;
}

// ─────────────────────────────────────────────
// DATABASE TYPE MAP  (Supabase client generic)
// ─────────────────────────────────────────────
// Usage: createClient<Database>(url, key)

export interface Database {
  public: {
    Tables: {
      recruiters: {
        Row: RecruiterRow;
        Insert: RecruiterInsert;
        Update: RecruiterUpdate;
      };
      jobs: {
        Row: JobRow;
        Insert: JobInsert;
        Update: JobUpdate;
      };
      candidates: {
        Row: CandidateRow;
        Insert: CandidateInsert;
        Update: CandidateUpdate;
      };
      scores: {
        Row: ScoreRow;
        Insert: ScoreInsert;
        Update: ScoreUpdate;
      };
      interviews: {
        Row: InterviewRow;
        Insert: InterviewInsert;
        Update: InterviewUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Enums: {
      job_status: JobStatus;
      candidate_status: CandidateStatus;
      interview_type: InterviewType;
      interview_status: InterviewStatus;
      score_stage: ScoreStage;
    };
  };
}

// ─────────────────────────────────────────────
// CONVENIENCE RE-EXPORTS  (shorthand aliases)
// ─────────────────────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
