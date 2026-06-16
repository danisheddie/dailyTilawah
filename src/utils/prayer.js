// Prayer-time calculation, powered by the `adhan` library. Pure client-side:
// given a location + method it derives the five daily prayers on-device, no
// network or API key. The same logic runs in the Cloudflare Worker so the
// reminder scheduler and the app agree on times.

import { Coordinates, CalculationMethod, PrayerTimes, Madhab } from 'adhan'

// Calculation methods we expose, with human labels. Ids map 1:1 to the
// adhan CalculationMethod factory functions.
export const METHODS = [
  { id: 'MuslimWorldLeague', label: 'Muslim World League' },
  { id: 'NorthAmerica', label: 'ISNA (North America)' },
  { id: 'Egyptian', label: 'Egyptian General Authority' },
  { id: 'UmmAlQura', label: 'Umm al-Qura, Makkah' },
  { id: 'Karachi', label: 'Karachi (Univ. of Islamic Sciences)' },
  { id: 'Dubai', label: 'Dubai' },
  { id: 'Qatar', label: 'Qatar' },
  { id: 'Kuwait', label: 'Kuwait' },
  { id: 'Singapore', label: 'Singapore' },
  { id: 'Turkey', label: 'Turkey (Diyanet)' },
  { id: 'Tehran', label: 'Tehran' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
]

// The five obligatory prayers, in order, with display names.
export const PRAYERS = [
  { key: 'fajr', name: 'Fajr' },
  { key: 'dhuhr', name: 'Dhuhr' },
  { key: 'asr', name: 'Asr' },
  { key: 'maghrib', name: 'Maghrib' },
  { key: 'isha', name: 'Isha' },
]

function buildParams(methodId, madhab) {
  const factory = CalculationMethod[methodId] || CalculationMethod.MuslimWorldLeague
  const params = factory()
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi
  return params
}

// Compute the day's prayer instants (Date objects, absolute UTC) for a
// location. `date` selects which calendar day.
export function computePrayerTimes({
  latitude,
  longitude,
  method = 'MuslimWorldLeague',
  madhab = 'shafi',
  date = new Date(),
}) {
  const coords = new Coordinates(latitude, longitude)
  const pt = new PrayerTimes(coords, date, buildParams(method, madhab))
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  }
}

// The next obligatory prayer from `now`. Rolls over to tomorrow's Fajr once
// Isha has passed.
export function nextPrayer(opts) {
  const now = opts.date || new Date()
  const times = computePrayerTimes({ ...opts, date: now })
  for (const p of PRAYERS) {
    if (times[p.key] > now) return { key: p.key, name: p.name, time: times[p.key] }
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const t = computePrayerTimes({ ...opts, date: tomorrow })
  return { key: 'fajr', name: 'Fajr', time: t.fajr, tomorrow: true }
}

// "5:49 AM" in the given IANA timezone (defaults to the device zone).
export function formatTime(date, timeZone) {
  if (!date) return ''
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...(timeZone ? { timeZone } : {}),
  })
}
