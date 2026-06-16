// Web Push (RFC 8291, aes128gcm) + VAPID (RFC 8292) using Web Crypto only,
// so it runs natively on Cloudflare Workers. No Node crypto, no deps.

const enc = new TextEncoder()

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  s += '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64url(bytes) {
  let bin = ''
  const b = new Uint8Array(bytes)
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function concat(...arrs) {
  const total = arrs.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const a of arrs) {
    out.set(a, off)
    off += a.length
  }
  return out
}

// --- VAPID JWT (ES256) -----------------------------------------------------
async function vapidAuthHeader(endpoint, { publicKey, privateJwk, subject }) {
  const audience = new URL(endpoint).origin
  const header = bytesToB64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const payload = bytesToB64url(
    enc.encode(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: subject,
      })
    )
  )
  const signingInput = `${header}.${payload}`

  const key = await crypto.subtle.importKey(
    'jwk',
    privateJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    enc.encode(signingInput)
  )
  const jwt = `${signingInput}.${bytesToB64url(new Uint8Array(sig))}`
  return `vapid t=${jwt}, k=${publicKey}`
}

// --- payload encryption ----------------------------------------------------
async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8
  )
  return new Uint8Array(bits)
}

async function encryptPayload(plaintext, p256dh, authSecret) {
  const uaPublic = b64urlToBytes(p256dh) // 65 bytes, client public key
  const auth = b64urlToBytes(authSecret) // 16 bytes

  // Ephemeral (application server) ECDH keypair.
  const asKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  )
  const asPublic = new Uint8Array(
    await crypto.subtle.exportKey('raw', asKeys.publicKey)
  ) // 65 bytes

  const uaPublicKey = await crypto.subtle.importKey(
    'raw',
    uaPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  )
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: uaPublicKey }, asKeys.privateKey, 256)
  )

  // RFC 8291: derive the input keying material.
  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic)
  const ikm = await hkdf(auth, ecdhSecret, keyInfo, 32)

  // RFC 8188 content encryption keys, keyed by a random record salt.
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)

  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, [
    'encrypt',
  ])
  // Single record: append the 0x02 delimiter, no further padding.
  const record = concat(plaintext, new Uint8Array([2]))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, record)
  )

  // aes128gcm header: salt(16) | rs(4) | idlen(1) | keyid(=as_public,65)
  const rs = new Uint8Array(4)
  new DataView(rs.buffer).setUint32(0, 4096)
  const header = concat(salt, rs, new Uint8Array([asPublic.length]), asPublic)
  return concat(header, ciphertext)
}

// Send one push. Returns the upstream Response so the caller can react to
// 404/410 (expired subscription).
export async function sendPush(subscription, payloadObj, vapid) {
  const endpoint = subscription.endpoint
  const body = await encryptPayload(
    enc.encode(JSON.stringify(payloadObj)),
    subscription.keys.p256dh,
    subscription.keys.auth
  )
  const authorization = await vapidAuthHeader(endpoint, vapid)

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(vapid.ttl || 3600),
    },
    body,
  })
}

export const __test = { encryptPayload, vapidAuthHeader }
