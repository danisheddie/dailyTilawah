// Home: the calm dashboard. Date, streak, today's progress, and a single
// clear action to start (or continue) today's reading.

import { useNavigate } from 'react-router-dom'
import { getProgressSummary, getName, getReminders } from '../utils/storage'
import { formatGregorian, formatHijri } from '../utils/dateUtils'
import { nextPrayer, formatTime } from '../utils/prayer'
import StreakBadge from './StreakBadge'
import DailyReflection from './DailyReflection'
import BetaNotice from './BetaNotice'
import { useLang } from '../utils/i18n.jsx'

function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLang()
  const summary = getProgressSummary()
  const { goal, todayProgress, completedToday, streak, lastPage } = summary
  const name = getName()

  const { location, method, madhab } = getReminders()
  let upcoming = null
  if (location) {
    try {
      upcoming = nextPrayer({ ...location, method, madhab })
    } catch {
      upcoming = null
    }
  }

  const pct = Math.min(100, Math.round((todayProgress / goal.pages) * 100))
  const started = lastPage > 1 || todayProgress > 0

  // Trim trailing ".0" so "1 / 1" reads cleanly while "0.5" survives.
  const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(1))

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-teal">{formatHijri()}</p>
          <p className="mt-0.5 text-xs text-muted">{formatGregorian()}</p>
          {upcoming && (
            <p className="mt-1 text-xs text-gold">
              {t('home.next', { name: upcoming.name, time: formatTime(upcoming.time) })}
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/settings')}
          aria-label="Settings"
          className="rounded-full p-2 text-muted transition active:scale-90"
        >
          <GearIcon />
        </button>
      </header>

      <BetaNotice />

      {name && (
        <div className="mt-8 text-center">
          <p className="text-xs uppercase tracking-wide text-muted">
            {t('home.salam')}
          </p>
          <p className="mt-1 text-2xl font-semibold text-teal">{name}</p>
        </div>
      )}

      <div className="mt-12 flex flex-col items-center text-center">
        <StreakBadge streak={streak} size="lg" />
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
          {completedToday
            ? t('home.complete')
            : streak > 0
              ? t('home.keepStreak')
              : t('home.beginToday')}
        </p>
      </div>

      <DailyReflection className="mt-10" />

      <div className="mt-auto pt-12">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-teal">{t('home.todayGoal')}</span>
          <span className="text-muted">
            {fmt(Math.min(todayProgress, goal.pages))} / {fmt(goal.pages)}{' '}
            {goal.pages === 1 ? t('common.page') : t('common.pages')}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-teal/10">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <button
          className="btn-primary mt-8 w-full"
          onClick={() => navigate('/read')}
        >
          {completedToday || started
            ? t('home.continueReading')
            : t('home.startToday')}
        </button>
        {started && (
          <p className="mt-3 text-center text-xs text-muted">
            {t('home.resuming', { page: lastPage })}
          </p>
        )}
      </div>
    </div>
  )
}
