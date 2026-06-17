// Optional cloud sync via a "sync code" — a passphrase that identifies an
// account record on the backend. Local-first: the app works fully offline and
// only talks to the server when the user opts into sync. The code itself is
// the credential, so it's generated with enough entropy to be unguessable.
//
// All network calls no-op when the backend isn't configured (config.js empty),
// mirroring the reminder backend.

import { WORKER_URL, googleAuthConfigured } from '../config'
import { todayISO } from './dateUtils'

// localStorage keys that make up a syncable snapshot. Device-specific keys
// (clientId, reminder push subscription/location) are deliberately excluded.
export const SYNC_KEYS = [
  'tilawah:onboarded',
  'tilawah:userName',
  'tilawah:userGoal',
  'tilawah:customGoalPages',
  'tilawah:streak',
  'tilawah:lastCompletedDate',
  'tilawah:totalPagesRead',
  'tilawah:lastPage',
  'tilawah:completedToday',
  'tilawah:todayProgress',
  'tilawah:progressDate',
  'tilawah:settings',
]

const CODE_KEY = 'tilawah:syncCode'
const GTOKEN_KEY = 'tilawah:gToken'
const GPROFILE_KEY = 'tilawah:gProfile'
// Unambiguous alphabet (no 0/O/1/I) for readable codes like ABCD-EFGH-JKLM.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const syncConfigured = () => Boolean(WORKER_URL)
export const googleConfigured = () => googleAuthConfigured()

export function generateSyncCode() {
  const bytes = new Uint8Array(12)
  ;(globalThis.crypto || crypto).getRandomValues(bytes)
  let s = ''
  for (let i = 0; i < bytes.length; i++) {
    if (i > 0 && i % 4 === 0) s += '-'
    s += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return s // e.g. ABCD-EFGH-JKLM
}

export function normalizeCode(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

// --- snapshot read/write (touch localStorage) ------------------------------
export function exportSnapshot() {
  const snap = { _updatedAt: Date.now() }
  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      try {
        snap[key] = JSON.parse(raw)
      } catch {
        snap[key] = raw
      }
    }
  }
  return snap
}

export function applySnapshot(snap) {
  if (!snap) return
  for (const key of SYNC_KEYS) {
    if (key in snap) {
      try {
        localStorage.setItem(key, JSON.stringify(snap[key]))
      } catch {
        /* ignore */
      }
    }
  }
}

export function getSyncCode() {
  try {
    return localStorage.getItem(CODE_KEY) || null
  } catch {
    return null
  }
}
export function setSyncCode(code) {
  try {
    localStorage.setItem(CODE_KEY, code)
  } catch {
    /* ignore */
  }
}
export function clearSyncCode() {
  try {
    localStorage.removeItem(CODE_KEY)
  } catch {
    /* ignore */
  }
}

