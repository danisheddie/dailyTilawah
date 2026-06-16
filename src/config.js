// Backend configuration for prayer-time reminders.
//
// These are filled in AFTER you deploy the Cloudflare Worker (see
// worker/DEPLOY.md). Until then they stay empty and the app degrades
// gracefully: prayer times still show on-device, but the "remind me" switch
// explains that the reminder service isn't configured yet.
//
// WORKER_URL        — the deployed Worker origin, e.g.
//                     'https://tilawah-reminders.<your-subdomain>.workers.dev'
// VAPID_PUBLIC_KEY  — the base64url VAPID public key printed by the deploy step.

export const WORKER_URL = ''
export const VAPID_PUBLIC_KEY = ''

export const remindersConfigured = () =>
  Boolean(WORKER_URL) && Boolean(VAPID_PUBLIC_KEY)
