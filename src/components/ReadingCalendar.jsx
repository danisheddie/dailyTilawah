// A calm month calendar marking the days you completed your reading — a quiet
// consistency view (not a busy heatmap). Lives on the Journey screen.

import { useState } from 'react'
import { getReadHistory } from '../utils/storage'
import { todayISO } from '../utils/dateUtils'
import { useLang } from '../utils/i18n.jsx'

function iso(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function ReadingCalendar() {
  const { t, lang } = useLang()
  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })

  const readSet = new Set(getReadHistory())
  const todayStr = todayISO()

  const firstWeekday = new Date(view.y, view.m, 1).getDay() // 0 = Sunday
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const atCurrentMonth =
    view.y === today.getFullYear() && view.m === today.getMonth()

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(lang, { weekday: 'narrow' }).format(new Date(2023, 0, 1 + i))
  )
  const monthLabel = new Intl.DateTimeFormat(lang, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(view.y, view.m, 1))

  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    if (readSet.has(iso(view.y, view.m, d))) count++
  }

  function shift(delta) {
    const dt = new Date(view.y, view.m + delta, 1)
    setView({ y: dt.getFullYear(), m: dt.getMonth() })
  }

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('journey.consistency')}
        </h2>
        <span className="text-xs text-muted">
          {t('journey.daysThisMonth', { n: count })}
        </span>
      </div>

      <div className="rounded-2xl border border-teal/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="rounded-full p-1.5 text-muted transition active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-medium text-teal">{monthLabel}</span>
          <button
            onClick={() => shift(1)}
            disabled={atCurrentMonth}
            aria-label="Next month"
            className="rounded-full p-1.5 text-muted transition active:scale-90 disabled:opacity-30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdays.map((w, i) => (
            <span key={`w${i}`} className="pb-1 text-[10px] font-medium uppercase text-muted">
              {w}
            </span>
          ))}
          {cells.map((d, i) => {
            if (d === null) return <span key={i} />
            const ds = iso(view.y, view.m, d)
            const read = readSet.has(ds)
            const isToday = ds === todayStr
            const future = ds > todayStr
            return (
              <span
                key={i}
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs ${
                  read
                    ? 'bg-gold font-semibold text-paper'
                    : isToday
                      ? 'text-teal ring-1 ring-teal/40'
                      : future
                        ? 'text-muted/30'
                        : 'text-muted'
                }`}
              >
                {d}
              </span>
            )
          })}
        </div>
      </div>
    </section>
  )
}
