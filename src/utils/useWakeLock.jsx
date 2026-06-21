// Keep the screen awake while reading. The Screen Wake Lock API holds the
// display on; the browser auto-releases the lock when the tab is hidden, so we
// re-acquire it when the page becomes visible again. No-op where unsupported.

import { useEffect } from 'react'

export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let sentinel = null
    let cancelled = false

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request('screen')
      } catch {
        /* denied or not allowed (e.g. tab not visible) — ignore */
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible' && !cancelled) acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      sentinel?.release().catch(() => {})
      sentinel = null
    }
  }, [active])
}
