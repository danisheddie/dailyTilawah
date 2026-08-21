// Home: the premium dashboard. A date/prayer header, today's reading progress,
// a two-part stats card, the verse of the day, and a navy "continue reading"
// dock pinned above the tab bar. Playfair Display carries the headings.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getProgressSummary,
  getReminders,
  getSettings,
  getTotalPagesRead,
  getLongestStreak,
  getLastReadDate,
  isStreakOnGrace,
  setLastPage,
} from '../utils/storage'
import { SURAH_PAGES, SURAH_NAMES } from '../utils/api'
import JumpSheet from './JumpSheet'
import { formatGregorian, formatHijri } from '../utils/dateUtils'
import { getDailyReflection } from '../data/reflections'
import { nextPrayer, formatTime } from '../utils/prayer'
import InstallPrompt from './InstallPrompt'
import BetaNotice from './BetaNotice'
import BackupNudge from './BackupNudge'
import HelpPointer from './HelpPointer'
import { useLang } from '../utils/i18n.jsx'

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
  const [showSearch, setShowSearch] = useState(false)
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
  const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(1))

  // Relative "last read" — the streak stat's sub-line.
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
  // Surface the grace to keep the sub-line encouraging even after a missed day.
  if (!completedToday && isStreakOnGrace()) lastReadRel = t('home.streakKept')

  // Verse of the day — always a Qur'an verse here (hadith live in Reflection).
  const verse = getDailyReflection('quran')

  const resumeSurah = surahForPage(lastPage)

  return (
    <>
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-52 pt-5">
      {/* Header: date + next prayer on the left, profile on the right */}
      <header className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-2 font-display text-[17px] font-semibold text-teal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-gold" aria-hidden="true">
              <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 9h16M8 3v3M16 3v3" />
            </svg>
            {formatHijri(new Date(), getSettings().hijriOffset)}
          </p>
          {upcoming ? (
            <p className="mt-1 text-[13px] font-medium text-gold">
              {upcoming.name} · {formatTime(upcoming.time)}
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-muted">{formatGregorian()}</p>
          )}
        </div>
        <button
          aria-label="Settings"
          onClick={() => navigate('/settings')}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-teal/12 bg-teal/[0.04] text-teal transition active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
          </svg>
        </button>
      </header>

      {/* Search: jump to any surah or page */}
      <button
        onClick={() => setShowSearch(true)}
        className="mt-6 flex w-full items-center gap-3 rounded-xl border border-teal/10 bg-teal/[0.03] px-4 py-3 text-left transition active:scale-[0.99]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="text-sm text-muted">{t('home.search')}</span>
      </button>

      {/* Dismissible notices (only one shows at a time) */}
      <InstallPrompt />
      <BackupNudge />
      <HelpPointer />
      <BetaNotice />

      {/* Today's reading progress */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <span className="t-eyebrow">{t('home.todaysReading')}</span>
          <span className="text-[13px] font-medium text-muted">
            {fmt(Math.min(todayProgress, goal.pages))} / {fmt(goal.pages)}{' '}
            {goal.pages === 1 ? t('common.page') : t('common.pages')}
          </span>
        </div>
        <div className="relative mt-2.5 h-2 w-full rounded-full bg-teal/[0.08]">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500"
            style={{ width: `${Math.max(pct, todayProgress > 0 ? 6 : 0)}%` }}
          />
          {pct > 0 && (
            <span
              className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold bg-paper shadow-sm transition-all duration-500"
              style={{ left: `${Math.max(pct, 6)}%` }}
            />
          )}
        </div>
      </section>

      {/* Stats: streak | lifetime, one card split in two */}
      <button
        onClick={() => navigate('/journey')}
        className="card mt-6 flex w-full items-stretch px-2 py-4 text-left transition active:scale-[0.99]"
      >
        <div className="flex flex-1 items-center gap-3 px-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-gold" aria-hidden="true">
            <path d="M12 3c1.5 3 4 4.5 4 7.5a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 10 8 8 8 6c1.5.5 3 1 4-3z" />
          </svg>
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold leading-none text-teal">{streak}</p>
            <p className="mt-1 text-[12px] leading-tight text-muted">{t('settings.dayStreak')}</p>
            {lastReadRel && (
              <p className="mt-0.5 truncate text-[11px] leading-tight text-muted/80">{lastReadRel}</p>
            )}
          </div>
        </div>
        <div className="w-px self-stretch bg-teal/10" />
        <div className="flex flex-1 items-center gap-3 px-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-teal/70" aria-hidden="true">
            <path d="M3 20h18M7 20v-7M12 20V5M17 20v-10" />
          </svg>
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold leading-none text-teal">{totalPages}</p>
            <p className="mt-1 text-[12px] leading-tight text-muted">{t('settings.lifetime')}</p>
          </div>
        </div>
      </button>

      {/* Verse of the day — centered in the space that remains so the screen
          reads as calm breathing room, not a gap stranded above the dock. */}
      <div className="flex flex-1 items-center py-8">
        {verse && <VerseOfDay verse={verse} label={t('reflection.verse')} />}
      </div>
    </div>

    {/* Continue-reading dock — pinned just above the tab bar */}
    <div className="fixed inset-x-0 z-20 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+0.75rem)]">
      <div className="mx-auto max-w-md px-3">
        <button
          onClick={() => navigate('/read')}
          className="relative flex w-full items-center gap-4 overflow-hidden rounded-t-2xl bg-teal px-6 py-6 text-left shadow-[0_-6px_24px_rgb(var(--c-teal)/0.18)] transition active:scale-[0.99]"
        >
          {/* Geometric watermark — an 8-point star mandala */}
          <StarMandala className="pointer-events-none absolute -right-7 top-1/2 h-48 w-48 -translate-y-1/2 text-gold/20" />
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold">
              {t('home.continueReading')}
            </p>
            <p className="mt-1 truncate font-display text-[25px] font-semibold text-paper">
              {resumeSurah}
            </p>
            <p className="mt-1 text-[12.5px] text-paper/70">
              {t('reader.page', { page: lastPage })}
            </p>
          </div>
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-paper text-teal transition active:scale-90">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </button>
      </div>
    </div>

    {showSearch && (
      <JumpSheet
        initialTab="surah"
        onClose={() => setShowSearch(false)}
        onJump={(page) => {
          setLastPage(page)
          setShowSearch(false)
          navigate('/read')
        }}
      />
    )}
    </>
  )
}

