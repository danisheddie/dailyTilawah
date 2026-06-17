// Daily Tilawah reminder backend (Cloudflare Worker).
//
// - HTTP API: subscribe / read / unsubscribe (called by the PWA)
// - Cron (every minute): for each subscriber whose local prayer time is now
//   and who hasn't read today, send a Web Push reminder.
//
// Storage: one KV entry per device, key `user:<clientId>`.

import { sendPush } from './push.js'
import { prayerTimesFor, localDateParts, PRAYER_KEYS, PRAYER_NAMES } from './prayer.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

function userKey(clientId) {
  return `user:${clientId}`
}

async function readBody(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

function vapidFrom(env) {
  return {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateJwk: JSON.parse(env.VAPID_PRIVATE_JWK),
    subject: env.VAPID_SUBJECT || 'mailto:admin@example.com',
    ttl: 3600,
  }
}

// --- HTTP ------------------------------------------------------------------
async function handleSubscribe(request, env) {
  const body = await readBody(request)
  if (!body || !body.clientId) return json({ error: 'clientId required' }, 400)

  const key = userKey(body.clientId)
  const existing = JSON.parse((await env.TILAWAH_KV.get(key)) || 'null') || {}

  const record = {
    ...existing,
    clientId: body.clientId,
    enabled: body.enabled !== false,
    updatedAt: Date.now(),
  }
  // Only overwrite fields that were provided (a disable call sends just the flag).
  if (body.subscription) record.subscription = body.subscription
  if (body.location) record.location = body.location
  if (body.method) record.method = body.method
  if (body.madhab) record.madhab = body.madhab
  if (body.timeZone) record.timeZone = body.timeZone

  await env.TILAWAH_KV.put(key, JSON.stringify(record))
  return json({ ok: true })
}

async function handleRead(request, env) {
  const body = await readBody(request)
  if (!body || !body.clientId) return json({ error: 'clientId required' }, 400)
  const key = userKey(body.clientId)
  const record = JSON.parse((await env.TILAWAH_KV.get(key)) || 'null')
  if (!record) return json({ ok: true }) // nothing to suppress
  record.lastReadDate = body.date
  await env.TILAWAH_KV.put(key, JSON.stringify(record))
  return json({ ok: true })
}

async function handleUnsubscribe(request, env) {
  const body = await readBody(request)
  if (!body || !body.clientId) return json({ error: 'clientId required' }, 400)
  await env.TILAWAH_KV.delete(userKey(body.clientId))
  return json({ ok: true })
}

// Send an immediate test reminder to one device, to verify the full path.
async function handleTest(request, env) {
  const body = await readBody(request)
  if (!body || !body.clientId) return json({ error: 'clientId required' }, 400)
  const record = JSON.parse((await env.TILAWAH_KV.get(userKey(body.clientId))) || 'null')
  if (!record || !record.subscription) return json({ error: 'no subscription' }, 404)
  try {
    const res = await sendPush(
      record.subscription,
      {
        title: 'Daily Tilawah',
        body: 'Test reminder — notifications are working. 🕌',
        tag: 'tilawah-test',
        url: '/dailyTilawah/',
      },
      vapidFrom(env)
    )
    return json({ ok: res.ok, status: res.status })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
}

// --- cloud sync (account by sync code OR Google sign-in) --------------------
// An account is one KV doc `{ data, updatedAt }`. It is addressed either by a
// sync code (`acct:<code>`) or by a Google user id (`gacct:<sub>`). Google
// sign-in exchanges an ID token for an opaque session token (`gsess:<token>`
// → sub) that the client then uses for pull/push, so the short-lived ID token
// never has to be re-sent on every sync.
function normalizeCode(code) {
  return String(code || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}
function acctKey(code) {
  return `acct:${normalizeCode(code)}`
}

const SESSION_TTL = 60 * 60 * 24 * 180 // 180 days

function randomToken() {
  const b = new Uint8Array(24)
  crypto.getRandomValues(b)
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// Validate a Google ID token via Google's tokeninfo endpoint (Google checks the
// signature and expiry; we check the audience). Returns the token payload.
async function verifyGoogleIdToken(idToken, env) {
  const res = await fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken)
  )
  if (!res.ok) throw new Error('invalid token')
  const p = await res.json()
  if (!p.sub) throw new Error('no subject')
  if (env.GOOGLE_CLIENT_ID && p.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error('wrong audience')
  }
  return p
}

// Resolve which account a request targets, from a Google session token or a
// sync code. Returns the KV key, or null if the credential is missing/invalid.
async function resolveAcctKey(body, env) {
  if (body && body.token) {
    const sub = await env.TILAWAH_KV.get(`gsess:${body.token}`)
    if (!sub) return null
    // Refresh the session lifetime on use.
    await env.TILAWAH_KV.put(`gsess:${body.token}`, sub, { expirationTtl: SESSION_TTL })
    return `gacct:${sub}`
  }
  if (body && body.code) {
    const code = normalizeCode(body.code)
    if (code.length < 8) return null
    return `acct:${code}`
  }
  return null
}

async function handleAuthGoogle(request, env) {
  const body = await readBody(request)
  if (!body || !body.idToken) return json({ error: 'idToken required' }, 400)
  if (!env.GOOGLE_CLIENT_ID) return json({ error: 'google auth not configured' }, 501)

  let payload
  try {
    payload = await verifyGoogleIdToken(body.idToken, env)
  } catch {
    return json({ error: 'invalid token' }, 401)
  }

  const token = randomToken()
  await env.TILAWAH_KV.put(`gsess:${token}`, payload.sub, { expirationTtl: SESSION_TTL })

  const doc = JSON.parse((await env.TILAWAH_KV.get(`gacct:${payload.sub}`)) || 'null')
  return json({
    token,
    profile: {
      name: payload.name || '',
      email: payload.email || '',
      picture: payload.picture || '',
    },
    data: doc ? doc.data : null,
  })
}

async function handleAuthSignout(request, env) {
  const body = await readBody(request)
  if (body && body.token) await env.TILAWAH_KV.delete(`gsess:${body.token}`)
  return json({ ok: true })
}

async function handleSyncPull(request, env) {
  const body = await readBody(request)
  const key = await resolveAcctKey(body, env)
  if (!key) return json({ error: 'invalid credential' }, 400)
  const doc = JSON.parse((await env.TILAWAH_KV.get(key)) || 'null')
  if (!doc) return json({ error: 'not found' }, 404)
  return json({ data: doc.data, updatedAt: doc.updatedAt })
}

async function handleSyncPush(request, env) {
  const body = await readBody(request)
  const key = await resolveAcctKey(body, env)
  if (!key) return json({ error: 'invalid credential' }, 400)
  if (!body.data || typeof body.data !== 'object') return json({ error: 'no data' }, 400)
  await env.TILAWAH_KV.put(
    key,
    JSON.stringify({ data: body.data, updatedAt: Date.now() })
  )
  return json({ ok: true })
}

// --- scheduler -------------------------------------------------------------
async function runReminders(env, now = new Date()) {
  const vapid = vapidFrom(env)
  const list = await env.TILAWAH_KV.list({ prefix: 'user:' })

  for (const { name } of list.keys) {
    const record = JSON.parse((await env.TILAWAH_KV.get(name)) || 'null')
    if (!record || !record.enabled || !record.subscription || !record.location) continue
    const tz = record.timeZone || 'UTC'

    const { iso: todayLocal } = localDateParts(now, tz)
    if (record.lastReadDate === todayLocal) continue // already read today

    let times
    try {
      times = prayerTimesFor({
        latitude: record.location.latitude,
        longitude: record.location.longitude,
        method: record.method || 'MuslimWorldLeague',
        madhab: record.madhab || 'shafi',
        timeZone: tz,
        now,
      })
    } catch {
      continue
    }

    // Reset the per-day notified set when the local day changes.
    if (!record.notified || record.notified.date !== todayLocal) {
      record.notified = { date: todayLocal, prayers: [] }
    }

    let due = null
    for (const key of PRAYER_KEYS) {
      const t = times[key]
      if (!t) continue
      const delta = now.getTime() - t.getTime()
      // Fire within the minute the prayer begins (cron granularity ~1 min).
      if (delta >= 0 && delta < 90 * 1000 && !record.notified.prayers.includes(key)) {
        due = key
        break
      }
    }

    if (!due) continue

    const payload = {
      title: `${PRAYER_NAMES[due]} — time to read`,
      body: "You haven't read your page today. One page is enough. 🕌",
      tag: `tilawah-${todayLocal}-${due}`,
      url: '/dailyTilawah/',
    }

    try {
      const res = await sendPush(record.subscription, payload, vapid)
      if (res.status === 404 || res.status === 410) {
        await env.TILAWAH_KV.delete(name) // subscription gone
        continue
      }
      record.notified.prayers.push(due)
      await env.TILAWAH_KV.put(name, JSON.stringify(record))
    } catch {
      // transient; try again next minute
    }
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true })
    if (request.method === 'POST' && url.pathname === '/subscribe')
      return handleSubscribe(request, env)
    if (request.method === 'POST' && url.pathname === '/read') return handleRead(request, env)
    if (request.method === 'POST' && url.pathname === '/unsubscribe')
      return handleUnsubscribe(request, env)
    if (request.method === 'POST' && url.pathname === '/test') return handleTest(request, env)
    if (request.method === 'POST' && url.pathname === '/auth/google')
      return handleAuthGoogle(request, env)
    if (request.method === 'POST' && url.pathname === '/auth/signout')
      return handleAuthSignout(request, env)
    if (request.method === 'POST' && url.pathname === '/sync/pull')
      return handleSyncPull(request, env)
    if (request.method === 'POST' && url.pathname === '/sync/push')
      return handleSyncPush(request, env)

    return json({ error: 'not found' }, 404)
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminders(env, new Date(event.scheduledTime)))
  },
}
