// Prayer-time calculation for the scheduler — mirrors the app's src/utils
// /prayer.js so the times agree. Uses adhan; pure JS, runs on Workers.

import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan'

export const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
export const PRAYER_NAMES = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
}

function buildParams(methodId, madhab) {
  const factory = CalculationMethod[methodId] || CalculationMethod.MuslimWorldLeague
  const params = factory()
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi
  return params
}

// The calendar Y/M/D in a given IANA timezone for instant `now`.
export function localDateParts(now, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (t) => Number(parts.find((p) => p.type === t).value)
  const y = get('year')
  const m = get('month')
  const d = get('day')
  return { y, m, d, iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
}

// Prayer instants (absolute Date objects) for the user's local day.
export function prayerTimesFor({ latitude, longitude, method, madhab, timeZone, now = new Date() }) {
  const { y, m, d } = localDateParts(now, timeZone)
  // Workers run in UTC, so a noon-UTC date yields the intended Y/M/D when
  // adhan reads the date's components.
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const coords = new Coordinates(latitude, longitude)
  const pt = new PrayerTimes(coords, date, buildParams(method, madhab))
  return { fajr: pt.fajr, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha }
}
