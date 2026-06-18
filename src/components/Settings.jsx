// Settings: goal, optional reading aids, lifetime stats, and reset.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Reminders from './Reminders'
import SyncSettings from './SyncSettings'
import StartingPoint from './StartingPoint'
import { RECITERS, TRANSLATIONS } from '../utils/api'
import { useLang, LANGUAGES } from '../utils/i18n.jsx'
import { applyTheme } from '../utils/theme'
import {
  GOALS,
  MIN_CUSTOM_GOAL,
  MAX_CUSTOM_GOAL,
  clampGoalPages,
  getGoal,
  setGoal,
  getSettings,
  setSetting,
  getStreak,
  getTotalPagesRead,
  resetProgress,
  getName,
  setName,
  getLastPage,
  setLastPage,
} from '../utils/storage'

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-4">
      <span>
        <span className="block text-sm font-medium text-teal">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-teal' : 'bg-muted/30'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { t, lang, setLang } = useLang()
  const initialGoal = getGoal()
  const [goalId, setGoalId] = useState(() => initialGoal.id)
  const [customPages, setCustomPages] = useState(() =>
    initialGoal.id === 'custom' ? initialGoal.pages : 3
  )
  const [settings, setSettings] = useState(() => getSettings())
  const [name, setNameState] = useState(() => getName())
  const [resumePage, setResumePage] = useState(() => getLastPage())
  const [confirmReset, setConfirmReset] = useState(false)

  const streak = getStreak()
  const totalPages = getTotalPagesRead()

  function changeGoal(id) {
    setGoalId(id)
    if (id === 'custom') setGoal('custom', customPages)
    else setGoal(id)
  }

  function changeCustomPages(value) {
    setCustomPages(value)
    if (goalId === 'custom') setGoal('custom', value)
  }

  function toggle(key, value) {
    setSettings(setSetting(key, value))
  }

  function changeTheme(theme) {
    setSettings(setSetting('theme', theme))
    applyTheme(theme)
  }

  function doReset() {
    resetProgress()
    setConfirmReset(false)
    navigate('/', { replace: true })
  }

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
        <h1 className="text-xl font-semibold text-teal">{t('settings.title')}</h1>
      </header>

      {/* Stats */}
      <section className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-teal/5 px-4 py-5 text-center">
          <p className="text-2xl font-bold text-teal">{streak}</p>
          <p className="mt-1 text-xs text-muted">{t('settings.dayStreak')}</p>
        </div>
        <div className="rounded-2xl bg-gold/10 px-4 py-5 text-center">
          <p className="text-2xl font-bold text-teal">{totalPages}</p>
          <p className="mt-1 text-xs text-muted">{t('settings.lifetime')}</p>
        </div>
      </section>

      {/* App language */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings.appLanguage')}
        </h2>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="mt-3 w-full rounded-2xl border border-teal/15 bg-transparent px-4 py-3 text-sm text-teal outline-none transition focus:border-teal"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </section>

      {/* Theme */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings.theme')}
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            ['light', 'settings.themeLight'],
            ['dark', 'settings.themeDark'],
            ['sepia', 'settings.themeSepia'],
          ].map(([id, key]) => (
            <button
              key={id}
              onClick={() => changeTheme(id)}
              className={`rounded-2xl border px-2 py-3 text-sm font-medium transition ${
                settings.theme === id
                  ? 'border-teal bg-teal text-paper'
                  : 'border-teal/15 text-teal active:scale-[0.99]'
              }`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </section>

      {/* Reading size */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings.readingSize')}
        </h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            ['s', 'settings.sizeSmall'],
            ['m', 'settings.sizeMedium'],
            ['l', 'settings.sizeLarge'],
          ].map(([id, key]) => (
            <button
              key={id}
              onClick={() => toggle('readingSize', id)}
              className={`rounded-2xl border px-2 py-3 font-medium transition ${
                settings.readingSize === id
                  ? 'border-teal bg-teal text-paper'
                  : 'border-teal/15 text-teal active:scale-[0.99]'
              } ${id === 's' ? 'text-xs' : id === 'l' ? 'text-base' : 'text-sm'}`}
            >
              {t(key)}
            </button>
          ))}
        </div>
      </section>

      {/* Name */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings.yourName')}
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setNameState(e.target.value)}
          onBlur={() => setName(name)}
          placeholder={t('onboarding.namePlaceholder')}
          maxLength={40}
          className="mt-3 w-full rounded-2xl border border-teal/15 bg-transparent px-5 py-3 text-base text-teal outline-none transition placeholder:text-muted/60 focus:border-teal"
        />
      </section>

      {/* Goal */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings.dailyGoal')}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {GOALS.map((g) => (
            <button
              key={g.id}
              onClick={() => changeGoal(g.id)}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                goalId === g.id
                  ? 'border-teal bg-teal text-paper'
                  : 'border-teal/15 text-teal active:scale-[0.99]'
              }`}
            >
              {t('goal.' + g.id)}
            </button>
          ))}
          <button
            onClick={() => changeGoal('custom')}
            className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
              goalId === 'custom'
                ? 'border-teal bg-teal text-paper'
                : 'border-teal/15 text-teal active:scale-[0.99]'
            }`}
          >
            {t('goal.custom')}
          </button>
        </div>

        {goalId === 'custom' && (
          <div className="mt-3 flex items-center gap-3">
            <input
              type="number"
              min={MIN_CUSTOM_GOAL}
              max={MAX_CUSTOM_GOAL}
              step={0.5}
              value={customPages}
              onChange={(e) => changeCustomPages(e.target.value)}
              onBlur={(e) => changeCustomPages(clampGoalPages(e.target.value))}
              className="w-24 rounded-2xl border border-teal/15 bg-transparent px-4 py-3 text-center text-sm text-teal outline-none transition focus:border-teal"
            />
            <span className="text-sm text-muted">{t('goal.pagesPerDay')}</span>
          </div>
        )}
      </section>

      {/* Reading view */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings.readingView')}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { id: 'mushaf', label: t('settings.mushafPage'), sub: t('settings.mushafSub') },
            { id: 'list', label: t('settings.translationView'), sub: t('settings.translationViewSub') },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => toggle('readingView', v.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                settings.readingView === v.id
                  ? 'border-teal bg-teal text-paper'
                  : 'border-teal/15 text-teal active:scale-[0.99]'
              }`}
            >
              <span className="block text-sm font-medium">{v.label}</span>
              <span
                className={`mt-0.5 block text-xs ${
                  settings.readingView === v.id ? 'text-paper/70' : 'text-muted'
                }`}
              >
                {v.sub}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Reading aids (apply to the Translation view) */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings.readingAids')}
        </h2>
        <p className="mt-1 text-xs text-muted">{t('settings.readingAidsSub')}</p>
        <div className="mt-1 divide-y divide-teal/5">
          <Toggle
            label={t('settings.showTranslation')}
            description={t('settings.showTranslationDesc')}
            checked={settings.showTranslation}
            onChange={(v) => toggle('showTranslation', v)}
          />
          {settings.showTranslation && (
            <div className="py-4">
              <label className="block text-sm font-medium text-teal">
                {t('settings.translation')}
              </label>
              <select
                value={settings.translationEdition}
                onChange={(e) => toggle('translationEdition', e.target.value)}
                className="mt-2 w-full rounded-2xl border border-teal/15 bg-transparent px-4 py-3 text-sm text-teal outline-none transition focus:border-teal"
              >
                {TRANSLATIONS.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Toggle
            label={t('settings.showTransliteration')}
            description={t('settings.showTransliterationDesc')}
            checked={settings.showTransliteration}
            onChange={(v) => toggle('showTransliteration', v)}
          />
          <Toggle
            label={t('settings.showAudio')}
            description={t('settings.showAudioDesc')}
            checked={settings.showAudio}
            onChange={(v) => toggle('showAudio', v)}
          />
        </div>

        {settings.showAudio && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-teal">
              {t('settings.reciter')}
            </label>
            <select
              value={settings.reciter}
              onChange={(e) => toggle('reciter', e.target.value)}
              className="mt-2 w-full rounded-2xl border border-teal/15 bg-transparent px-4 py-3 text-sm text-teal outline-none transition focus:border-teal"
            >
              {RECITERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Daily reflection */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings.dailyReflection')}
        </h2>
        <p className="mt-1 text-xs text-muted">{t('settings.reflectionSub')}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { id: 'both', label: t('settings.both') },
            { id: 'quran', label: t('settings.quranOnly') },
            { id: 'hadith', label: t('settings.hadithOnly') },
            { id: 'off', label: t('settings.off') },
          ].map((o) => (
            <button
              key={o.id}
              onClick={() => toggle('reflectionMode', o.id)}
              className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                settings.reflectionMode === o.id
                  ? 'border-teal bg-teal text-paper'
                  : 'border-teal/15 text-teal active:scale-[0.99]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* Reading position */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('settings.readingPosition')}
        </h2>
        <p className="mt-1 text-xs text-muted">
          {t('settings.readingPositionSub', { page: resumePage })}
        </p>
        <div className="mt-4">
          <StartingPoint
            onApplied={(page) => {
              setLastPage(page)
              setResumePage(page)
            }}
          />
        </div>
      </section>

      {/* Prayer-time reminders */}
      <Reminders />

      {/* Back up & sync */}
      <SyncSettings />

      {/* Reset */}
      <section className="mt-12">
        {!confirmReset ? (
          <button
            className="w-full rounded-2xl border border-red-200 px-5 py-3 text-sm font-medium text-red-500 transition active:scale-[0.99]"
            onClick={() => setConfirmReset(true)}
          >
            {t('settings.resetProgress')}
          </button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm text-red-600">{t('settings.resetConfirm')}</p>
            <div className="mt-4 flex gap-3">
              <button
                className="btn-ghost grow"
                onClick={() => setConfirmReset(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                className="grow rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
                onClick={doReset}
              >
                {t('settings.reset')}
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="mt-10 text-center text-xs text-muted">
        Tilawah · {t('common.appTagline')}
      </p>
      <p className="mt-1 text-center text-[11px] text-muted/80">
        {t('settings.betaFooter')}
      </p>
    </div>
  )
}
