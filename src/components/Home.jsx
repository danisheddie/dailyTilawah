// Home: a premium dashboard. A deep navy header (mihrab arch + geometric
// texture) carries the date, next prayer, and search; the cream body holds
// today's progress, streak/lifetime stats, the verse of the day, and a navy
// continue-reading card above the tab bar.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getProgressSummary,
  getReminders,
  getSettings,
  getTotalPagesRead,
  getLastReadDate,
  isStreakOnGrace,
  setLastPage,
} from '../utils/storage'
import { SURAH_PAGES, SURAH_NAMES } from '../utils/api'
import { formatGregorian, formatHijriLong } from '../utils/dateUtils'
import { getDailyReflection } from '../data/reflections'
import { nextPrayer, formatTime } from '../utils/prayer'
import InstallPrompt from './InstallPrompt'
import BetaNotice from './BetaNotice'
import BackupNudge from './BackupNudge'
import HelpPointer from './HelpPointer'
import JumpSheet from './JumpSheet'
import { useLang } from '../utils/i18n.jsx'

// The surah whose start page is nearest at or before `page`.
function surahForPage(page) {
  let idx = 0
  for (let i = 0; i < SURAH_PAGES.length; i++) {
    if (SURAH_PAGES[i] <= page) idx = i
    else break
  }
  return SURAH_NAMES[idx] || SURAH_NAMES[0]
}

// "Qur'an 41:34" -> "Fussilat · 41:34" using the surah number in the reference.
function verseSource(source) {
  const m = source && source.match(/(\d+):\d+/)
  if (m) {
    const name = SURAH_NAMES[Number(m[1]) - 1]
    if (name) return `${name} · ${source.slice(m.index)}`
  }
  return source
}

