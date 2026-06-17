// Prayer-time reminders settings: enable push, pick a calculation method and
// Asr madhab, grant location, and preview today's times. Delivery is handled
// by the backend; this screen manages the user's preferences + subscription.

import { useState } from 'react'
import { getReminders, setReminders } from '../utils/storage'
import { METHODS, PRAYERS, computePrayerTimes, formatTime } from '../utils/prayer'
import {
  pushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription,
} from '../utils/push'
import { syncSubscription, disableOnServer } from '../utils/sync'
import { remindersConfigured } from '../config'
import { useLang } from '../utils/i18n.jsx'

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('no-geo'))
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: Number(pos.coords.latitude.toFixed(4)),
          longitude: Number(pos.coords.longitude.toFixed(4)),
        }),
      reject,
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
    )
  })
}

function messageFor(err, t) {
  if (err?.message === 'unsupported') return t('reminders.errUnsupported')
  if (err?.message === 'denied') return t('reminders.errDenied')
  if (err?.message === 'no-geo' || err?.code === 1)
    return t('reminders.errLocationNeeded')
  if (err?.code === 2 || err?.code === 3) return t('reminders.errLocationFail')
  return t('reminders.errGeneric')
}

export default function Reminders() {
  const { t } = useLang()
  const [r, setR] = useState(() => getReminders())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const supported = pushSupported()
  const configured = remindersConfigured()
  const times = r.location
    ? computePrayerTimes({ ...r.location, method: r.method, madhab: r.madhab })
    : null

  function persist(partial) {
    const next = setReminders(partial)
    setR(next)
    return next
  }

  // Re-push current prefs to the backend (used after a method/location change
  // while reminders are already on).
  async function resync() {
    if (!r.enabled || !configured) return
    const sub = await getExistingSubscription()
    if (sub) await syncSubscription(sub)
  }

  async function enable() {
    setError('')
    setBusy(true)
    try {
      const location = r.location || (await getPosition())
      const subscription = await subscribeToPush()
      persist({ enabled: true, location })
      await syncSubscription(subscription)
    } catch (e) {
      setError(messageFor(e, t))
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    try {
      persist({ enabled: false })
      await disableOnServer()
      await unsubscribeFromPush()
    } finally {
      setBusy(false)
    }
  }

  async function useMyLocation() {
    setError('')
    setBusy(true)
    try {
      const location = await getPosition()
      persist({ location })
      await resync()
    } catch (e) {
      setError(messageFor(e, t))
    } finally {
      setBusy(false)
    }
  }

  async function changeMethod(method) {
    persist({ method })
    setBusy(true)
    try {
      await resync()
    } finally {
      setBusy(false)
    }
  }

  async function changeMadhab(madhab) {
    persist({ madhab })
    setBusy(true)
    try {
      await resync()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
        {t('reminders.title')}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {t('reminders.sub')}
      </p>

      {/* Enable toggle */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-teal">
          {r.enabled ? t('reminders.on') : t('reminders.turnOn')}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={r.enabled}
          disabled={busy || (!r.enabled && !configured)}
          onClick={() => (r.enabled ? disable() : enable())}
          className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
            r.enabled ? 'bg-teal' : 'bg-muted/30'
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${
              r.enabled ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Status notes */}
      {!configured && (
        <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs text-muted">
          {t('reminders.notConnected')}
        </p>
      )}
      {configured && !supported && (
        <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs text-muted">
          {t('reminders.needInstalled')}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Location */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-sm">
          <p className="font-medium text-teal">{t('reminders.location')}</p>
          <p className="text-xs text-muted">
            {r.location
              ? `${r.location.latitude}, ${r.location.longitude}`
              : t('reminders.notSet')}
          </p>
        </div>
        <button className="btn-ghost px-4 py-2 text-sm" disabled={busy} onClick={useMyLocation}>
          {r.location ? t('reminders.update') : t('reminders.useLocation')}
        </button>
      </div>

      {/* Calculation method */}
      <label className="mt-5 block">
        <span className="text-sm font-medium text-teal">{t('reminders.method')}</span>
        <select
          value={r.method}
          onChange={(e) => changeMethod(e.target.value)}
          disabled={busy}
          className="mt-2 w-full rounded-2xl border border-teal/15 bg-transparent px-4 py-3 text-sm text-teal outline-none focus:border-teal"
        >
          {METHODS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      {/* Asr madhab */}
      <div className="mt-5">
        <span className="text-sm font-medium text-teal">{t('reminders.asr')}</span>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {[
            { id: 'shafi', label: t('reminders.standard') },
            { id: 'hanafi', label: t('reminders.hanafi') },
          ].map((opt) => (
            <button
              key={opt.id}
              disabled={busy}
              onClick={() => changeMadhab(opt.id)}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                r.madhab === opt.id
                  ? 'border-teal bg-teal text-paper'
                  : 'border-teal/15 text-teal active:scale-[0.99]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Today's times */}
      {times && (
        <div className="mt-6 rounded-2xl bg-teal/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t('reminders.todaysTimes')}
          </p>
          <ul className="divide-y divide-teal/5">
            {PRAYERS.map((p) => (
              <li key={p.key} className="flex justify-between py-1.5 text-sm">
                <span className="text-teal">{p.name}</span>
                <span className="font-medium text-teal">
                  {formatTime(times[p.key])}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
