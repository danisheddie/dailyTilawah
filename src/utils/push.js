// Service-worker registration and Web Push subscription helpers. The actual
// delivery happens from the Cloudflare Worker; here we just register the SW
// and obtain a PushSubscription tied to the VAPID public key.

import { VAPID_PUBLIC_KEY } from '../config'

const SW_URL = `${import.meta.env.BASE_URL}sw.js`

export function pushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  return navigator.serviceWorker.register(SW_URL, {
    scope: import.meta.env.BASE_URL,
  })
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// Ask for notification permission and return a PushSubscription (JSON form).
// Throws Error('unsupported' | 'denied') for the cases worth messaging.
export async function subscribeToPush() {
  if (!pushSupported()) throw new Error('unsupported')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('denied')

  const reg = await registerServiceWorker()
  await navigator.serviceWorker.ready

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }
  return sub.toJSON()
}

export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return null
  const sub = await reg.pushManager.getSubscription()
  return sub ? sub.toJSON() : null
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return
  const sub = await reg.pushManager.getSubscription()
  if (sub) await sub.unsubscribe()
}
