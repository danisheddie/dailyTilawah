// Home: the calm dashboard. Date, streak, today's progress, and a single
// clear action to start (or continue) today's reading.

import { useNavigate } from 'react-router-dom'
import { getProgressSummary, getName, getReminders, getSettings, getLongestStreak, getLastReadDate } from '../utils/storage'
import { formatGregorian, formatHijri } from '../utils/dateUtils'
import { nextPrayer, formatTime } from '../utils/prayer'
import StreakBadge from './StreakBadge'
import DailyReflection from './DailyReflection'
import BetaNotice from './BetaNotice'
import InstallPrompt from './InstallPrompt'
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

  // A lapsed reader (had a streak before, none now) gets a gentle welcome
  // rather than the cold "begin today" — encouragement, not a scold.
  const lapsed = streak === 0 && getLongestStreak() > 0
  const message = completedToday
    ? t('home.complete')
    : streak > 0
      ? t('home.keepStreak')
      : lapsed
        ? t('home.welcomeBack')
        : t('home.beginToday')

  // Quiet "last read …" line, shown only when there's something to resume.
  let lastReadLabel = null
  if (!completedToday) {
    const last = getLastReadDate()
    if (last) {
      const [y, m, d] = last.split('-').map(Number)
      const then = new Date(y, m - 1, d)
      const now = new Date()
      const days = Math.round(
        (new Date(now.getFullYear(), now.getMonth(), now.getDate()) - then) / 86400000
      )
      lastReadLabel =
        days <= 0
          ? t('home.lastReadToday')
          : days === 1
            ? t('home.lastReadYesterday')
            : t('home.lastReadDaysAgo', { n: days })
    }
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden px-6 pb-6 pt-6">
      <header className="flex shrink-0 items-start justify-between">
        <div>
          <p className="text-sm font-medium text-teal">
            {formatHijri(new Date(), getSettings().hijriOffset)}
          </p>
          <p className="mt-0.5 text-xs text-muted">{formatGregorian()}</p>
          {upcoming && (
            <p className="mt-1 text-xs text-gold">
              {t('home.next', { name: upcoming.name, time: formatTime(upcoming.time) })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/journey')}
            aria-label={t('journey.viewJourney')}
            className="rounded-full p-2 text-muted transition active:scale-90"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 20h18M7 20v-7M12 20V6M17 20v-10" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="rounded-full p-2 text-muted transition active:scale-90"
          >
            <GearIcon />
          </button>
        </div>
      </header>

      <div className="shrink-0">
        <InstallPrompt />
        <BetaNotice />
      </div>

      {/* Middle: greeting, streak, reflection — centered, absorbs slack */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 text-center">
        {name && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">
              {t('home.salam')}
            </p>
            <p className="mt-1 text-2xl font-semibold text-teal">{name}</p>
          </div>
        )}

        <div className="flex flex-col items-center">
          <button
            onClick={() => navigate('/journey')}
            aria-label={t('journey.viewJourney')}
            className="transition active:scale-95"
          >
            <StreakBadge streak={streak} size="lg" />
          </button>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            {message}
          </p>
          {lastReadLabel && (
            <p className="mt-1 text-xs text-muted/70">{lastReadLabel}</p>
          )}
        </div>

        <DailyReflection className="w-full" />
      </div>

      {/* Bottom: today's goal + action */}
      <div className="shrink-0 pt-4">
        <div className="mb-2 flex items-center justify-between text-sm">
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
          className="btn-primary mt-5 w-full"
          onClick={() => navigate('/read')}
        >
          {completedToday || started
            ? t('home.continueReading')
            : t('home.startToday')}
        </button>
        {started && (
          <p className="mt-2 text-center text-xs text-muted">
            {t('home.resuming', { page: lastPage })}
          </p>
        )}
      </div>
    </div>
  )
}