export default function Home() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [showSearch, setShowSearch] = useState(false)
  const { goal, todayProgress, completedToday, streak, lastPage } = getProgressSummary()
  const totalPages = getTotalPagesRead()
  const readToday = completedToday || todayProgress > 0

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

  // Streak sub-label — normally "Current streak", but reassure on grace.
  const graceOn = !completedToday && isStreakOnGrace()
  const streakSub = graceOn ? t('home.streakKeptShort') : t('home.currentStreak')

  const verse = getDailyReflection('quran')
  const resumeSurah = surahForPage(lastPage)

  return (
    <>
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-paper">
        {/* ---- Deep navy header ---- */}
        <header className="relative overflow-hidden rounded-b-[28px] bg-ink px-6 pb-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] text-cream">
          <Pattern id="hp" className="absolute inset-0 h-full w-full text-cream opacity-[0.05]" />
          <MihrabArch className="pointer-events-none absolute top-0 left-1/2 h-40 w-80 -translate-x-1/2 text-gold/45" />

          <div className="relative flex items-start justify-between">
            <div>
              <h1 className="font-display text-[22px] font-semibold leading-tight text-cream">
                {formatHijriLong(new Date(), getSettings().hijriOffset)}
              </h1>
              {upcoming ? (
                <p className="mt-1 text-[13.5px] font-medium text-gold">
                  {upcoming.name} · {formatTime(upcoming.time)}
                </p>
              ) : (
                <p className="mt-1 text-[13px] text-cream/70">{formatGregorian()}</p>
              )}
            </div>
            <button
              aria-label="Settings"
              onClick={() => navigate('/settings')}
              className="shrink-0 text-cream transition active:scale-95"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => setShowSearch(true)}
            className="relative mt-4 flex w-full items-center gap-3 rounded-2xl border border-cream/20 bg-cream/[0.06] px-4 py-3.5 text-left transition active:scale-[0.99]"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="text-cream/70" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="text-[15px] text-cream/70">{t('home.searchQuran')}</span>
          </button>
        </header>

        {/* ---- Cream body ---- */}
        <div className="flex flex-1 flex-col px-6 pb-[calc(var(--nav-h)+env(safe-area-inset-bottom)+1.5rem)] pt-6">
          <InstallPrompt />
          <BackupNudge />
          <HelpPointer />
          <BetaNotice />

          {/* Today's reading */}
          <section>
            <div className="flex items-baseline justify-between">
              <span className="t-eyebrow">{t('home.todaysReading')}</span>
              <span className="text-[13px] font-medium text-muted">
                {fmt(Math.min(todayProgress, goal.pages))} / {fmt(goal.pages)}{' '}
                {goal.pages === 1 ? t('common.page') : t('common.pages')}
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-teal/[0.1]">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{ width: `${Math.max(pct, todayProgress > 0 ? 5 : 0)}%` }}
              />
            </div>
            {completedToday && (
              <p className="mt-2 flex items-center justify-end gap-1.5 text-[13px] font-semibold text-gold">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {t('home.completed')}
              </p>
            )}
          </section>

          {/* Streak | lifetime — tap to open the full journey/streak view */}
          <button
            onClick={() => navigate('/journey')}
            className="mt-7 w-full text-left transition active:opacity-70"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="t-eyebrow">{t('journey.title')}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </div>
            <div className="flex items-stretch text-center">
              <div className="min-w-0 flex-1 px-3">
                <p className="font-display text-[34px] font-bold leading-none text-teal">{streak}</p>
                <p className="mt-1.5 text-sm font-medium text-teal">{t('settings.dayStreak')}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{streakSub}</p>
              </div>
              <div className="w-px self-stretch bg-teal/12" />
              <div className="min-w-0 flex-1 px-3">
                <p className="font-display text-[34px] font-bold leading-none text-teal">{totalPages}</p>
                <p className="mt-1.5 text-sm font-medium text-teal">{t('home.pagesRead')}</p>
                <p className="mt-0.5 text-xs text-muted">{t('home.lifetime')}</p>
              </div>
            </div>
          </button>

          {/* Verse of the day — a contained, understated daily grace note */}
          {verse && (
            <section className="mt-8 rounded-2xl border border-gold/15 bg-gold/[0.045] px-5 py-4">
              <div className="flex items-center gap-2">
                <StarSmall className="h-3.5 w-3.5 shrink-0 text-gold" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                  {t('reflection.verse')}
                </span>
              </div>
              {verse.arabic && (
                <p dir="rtl" lang="ar" className="mt-3 font-quran text-lg leading-loose text-teal">
                  {verse.arabic}
                </p>
              )}
              <blockquote className="mt-2.5 font-display text-[17px] leading-relaxed text-teal">
                {verse.text}
              </blockquote>
              <figcaption className="mt-2 text-[13px] text-muted">
                {verseSource(verse.source)}
              </figcaption>
            </section>
          )}

          {/* Continue reading */}
          <div className="mt-auto pt-9">
            <button
              onClick={() => navigate('/read')}
              className="relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-ink px-5 py-5 text-left shadow-[0_10px_30px_rgb(var(--c-ink)/0.25)] transition active:scale-[0.99]"
            >
              <Pattern id="cp" className="absolute inset-0 h-full w-full text-cream opacity-[0.05]" />
              <div className="relative min-w-0 flex-1">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold">
                  {t('home.continueReading')}
                </p>
                <p className="mt-1.5 truncate font-display text-[24px] font-semibold text-cream">
                  {resumeSurah}
                </p>
                <p className="mt-1 text-[12.5px] text-cream/60">
                  {t('reader.page', { page: lastPage })}
                  {readToday && ` · ${t('home.readToday')}`}
                </p>
              </div>
              <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-gold text-gold transition active:scale-90">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </button>
          </div>
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

// A small 8-point star (khatim) — the verse ornament.
function StarSmall({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2 L22 12 L12 22 L2 12 Z" />
      <path d="M5 5 H19 V19 H5 Z" />
    </svg>
  )
}

// A tiled 8-point-star lattice — a faint geometric texture on the navy panels.
function Pattern({ id, className = '' }) {
  return (
    <svg className={className} aria-hidden="true">
      <defs>
        <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="0.8">
            <path d="M17 3 L31 17 L17 31 L3 17 Z" />
            <path d="M8 8 H26 V26 H8 Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

// A mihrab / onion-dome arch outline, gold, rising behind the header title.
// Two nested outlines give the double-line look of a printed arch.
function MihrabArch({ className = '' }) {
  return (
    <svg viewBox="0 0 300 160" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className} aria-hidden="true" preserveAspectRatio="xMidYMin meet">
      <path d="M14 160 C14 84 74 78 108 62 C132 51 120 22 150 3 C180 22 168 51 192 62 C226 78 286 84 286 160" />
      <path d="M30 160 C30 96 84 90 114 76 C134 66 124 34 150 18 C176 34 166 66 186 76 C216 90 270 96 270 160" opacity="0.55" />
    </svg>
  )
}
