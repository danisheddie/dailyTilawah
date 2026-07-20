// Date helpers: local ISO day strings, Hijri formatting, and streak math.

// Local (not UTC) YYYY-MM-DD so "today" matches the user's wall clock.
export function todayISO(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isToday(isoString) {
  return isoString === todayISO()
}

export function isYesterday(isoString) {
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return isoString === todayISO(y)
}

// Whole days from the given local ISO day to today (0 = today, 1 = yesterday).
// Infinity when missing/unparseable, so callers can treat it as "long ago".
export function daysAgo(isoString) {
  if (!isoString) return Infinity
  const [y, m, d] = isoString.split('-').map(Number)
  if (!y || !m || !d) return Infinity
  const then = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today - then) / 86400000)
}

// e.g. "Tuesday, 16 June 2026"
export function formatGregorian(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// Hijri month names (transliterated) — supplied by us rather than relying on
// the device's locale data, which is missing/incorrect on some Android builds
// (they render Gregorian names like "January" and a "BC" era for the Islamic
// calendar). The same names are used across app languages.
const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabiʻ al-Awwal',
  'Rabiʻ al-Thani',
  'Jumada al-Ula',
  'Jumada al-Thani',
  'Rajab',
  'Shaʻban',
  'Ramadan',
  'Shawwal',
  'Dhuʻl-Qiʻdah',
  'Dhuʻl-Hijjah',
]

// Arithmetic (Kuwaiti/tabular) Gregorian→Hijri conversion. Device-independent
// fallback for runtimes that don't apply the Islamic calendar at all.
function gregorianToHijri(date) {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  let l = jdn - 1948440 + 10632
  const n = Math.floor((l - 1) / 10631)
  l = l - 10631 * n + 354
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238)
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29
  const hMonth = Math.floor((24 * l) / 709)
  const hDay = l - Math.floor((709 * hMonth) / 24)
  const hYear = 30 * n + j - 30
  return { year: hYear, month: hMonth, day: hDay }
}

// e.g. "Muharram 3, 1448 AH". Uses the Intl Islamic (Umm al-Qura) calendar for
// the numbers — which is reliable even where the *names* aren't — and our own
// month names + era. Falls back to the arithmetic conversion if Intl doesn't
// apply the Islamic calendar (year would come back Gregorian-sized).
export function formatHijri(date = new Date(), offset = 0) {
  // Apply the user's adjustment (±days) to align with their local sighting.
  const d = offset ? new Date(date.getTime() + offset * 86400000) : date
  let day, month, year
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(d)
    const get = (t) => parts.find((p) => p.type === t)?.value
    day = parseInt(get('day'), 10)
    month = parseInt(get('month'), 10)
    year = parseInt(get('year'), 10)
  } catch {
    /* fall through to arithmetic */
  }
  // Validate: a real Hijri year for this era is ~1300–1600; anything else (e.g.
  // a Gregorian 2026) means the Islamic calendar wasn't applied.
  if (!(month >= 1 && month <= 12 && year > 1000 && year < 1700)) {
    ;({ day, month, year } = gregorianToHijri(d))
  }
  if (!(month >= 1 && month <= 12)) return ''
  return `${HIJRI_MONTHS[month - 1]} ${day}, ${year} AH`
}
