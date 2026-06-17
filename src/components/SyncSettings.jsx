// "Back up & sync" settings: create or enter a sync code so reading progress
// follows the user across devices and into the native app later. Local-first —
// the app works fully without ever turning this on.

import { useState } from 'react'
import {
  syncConfigured,
  googleConfigured,
  getSyncCode,
  clearSyncCode,
  createAccount,
  linkAccount,
  syncNow,
} from '../utils/cloudSync'
import GoogleSignIn from './GoogleSignIn'

export default function SyncSettings() {
  const [code, setCode] = useState(() => getSyncCode())
  const [entry, setEntry] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const configured = syncConfigured()

  async function create() {
    setError('')
    setNote('')
    setBusy(true)
    try {
      const c = await createAccount()
      setCode(c)
      setNote('Sync code created. Save it somewhere safe.')
    } catch (e) {
      setError(e.message || 'Could not create a sync code.')
    } finally {
      setBusy(false)
    }
  }

  async function link() {
    setError('')
    setNote('')
    setBusy(true)
    try {
      await linkAccount(entry)
      setCode(getSyncCode())
      setEntry('')
      setNote('Restored and synced. Your progress is now backed up.')
    } catch (e) {
      setError(e.message || 'Could not link that code.')
    } finally {
      setBusy(false)
    }
  }

  async function refresh() {
    setError('')
    setNote('')
    setBusy(true)
    try {
      await syncNow()
      setNote('Synced.')
    } catch {
      setError('Sync failed. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  function unlink() {
    clearSyncCode()
    setCode(null)
    setNote('This device is no longer syncing. Your data stays on it.')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setNote('Code copied to clipboard.')
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        Back up &amp; sync
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Optional. Keep your progress backed up and in sync across devices —
        sign in with Google, or use a private sync code. The app works fully
        without this.
      </p>

      {!configured && (
        <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs text-muted">
          Sync isn’t connected yet. It activates once the sync service is set up.
        </p>
      )}

      {/* Preferred: one-tap Google sign-in (shown when configured) */}
      <GoogleSignIn />

      {googleConfigured() && (
        <div className="mt-6 flex items-center gap-3 text-xs text-muted">
          <span className="h-px grow bg-teal/10" />
          or use a sync code
          <span className="h-px grow bg-teal/10" />
        </div>
      )}

      {note && (
        <p className="mt-3 rounded-xl bg-teal/5 px-3 py-2 text-xs text-teal">{note}</p>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      {code ? (
        <div className="mt-4">
          <p className="text-xs text-muted">Your sync code</p>
          <div className="mt-1 flex items-center justify-between gap-3 rounded-2xl border border-teal/15 px-4 py-3">
            <span className="font-mono text-base tracking-wider text-teal">{code}</span>
            <button className="text-xs font-medium text-gold" onClick={copy}>
              Copy
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Enter this code on another device (or in the app) to restore your
            progress. Keep it private — anyone with it can read your data.
          </p>
          <div className="mt-4 flex gap-3">
            <button className="btn-ghost flex-1 px-4 py-2 text-sm" disabled={busy} onClick={refresh}>
              Sync now
            </button>
            <button
              className="flex-1 rounded-2xl border border-teal/15 px-4 py-2 text-sm text-muted"
              disabled={busy}
              onClick={unlink}
            >
              Stop syncing
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <button
            className="w-full rounded-2xl bg-teal px-4 py-3 text-sm font-medium text-paper disabled:opacity-40"
            disabled={busy || !configured}
            onClick={create}
          >
            Create a sync code
          </button>

          <div>
            <label className="text-xs text-muted">Already have a code?</label>
            <div className="mt-1 flex gap-3">
              <input
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="ABCD-EFGH-JKLM"
                disabled={busy || !configured}
                className="min-w-0 flex-1 rounded-2xl border border-teal/15 bg-transparent px-4 py-3 font-mono text-sm uppercase tracking-wider text-teal outline-none focus:border-teal"
              />
              <button
                className="rounded-2xl border border-teal px-4 py-3 text-sm font-medium text-teal disabled:opacity-40"
                disabled={busy || !configured || entry.trim().length < 8}
                onClick={link}
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
