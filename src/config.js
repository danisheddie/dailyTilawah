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

export const WORKER_URL = 'https://tilawah-reminders.danisheddie1405.workers.dev'
export const VAPID_PUBLIC_KEY = ''

// GOOGLE_CLIENT_ID — the OAuth 2.0 Web Client ID from Google Cloud Console,
// used for "Sign in with Google". Leave empty to hide the Google option (the
// sync-code flow still works). The same value must be set as GOOGLE_CLIENT_ID
// on the Worker so it can verify the tokens. See worker/DEPLOY.md.
export const GOOGLE_CLIENT_ID = ''

export const remindersConfigured = () =>
  Boolean(WORKER_URL) && Boolean(VAPID_PUBLIC_KEY)

// Google sign-in needs both the backend (to verify tokens) and a client ID.
export const googleAuthConfigured = () =>
  Boolean(WORKER_URL) && Boolean(GOOGLE_CLIENT_ID)
