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

    return json({ error: 'not found' }, 404)
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminders(env, new Date(event.scheduledTime)))
  },
}
