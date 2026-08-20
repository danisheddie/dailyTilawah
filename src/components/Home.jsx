// Home: the calm dashboard, recomposed around continuing the Qur'an. A
// continue-reading hero leads; goal, quiet stats, and a reflection follow.

import { useNavigate } from 'react-router-dom'
import {
  getProgressSummary,
  getReminders,
  getSettings,
  getTotalPagesRead,
  getLongestStreak,
  getLastReadDate,
  isStreakOnGrace,
} from '../utils/storage'
import { SURAH_PAGES, SURAH_NAMES } from '../utils/api'
import { formatGregorian, formatHijri } from '../utils/dateUtils'
import { nextPrayer, formatTime } from '../utils/prayer'
import Stat from './ui/Stat'
import DailyReflection from './DailyReflection'
import BetaNotice from './BetaNotice'
import InstallPrompt from './InstallPrompt'
import BackupNudge from './BackupNudge'
import HelpPointer from './HelpPointer'
import { useLang } from '../utils/i18n.jsx'

function IconBtn({ label, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-lg p-2 text-muted transition active:scale-90"
    >
      {children}
    </button>
  )
}

// The surah whose start page is nearest at or before `page` — the one you're
// resuming in, resolved synchronously from the page tables.
function surahForPage(page) {
  let idx = 0
  for (let i = 0; i < SURAH_PAGES.length; i++) {
    if (SURAH_PAGES[i] <= page) idx = i
    else break
  }
  return SURAH_NAMES[idx] || SURAH_NAMES[0]
}

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { goal, todayProgress, completedToday, streak, lastPage } = getProgressSummary()
  const totalPages = getTotalPagesRead()

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
  const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(1))

  // Relative "last read" — powers the streak stat's sub-line.
  const lastReadDate = getLastReadDate()
  let lastReadRel = null
  if (lastReadDate) {
    const [y, m, d] = lastReadDate.split('-').map(Number)
    const then = new Date(y, m - 1, d)
    const now = new Date()
    const days = Math.round(
      (new Date(now.getFullYear(), now.getMonth(), now.getDate()) - then) / 86400000
    )
    lastReadRel =
      days <= 0
        ? t('home.lastReadToday')
        : days === 1
          ? t('home.lastReadYesterday')
          : t('home.lastReadDaysAgo', { n: days })
  }

  // A single quiet line of encouragement reflecting today's state.
  const lapsed = streak === 0 && getLongestStreak() > 0
  const onGrace = !completedToday && isStreakOnGrace()
  const message = completedToday
    ? t('home.complete')
    : onGrace
      ? t('home.streakKept')
      : streak > 0
        ? t('home.keepStreak')
        : lapsed
          ? t('home.welcomeBack')
          : t('home.beginToday')

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-6 pb-28 pt-6">
      {/* Top: date + next prayer, quiet nav */}
      <header className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 text-[15px] font-semibold text-teal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gold" aria-hidden="true">
              <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 9h16M8 3v3M16 3v3" />
            </svg>
            {formatHijri(new Date(), getSettings().hijriOffset)}
          </p>
          {upcoming ? (
            <p className="mt-1 text-xs text-gold">
              {t('home.next', { name: upcoming.name, time: formatTime(upcoming.time) })}
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">{formatGregorian()}</p>
          )}
        </div>
        <div className="-mr-2 flex items-center">
          <IconBtn label={t('help.title')} onClick={() => navigate('/help')}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </IconBtn>
          <IconBtn label={t('journey.viewJourney')} onClick={() => navigate('/journey')}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 20h18M7 20v-7M12 20V6M17 20v-10" />
            </svg>
          </IconBtn>
          <IconBtn label="Settings" onClick={() => navigate('/settings')}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </IconBtn>
        </div>
      </header>

      {/* Dismissible notices (only one shows at a time) */}
      <InstallPrompt />
      <BackupNudge />
      <HelpPointer />
      <BetaNotice />

      {/* Hero: where you're reading (tappable). The primary CTA lives at the
          bottom of the screen, within thumb reach. */}
      <section className="mt-7">
        <button
          onClick={() => navigate('/read')}
          className="relative w-full overflow-hidden rounded-2xl bg-teal/[0.04] px-5 py-6 text-left shadow-card transition active:scale-[0.99]"
        >
          <p className="section-label">{t('home.continueReading')}</p>
          <p className="mt-1.5 t-display">{surahForPage(lastPage)}</p>
          <p className="mt-1 t-body">{t('reader.page', { page: lastPage })}</p>
          {/* Decorative rub-el-hizb medallion */}
          <div className="pointer-events-none absolute right-4 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-2xl bg-teal">
            <span className="text-3xl leading-none text-gold" aria-hidden="true">۞</span>
          </div>
        </button>
        <p className="mt-2.5 px-1 text-center t-caption">{message}</p>
      </section>

      {/* Today's goal */}
      <section className="mt-7">
        <div className="mb-2 flex items-center justify-between">
          <span className="t-heading">{t('home.todayGoal')}</span>
          <span className="text-sm text-muted">
            {fmt(Math.min(todayProgress, goal.pages))} / {fmt(goal.pages)}{' '}
            {goal.pages === 1 ? t('common.page') : t('common.pages')}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-teal/[0.08]">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      {/* Quiet reading stats */}
      <section className="mt-6 grid grid-cols-2 gap-3">
        <div className="card px-4 py-4">
          <Stat
            accent="gold"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3c1.5 3 4 4.5 4 7.5a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 10 8 8 8 6c1.5.5 3 1 4-3z" />
              </svg>
            }
            value={streak}
            label={t('settings.dayStreak')}
            sub={lastReadRel}
          />
        </div>
        <div className="card px-4 py-4">
          <Stat
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 20h18M7 20v-7M12 20V6M17 20v-10" />
              </svg>
            }
            value={totalPages}
            label={t('settings.lifetime')}
          />
        </div>
      </section>

      {/* Reflection — secondary */}
      <section className="mt-8">
        <DailyReflection />
      </section>

      {/* Primary action, anchored in the thumb zone */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-paper via-paper/95 to-transparent px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        <button
          className="btn-primary pointer-events-auto w-full"
          onClick={() => navigate('/read')}
        >
          {completedToday || started ? t('home.continueReading') : t('home.startToday')}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