// --- Google session --------------------------------------------------------
export function getGoogleToken() {
  try {
    return localStorage.getItem(GTOKEN_KEY) || null
  } catch {
    return null
  }
}
export function getGoogleProfile() {
  try {
    const raw = localStorage.getItem(GPROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
export function setGoogleSession(token, profile) {
  try {
    localStorage.setItem(GTOKEN_KEY, token)
    localStorage.setItem(GPROFILE_KEY, JSON.stringify(profile || {}))
  } catch {
    /* ignore */
  }
}
export function clearGoogleSession() {
  try {
    localStorage.removeItem(GTOKEN_KEY)
    localStorage.removeItem(GPROFILE_KEY)
  } catch {
    /* ignore */
  }
}
export const isGoogleSignedIn = () => Boolean(getGoogleToken())

// The active credential for sync: a Google session takes precedence over a
// sync code when both are present.
function activeCredential() {
  const token = getGoogleToken()
  if (token) return { token }
  const code = getSyncCode()
  if (code) return { code: normalizeCode(code) }
  return null
}

// --- merge (pure) ----------------------------------------------------------
// Combine two snapshots without losing progress. Counters take the max,
// streak/dates follow the most recent completion, and preferences follow the
// snapshot edited most recently. Safe to call with a missing/empty side.
export function mergeSnapshots(a = {}, b = {}) {
  const out = {}
  const aT = a._updatedAt || 0
  const bT = b._updatedAt || 0
  const newer = bT >= aT ? b : a // for "latest edit wins" fields

  const num = (k) => Math.max(Number(a[k] || 0), Number(b[k] || 0))
  const laterDate = (x, y) => {
    if (!x) return y || null
    if (!y) return x || null
    return x >= y ? x : y
  }

  // lifetime counters: keep the furthest progress
  out['tilawah:totalPagesRead'] = num('tilawah:totalPagesRead')
  out['tilawah:lastPage'] = Math.max(
    1,
    Math.min(604, num('tilawah:lastPage') || 1)
  )

  // streak follows whichever side completed most recently
  const aLast = a['tilawah:lastCompletedDate'] || null
  const bLast = b['tilawah:lastCompletedDate'] || null
  out['tilawah:lastCompletedDate'] = laterDate(aLast, bLast)
  if (aLast === bLast) {
    out['tilawah:streak'] = num('tilawah:streak')
  } else {
    out['tilawah:streak'] = (out['tilawah:lastCompletedDate'] === aLast ? a : b)[
      'tilawah:streak'
    ] || 0
  }

  // today's counters: combine only if both refer to the same (today's) day
  const today = todayISO()
  const aDay = a['tilawah:progressDate']
  const bDay = b['tilawah:progressDate']
  if (aDay === bDay) {
    out['tilawah:progressDate'] = aDay
    out['tilawah:todayProgress'] = num('tilawah:todayProgress')
    out['tilawah:completedToday'] =
      Boolean(a['tilawah:completedToday']) || Boolean(b['tilawah:completedToday'])
  } else {
    const recent = laterDate(aDay, bDay)
    const side = recent === aDay ? a : b
    out['tilawah:progressDate'] = recent
    out['tilawah:todayProgress'] = recent === today ? side['tilawah:todayProgress'] || 0 : 0
    out['tilawah:completedToday'] = recent === today ? Boolean(side['tilawah:completedToday']) : false
  }

  // preferences: latest edit wins; onboarding is sticky once true
  out['tilawah:userGoal'] = newer['tilawah:userGoal'] ?? a['tilawah:userGoal'] ?? b['tilawah:userGoal']
  out['tilawah:customGoalPages'] =
    newer['tilawah:customGoalPages'] ??
    a['tilawah:customGoalPages'] ??
    b['tilawah:customGoalPages']
  out['tilawah:settings'] = newer['tilawah:settings'] ?? a['tilawah:settings'] ?? b['tilawah:settings']
  out['tilawah:onboarded'] =
    Boolean(a['tilawah:onboarded']) || Boolean(b['tilawah:onboarded'])

  // name: prefer a non-empty value, newer wins on a tie
  const aName = a['tilawah:userName'] || ''
  const bName = b['tilawah:userName'] || ''
  out['tilawah:userName'] = aName && bName ? newer['tilawah:userName'] : aName || bName

  out._updatedAt = Math.max(aT, bT)
  return out
}

// --- network ---------------------------------------------------------------
async function call(path, body) {
  const res = await fetch(`${WORKER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`sync ${path} failed (${res.status})`)
  return res.json().catch(() => ({}))
}

export async function pullSnapshot(code) {
  if (!syncConfigured()) return null
  const r = await call('/sync/pull', { code: normalizeCode(code) })
  return r && r.data ? r.data : null
}

export async function pushSnapshot(code, snapshot) {
  if (!syncConfigured()) return
  await call('/sync/push', { code: normalizeCode(code), data: snapshot })
}

// Credential-agnostic pull/push (accepts { token } or { code }).
async function pullWith(cred) {
  if (!syncConfigured() || !cred) return null
  const r = await call('/sync/pull', cred)
  return r && r.data ? r.data : null
}
async function pushWith(cred, snapshot) {
  if (!syncConfigured() || !cred) return
  await call('/sync/push', { ...cred, data: snapshot })
}

// --- Google sign-in --------------------------------------------------------
// Exchange a Google ID token for a durable session, then merge + sync. Called
// with the credential string from Google Identity Services.
export async function googleSignIn(idToken) {
  if (!syncConfigured()) throw new Error('Sync service isn’t set up yet.')
  const r = await call('/auth/google', { idToken })
  if (!r || !r.token) throw new Error('Sign-in failed. Please try again.')
  setGoogleSession(r.token, r.profile)
  const merged = mergeSnapshots(exportSnapshot(), r.data || {})
  applySnapshot(merged)
  await pushWith({ token: r.token }, merged)
  return r.profile
}

export async function googleSignOut() {
  const token = getGoogleToken()
  if (token) {
    try {
      await call('/auth/signout', { token })
    } catch {
      /* best effort */
    }
  }
  clearGoogleSession()
}

// Create a brand-new account: generate a code, push the current local data.
export async function createAccount() {
  const code = generateSyncCode()
  await pushSnapshot(code, exportSnapshot())
  setSyncCode(code)
  return code
}

// Link this device to an existing code: pull remote, merge with local, apply,
// push the merged result back, and remember the code.
export async function linkAccount(code) {
  const clean = normalizeCode(code)
  if (clean.length < 8) throw new Error('That code looks too short.')
  const remote = await pullSnapshot(clean)
  if (remote === null) throw new Error("We couldn't find that sync code.")
  const merged = mergeSnapshots(exportSnapshot(), remote)
  applySnapshot(merged)
  await pushSnapshot(clean, merged)
  setSyncCode(clean)
  return merged
}

// Pull + merge + apply + push for the currently linked code. Quietly does
// nothing when not linked or not configured.
let pushTimer = null
export async function syncNow() {
  const cred = activeCredential()
  if (!cred || !syncConfigured()) return null
  const remote = await pullWith(cred)
  const merged = mergeSnapshots(exportSnapshot(), remote || {})
  applySnapshot(merged)
  await pushWith(cred, merged)
  return merged
}

// Debounced push of local state after a change (e.g. finishing a page).
export function schedulePush() {
  const cred = activeCredential()
  if (!cred || !syncConfigured()) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushWith(cred, exportSnapshot()).catch(() => {})
  }, 2500)
}
