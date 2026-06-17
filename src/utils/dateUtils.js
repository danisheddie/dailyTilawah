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

// e.g. "Tuesday, 16 June 2026"
export function formatGregorian(date = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// e.g. "29 Dhuʻl-Hijjah 1447 AH" using the Intl Islamic calendar.
export function formatHijri(date = new Date()) {
  try {
    const formatted = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
    // Some runtimes already include the era ("AH") in the formatted year;
    // only add it when it's missing, to avoid "1448 AH AH".
    return /\bAH\b/.test(formatted) ? formatted : `${formatted} AH`
  } catch {
    return ''
  }
}
