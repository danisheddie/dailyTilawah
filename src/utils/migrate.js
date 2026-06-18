// One-time migration from the old GitHub Pages origin to the custom domain.
// localStorage can't cross origins, so when the app is opened on the old host
// we hand the user's progress snapshot to the new domain via the URL fragment
// (client-side only, never sent to a server), then redirect. On the new domain
// we merge any incoming snapshot into local storage exactly once.

import { exportSnapshot, applySnapshot, mergeSnapshots } from './cloudSync'

const OLD_HOST = 'danisheddie.github.io'
const NEW_ORIGIN = 'https://dailytilawah.app'

// base64 that survives unicode (e.g. an Arabic name).
function encode(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
}
function decode(str) {
  return JSON.parse(decodeURIComponent(escape(atob(str))))
}

// Returns true if a redirect was started (the caller should not boot the app).
export function runMigration() {
  // Old site → carry the local snapshot to the new domain, then go there.
  if (location.hostname === OLD_HOST) {
    try {
      const payload = encode(exportSnapshot())
      location.replace(`${NEW_ORIGIN}/#migrate=${payload}`)
      return true
    } catch {
      location.replace(NEW_ORIGIN)
      return true
    }
  }

  // New site → import an incoming snapshot once, merging with anything already
  // here (so a user who already has progress isn't overwritten).
  const m = location.hash.match(/[#&]migrate=([^&]+)/)
  if (m) {
    try {
      const merged = mergeSnapshots(exportSnapshot(), decode(m[1]))
      applySnapshot(merged)
    } catch {
      /* ignore a malformed payload */
    }
    history.replaceState(null, '', location.pathname + location.search)
  }
  return false
}
