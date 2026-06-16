// Validates the Web Push crypto without a live push service:
//  1. encrypt a payload as the server, decrypt it as the browser (round-trip)
//  2. build a VAPID Authorization header and verify the JWT signature
// Run: node scripts/test-push.mjs
import { __test } from '../src/push.js'

const enc = new TextEncoder()
const dec = new TextDecoder()
const subtle = globalThis.crypto.subtle

const b64url = {
  to: (buf) => Buffer.from(buf).toString('base64url'),
  from: (s) => new Uint8Array(Buffer.from(s, 'base64url')),
}
function concat(...arrs) {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0))
  let o = 0
  for (const a of arrs) {
    out.set(a, o)
    o += a.length
  }
  return out
}
async function hkdf(salt, ikm, info, len) {
  const k = await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(
    await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8)
  )
}

let failures = 0
const assert = (cond, msg) => {
  if (!cond) {
    console.error('  ✗', msg)
    failures++
  } else {
    console.log('  ✓', msg)
  }
}

// --- 1. encryption round-trip ---------------------------------------------
console.log('Push encryption round-trip:')
const ua = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
const uaPublicRaw = new Uint8Array(await subtle.exportKey('raw', ua.publicKey))
const auth = crypto.getRandomValues(new Uint8Array(16))
const p256dh = b64url.to(uaPublicRaw)
const authStr = b64url.to(auth)

const message = enc.encode(JSON.stringify({ title: 'Fajr', body: 'Read your page 🕌' }))
const body = await __test.encryptPayload(message, p256dh, authStr)
assert(body.length > 86, `ciphertext produced (${body.length} bytes)`)

// Parse aes128gcm header and decrypt as the UA.
const salt = body.slice(0, 16)
const idlen = body[20]
assert(idlen === 65, 'keyid length is 65')
const asPublic = body.slice(21, 21 + idlen)
const ciphertext = body.slice(21 + idlen)

const asPublicKey = await subtle.importKey('raw', asPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
const ecdhSecret = new Uint8Array(
  await subtle.deriveBits({ name: 'ECDH', public: asPublicKey }, ua.privateKey, 256)
)
const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublicRaw, asPublic)
const ikm = await hkdf(auth, ecdhSecret, keyInfo, 32)
const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)
const aesKey = await subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['decrypt'])
const plain = new Uint8Array(
  await subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, ciphertext)
)
assert(plain[plain.length - 1] === 2, 'record delimiter 0x02 present')
const decoded = dec.decode(plain.slice(0, -1))
assert(decoded === dec.decode(message), 'decrypted payload matches original')

// --- 2. VAPID JWT ----------------------------------------------------------
console.log('VAPID JWT:')
const vapidKeys = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
const vapidPublicRaw = new Uint8Array(await subtle.exportKey('raw', vapidKeys.publicKey))
const vapidPrivateJwk = await subtle.exportKey('jwk', vapidKeys.privateKey)

const header = await __test.vapidAuthHeader('https://fcm.googleapis.com/fcm/send/abc123', {
  publicKey: b64url.to(vapidPublicRaw),
  privateJwk: vapidPrivateJwk,
  subject: 'mailto:test@example.com',
})
const m = header.match(/^vapid t=([^,]+), k=(.+)$/)
assert(!!m, 'Authorization header shape is "vapid t=…, k=…"')
const [, jwt, k] = m
assert(k === b64url.to(vapidPublicRaw), 'k= matches the VAPID public key')

const [h64, p64, s64] = jwt.split('.')
const payload = JSON.parse(Buffer.from(p64, 'base64url').toString())
assert(payload.aud === 'https://fcm.googleapis.com', 'aud is the endpoint origin')
assert(payload.exp > Math.floor(Date.now() / 1000), 'exp is in the future')

const verifyKey = await subtle.importKey('raw', vapidPublicRaw, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
const ok = await subtle.verify(
  { name: 'ECDSA', hash: 'SHA-256' },
  verifyKey,
  b64url.from(s64),
  enc.encode(`${h64}.${p64}`)
)
assert(ok, 'JWT signature verifies against the VAPID public key')

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
