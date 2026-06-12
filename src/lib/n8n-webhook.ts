/**
 * Fires a POST request to the n8n webhook URL.
 *
 * Uses AbortController to enforce a hard timeout (10s).
 * Returns a discriminated result so the caller can decide how to proceed
 * without re-throwing.
 *
 * @param payload  The JSON body to send to n8n.
 * @returns        `{ ok: true }` on HTTP 2xx, `{ ok: false, reason }` otherwise.
 */

const N8N_WEBHOOK_TIMEOUT_MS = 10_000;

export interface N8nWebhookPayload {
  candidate_id: string;
  job_id:       string;
  cv_url:       string;
}

export async function fireN8nWebhook(
  payload: N8nWebhookPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[n8n] N8N_WEBHOOK_URL is not set — skipping webhook dispatch.');
    return { ok: false, reason: 'N8N_WEBHOOK_URL not configured' };
  }

  const controller = new AbortController();
  const timeoutId  = setTimeout(
    () => controller.abort(),
    N8N_WEBHOOK_TIMEOUT_MS,
  );

  try {
    const response = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error(`[n8n] Webhook responded ${response.status}:`, body.slice(0, 300));
      return { ok: false, reason: `n8n returned HTTP ${response.status}` };
    }

    return { ok: true };

  } catch (err) {
    clearTimeout(timeoutId);

    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const reason = isTimeout
      ? `Webhook timed out after ${N8N_WEBHOOK_TIMEOUT_MS / 1000}s`
      : `Network error: ${err instanceof Error ? err.message : String(err)}`;

    console.error('[n8n] Webhook dispatch failed:', reason);
    return { ok: false, reason };
  }
}
