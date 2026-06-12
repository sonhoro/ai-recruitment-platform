/**
 * src/lib/notifications.ts
 *
 * Stage-change notification dispatcher.
 *
 * Sends a structured webhook event to N8N_NOTIFICATIONS_WEBHOOK_URL
 * whenever a recruiter manually updates a candidate's pipeline stage.
 *
 * The n8n workflow on the receiving end will:
 *   • Read the new_status to select the right email template.
 *   • Send a personalised email to the candidate via Gmail/SendGrid.
 *   • If new_status === 'interview': create a Google Calendar invite and
 *     attach the meeting link to the confirmation email.
 *   • If new_status === 'rejected': send a polite decline email.
 *
 * ─── Design rules ────────────────────────────────────────────────────────────
 *   • This function NEVER throws. All errors are captured and returned
 *     as { dispatched: false, reason }.
 *   • The status update in Supabase is always the primary operation.
 *     Notification failure is non-fatal — the candidate's stage IS updated.
 *   • Timeout: 12 seconds (n8n acknowledgement, not full workflow execution).
 *   • Retries: none here — handled by n8n's built-in retry on the workflow side.
 */

import type { CandidateStatus } from '@/types/database.types';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const NOTIFICATION_TIMEOUT_MS = 12_000; // 12 seconds

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full context payload sent to n8n for stage-change notifications.
 * Includes all data n8n needs to personalise the email and/or
 * create the calendar event — no extra DB queries required on the n8n side.
 */
export interface StageChangeNotificationPayload {
  /** UUID of the candidate whose stage changed. */
  candidate_id:     string;
  /** Full name — used in the email greeting. */
  candidate_name:   string;
  /** Email address — primary recipient of the automated message. */
  candidate_email:  string;
  /** Stage BEFORE the recruiter's action. */
  previous_status:  CandidateStatus;
  /** Stage AFTER the recruiter's action — drives template selection in n8n. */
  new_status:       CandidateStatus;
  /** UUID of the job the candidate applied for. */
  job_id:           string;
  /** Job title — used in the email subject and body. */
  job_title:        string;
  /** ISO 8601 timestamp of when the change happened. */
  changed_at:       string;
}

/**
 * Result of the notification dispatch attempt.
 *   dispatched: true  → n8n returned HTTP 2xx.
 *   dispatched: false → n8n was unreachable, returned an error, timed out,
 *                       or the env var is missing.
 */
export type NotificationResult =
  | { dispatched: true }
  | { dispatched: false; reason: string };

// ─────────────────────────────────────────────────────────────────────────────
// dispatchStageChangeNotification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends the stage-change event to the n8n notifications webhook.
 *
 * @param payload  Full context about the stage change.
 * @returns        `{ dispatched: true }` on HTTP 2xx,
 *                 `{ dispatched: false, reason }` on any failure.
 *
 * @example
 * const result = await dispatchStageChangeNotification({
 *   candidate_id:    'uuid',
 *   candidate_name:  'Andrea Martínez',
 *   candidate_email: 'andrea@email.com',
 *   previous_status: 'screening',
 *   new_status:      'interview',
 *   job_id:          'uuid',
 *   job_title:       'Senior Frontend Engineer',
 *   changed_at:      new Date().toISOString(),
 * });
 *
 * if (!result.dispatched) {
 *   console.warn('Notification skipped:', result.reason);
 * }
 */
export async function dispatchStageChangeNotification(
  payload: StageChangeNotificationPayload,
): Promise<NotificationResult> {
  const webhookUrl = process.env.N8N_NOTIFICATIONS_WEBHOOK_URL;

  // ── Guard: env var not configured ─────────────────────────────────────────
  if (!webhookUrl) {
    console.warn(
      '[notifications] N8N_NOTIFICATIONS_WEBHOOK_URL is not set. ' +
      'Skipping notification dispatch.',
    );
    return {
      dispatched: false,
      reason:     'N8N_NOTIFICATIONS_WEBHOOK_URL is not configured.',
    };
  }

  // ── Abort controller for hard timeout ─────────────────────────────────────
  const controller = new AbortController();
  const timeoutId  = setTimeout(
    () => controller.abort(),
    NOTIFICATION_TIMEOUT_MS,
  );

  try {
    const response = await fetch(webhookUrl, {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        // Forward the callback secret so n8n can verify the request origin
        'X-Webhook-Secret': process.env.N8N_CALLBACK_SECRET ?? '',
      },
      body:   JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Read a small slice of the body for diagnostics without blocking long
      const bodySnippet = await response.text().catch(() => '(unreadable)');
      const reason = `n8n returned HTTP ${response.status}: ${bodySnippet.slice(0, 200)}`;
      console.error('[notifications] Dispatch failed:', reason);
      return { dispatched: false, reason };
    }

    // HTTP 2xx — n8n acknowledged the event
    return { dispatched: true };

  } catch (err) {
    clearTimeout(timeoutId);

    // Distinguish timeout from network errors for better observability
    const isTimeout = err instanceof Error && err.name === 'AbortError';

    const reason = isTimeout
      ? `Notification webhook timed out after ${NOTIFICATION_TIMEOUT_MS / 1000}s`
      : `Network error: ${err instanceof Error ? err.message : String(err)}`;

    console.error('[notifications] Dispatch error:', reason);
    return { dispatched: false, reason };
  }
}
