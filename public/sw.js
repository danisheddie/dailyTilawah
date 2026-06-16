/* Daily Tilawah service worker.
   Responsibilities: make the app installable and receive Web Push reminders.
   Kept deliberately minimal — no offline caching of app data, so the reader
   always fetches fresh Qur'an content. */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// A no-op fetch handler is required for the install criteria on some browsers.
self.addEventListener('fetch', () => {})

// Show a reminder when the backend pushes one.
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }

  const title = data.title || 'Daily Tilawah'
  const body =
    data.body || 'A gentle reminder to read your page for today. 🕌'
  const base = self.registration.scope

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: `${base}icons/icon-192.png`,
      badge: `${base}icons/badge-72.png`,
      tag: data.tag || 'tilawah-reminder',
      renotify: true,
      data: { url: data.url || base },
    })
  )
})

// Focus an existing window or open the app on tap.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) return client.focus()
        }
        if (self.clients.openWindow) return self.clients.openWindow(target)
      })
  )
})
