// "Sign in with Google" — loads Google Identity Services, renders the official
// button, and on success hands the ID token to cloudSync to start syncing.
// Renders nothing until Google auth is configured (client id + backend).

import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID, googleAuthConfigured } from '../config'
import {
  googleSignIn,
  googleSignOut,
  isGoogleSignedIn,
  getGoogleProfile,
} from '../utils/cloudSync'

// Load the GIS script once, shared across mounts.
let gisPromise = null
function loadGis() {
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('script failed'))
    document.head.appendChild(s)
  })
  return gisPromise
}

export default function GoogleSignIn() {
  const btnRef = useRef(null)
  const [signedIn, setSignedIn] = useState(() => isGoogleSignedIn())
  const [profile, setProfile] = useState(() => getGoogleProfile())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!googleAuthConfigured() || signedIn) return
    let cancelled = false
    loadGis()
      .then(() => {
        if (cancelled || !window.google) return
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (resp) => {
            setBusy(true)
            setError('')
            try {
              const p = await googleSignIn(resp.credential)
              setProfile(p)
              setSignedIn(true)
            } catch (e) {
              setError(e.message || 'Sign-in failed.')
            } finally {
              setBusy(false)
            }
          },
        })
        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
          })
        }
      })
      .catch(() => setError('Could not load Google sign-in.'))
    return () => {
      cancelled = true
    }
  }, [signedIn])

  if (!googleAuthConfigured()) return null

  async function signOut() {
    setBusy(true)
    await googleSignOut()
    setSignedIn(false)
    setProfile(null)
    setBusy(false)
  }

  if (signedIn) {
    return (
      <div className="mt-4 rounded-2xl border border-teal/15 p-4">
        <div className="flex items-center gap-3">
          {profile?.picture ? (
            <img
              src={profile.picture}
              alt=""
              className="h-9 w-9 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/10 text-sm font-semibold text-teal">
              {(profile?.name || profile?.email || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 grow">
            <p className="truncate text-sm font-medium text-teal">
              {profile?.name || 'Signed in'}
            </p>
            {profile?.email && (
              <p className="truncate text-xs text-muted">{profile.email}</p>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-teal">
          Syncing across your devices via Google. ✓
        </p>
        <button
          className="mt-3 w-full rounded-2xl border border-teal/15 px-4 py-2 text-sm text-muted disabled:opacity-40"
          disabled={busy}
          onClick={signOut}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <p className="text-xs text-muted">
        Sign in once on each device and your progress stays in sync
        automatically.
      </p>
      <div ref={btnRef} className="mt-3 flex justify-center" />
      {busy && <p className="mt-2 text-center text-xs text-muted">Signing in…</p>}
      {error && (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
