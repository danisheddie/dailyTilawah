// "Your journey" — whole-Qur'an progress: how far through the mushaf you are
// (khatm ring + juz strip), completions, and streak milestones. Calm and
// private — motivation through the sense of a journey, not competition.

import { useNavigate } from 'react-router-dom'
import { getJourneySummary } from '../utils/storage'
import { juzForPage } from '../utils/api'
import { useLang } from '../utils/i18n.jsx'

function Ring({ pct }) {
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)
  return (
    <svg viewBox="0 0 120 120" className="h-44 w-44">
      <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-teal/10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        className="text-gold transition-all duration-700"
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="58" textAnchor="middle" className="fill-teal text-[26px] font-bold">
        {pct}%
      </text>
    </svg>
  )
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl bg-teal/5 px-4 py-4 text-center">
      <p className="text-2xl font-bold text-teal">{value}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  )
}

export default function Journey() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { lastPage, totalPagesRead, khatmCount, streak, longestStreak } =
    getJourneySummary()

  const pct = Math.min(100, Math.round((lastPage / 604) * 100))
  const juz = juzForPage(lastPage)

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-8">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="rounded-full p-1.5 text-muted transition active:scale-90"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-teal">{t('journey.title')}</h1>
      </header>

      {/* Khatm progress ring */}
      <section className="mt-6 flex flex-col items-center text-center">
        <Ring pct={pct} />
        <p className="mt-3 text-sm font-medium text-teal">
          {t('journey.juz', { n: juz })}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {t('journey.page', { page: lastPage })}
        </p>
      </section>

      {/* Juz strip */}
      <section className="mt-7">
        <div className="flex gap-[3px]">
          {Array.from({ length: 30 }, (_, i) => (
            <span
              key={i}
              className={`h-2.5 flex-1 rounded-full ${
                i < juz ? 'bg-gold' : 'bg-teal/10'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Completions */}
      <section className="mt-7 rounded-2xl border border-gold/30 bg-gold/[0.06] px-5 py-4 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">
          {t('journey.completions')}
        </p>
        {khatmCount > 0 ? (
          <p className="mt-2 text-2xl font-bold text-teal">
            {t('journey.completedTimes', { n: khatmCount })}
          </p>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t('journey.firstKhatm')}
          </p>
        )}
      </section>

      {/* Stats */}
      <section className="mt-5 grid grid-cols-2 gap-3">
        <Stat value={streak} label={t('journey.currentStreak')} />
        <Stat value={longestStreak} label={t('journey.bestStreak')} />
        <Stat value={totalPagesRead} label={t('journey.pagesRead')} />
        <Stat value={khatmCount} label={t('journey.completionsShort')} />
      </section>
    </div>
  )
}
