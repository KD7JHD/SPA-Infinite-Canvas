import { CONFIG } from '../config'

export type WebhookRequest = {
  step: number
  answers: any
  previous_form_schema: any
  history: any[]
  metadata?: Record<string, any>
}

export async function postToN8n(body: WebhookRequest) {
  const res = await fetch(CONFIG.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  // Try to parse JSON even on non 2xx to surface error details
  try {
    const json = JSON.parse(text)
    return { ok: res.ok, status: res.status, json }
  } catch {
    return { ok: res.ok, status: res.status, json: { error: text } }
  }
}