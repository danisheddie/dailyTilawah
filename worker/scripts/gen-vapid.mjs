// Generates a VAPID key pair for Web Push. Run: node scripts/gen-vapid.mjs
//
// Prints:
//   VAPID_PUBLIC_KEY  — paste into src/config.js (app) AND set as a Worker var
//   VAPID_PRIVATE_JWK — set as a Worker SECRET (never commit it)
import { webcrypto as crypto } from 'node:crypto'

function bytesToB64url(buf) {
  return Buffer.from(buf).toString('base64url')
}

const keys = await crypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true,
  ['sign', 'verify']
)

const rawPublic = await crypto.subtle.exportKey('raw', keys.publicKey)
const privateJwk = await crypto.subtle.exportKey('jwk', keys.privateKey)

console.log('VAPID_PUBLIC_KEY:')
console.log(bytesToB64url(rawPublic))
console.log()
console.log('VAPID_PRIVATE_JWK (one line):')
console.log(JSON.stringify(privateJwk))
