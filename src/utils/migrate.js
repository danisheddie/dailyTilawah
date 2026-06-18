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
  // Show a brief "we've moved" splash first so anyone opening a shared old
  // link actually sees (and can bookmark/re-share) the new address.
  if (location.hostname === OLD_HOST) {
    let url
    try {
      url = `${NEW_ORIGIN}/#migrate=${encode(exportSnapshot())}`
    } catch {
      url = NEW_ORIGIN
    }
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:Inter,system-ui,sans-serif;color:#1b4f72;background:#faf9f6;padding:24px;text-align:center">
        <div style="font-size:30px" aria-hidden="true">🕌</div>
        <h1 style="font-size:20px;font-weight:600;margin:0">Tilawah has a new home</h1>
        <p style="color:#6b7280;max-width:320px;line-height:1.5;margin:0">
          We've moved to <b>dailytilawah.app</b> — please bookmark and share
          this link. Your progress comes with you.
        </p>
        <a href="${url}" style="margin-top:8px;background:#1b4f72;color:#faf9f6;padding:12px 24px;border-radius:16px;text-decoration:none;font-weight:600">Continue to dailytilawah.app</a>
        <p style="color:#9aa3ad;font-size:12px;margin:4px 0 0">Redirecting automatically…</p>
      </div>`
    // User taps Continue; otherwise auto-redirect as a safety net.
    setTimeout(() => location.replace(url), 8000)
    return true
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