// An 8-point star mandala (khatim) drawn as layered line-work — used as the
// faint watermark on the continue-reading dock. Colour comes from the parent
// via currentColor so it can sit at any tint/opacity.
function StarMandala({ className = '' }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* outer 8-point star: two overlapping squares */}
      <path d="M50 5 L95 50 L50 95 L5 50 Z" />
      <path d="M17 17 H83 V83 H17 Z" />
      {/* middle 8-point star */}
      <path d="M50 24 L76 50 L50 76 L24 50 Z" />
      <path d="M33 33 H67 V67 H33 Z" />
      {/* inner rosette of eight petals */}
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse key={i} cx="50" cy="34" rx="4.4" ry="12" transform={`rotate(${i * 45} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="3.4" />
    </svg>
  )
}

function VerseOfDay({ verse, label }) {
  return (
    <section className="w-full">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
          {label}
        </span>
        <span className="h-px flex-1 bg-gold/25" />
      </div>
      <figure className="relative mt-3">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-1 -top-4 select-none font-display text-6xl leading-none text-gold/25"
        >
          &ldquo;
        </span>
        {verse.arabic && (
          <p dir="rtl" lang="ar" className="relative pl-6 font-quran text-xl leading-loose text-teal">
            {verse.arabic}
          </p>
        )}
        <blockquote className="relative mt-2 pl-6 font-display text-[19px] font-medium leading-snug text-teal">
          {verse.text}
        </blockquote>
        <figcaption className="mt-3 pl-6 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
          {verse.source}
        </figcaption>
      </figure>
    </section>
  )
}
