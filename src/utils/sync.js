// Talks to the Cloudflare Worker reminder backend. Every call is a no-op when
// the backend isn't configured yet (config.js empty), so the app works fully
// offline-of-reminders until the worker is deployed.

import { WORKER_URL, remindersConfigured } from '../config'
import { getClientId, getReminders } from './storage'
import { todayISO } from './dateUtils'

function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

async function post(path, body) {
  if (!WORKER_URL) return null
  const res = await fetch(`${WORKER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  })
  if (!res.ok) throw new Error(`sync ${path} failed (${res.status})`)
  return res.json().catch(() => ({}))
}

// Upsert this device on the backend: push subscription + location + method +
// timezone, so the scheduler can compute prayer times and send reminders.
export async function syncSubscription(subscription) {
  const r = getReminders()
  return post('/subscribe', {
    clientId: getClientId(),
    subscription,
    enabled: r.enabled,
    method: r.method,
    madhab: r.madhab,
    location: r.location,
    timeZone: deviceTimeZone(),
  })
}

export async function disableOnServer() {
  return post('/subscribe', {
    clientId: getClientId(),
    enabled: false,
  }).catch(() => {})
}

// Fire-and-forget: tell the backend today's reading is done so reminders for
// the rest of the day are suppressed.
export function reportRead() {
  if (!remindersConfigured() || !getReminders().enabled) return
  post('/read', {
    clientId: getClientId(),
    date: todayISO(),
    timeZone: deviceTimeZone(),
  }).catch(() => {})
}
