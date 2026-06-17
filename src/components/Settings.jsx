// Settings: goal, optional reading aids, lifetime stats, and reset.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Reminders from './Reminders'
import SyncSettings from './SyncSettings'
import StartingPoint from './StartingPoint'
import { RECITERS } from '../utils/api'
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
        <h1 className="text-xl font-semibold text-teal">Settings</h1>
      </header>

      {/* Stats */}
      <section className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-teal/5 px-4 py-5 text-center">
          <p className="text-2xl font-bold text-teal">{streak}</p>
          <p className="mt-1 text-xs text-muted">day streak</p>
        </div>
        <div className="rounded-2xl bg-gold/10 px-4 py-5 text-center">
          <p className="text-2xl font-bold text-teal">{totalPages}</p>
          <p className="mt-1 text-xs text-muted">pages read (lifetime)</p>
        </div>
      </section>

      {/* Name */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Your name
        </h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setNameState(e.target.value)}
          onBlur={() => setName(name)}
          placeholder="Your name"
          maxLength={40}
          className="mt-3 w-full rounded-2xl border border-teal/15 bg-transparent px-5 py-3 text-base text-teal outline-none transition placeholder:text-muted/60 focus:border-teal"
        />
      </section>

      {/* Goal */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Daily goal
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
              {g.label}
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
            Custom
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
            <span className="text-sm text-muted">pages per day</span>
          </div>
        )}
      </section>

      {/* Reading view */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Reading view
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { id: 'mushaf', label: 'Mushaf page', sub: 'Exact Madani print' },
            { id: 'list', label: 'Translation', sub: 'Ayah list + meaning' },
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
          Reading aids
        </h2>
        <p className="mt-1 text-xs text-muted">
          Used in the Translation view.
        </p>
        <div className="mt-1 divide-y divide-teal/5">
          <Toggle
            label="Show translation"
            description="English meaning below each ayah"
            checked={settings.showTranslation}
            onChange={(v) => toggle('showTranslation', v)}
          />
          <Toggle
            label="Show transliteration"
            description="Latin pronunciation in italics"
            checked={settings.showTransliteration}
            onChange={(v) => toggle('showTransliteration', v)}
          />
          <Toggle
            label="Show audio controls"
            description="Play recitation for each ayah"
            checked={settings.showAudio}
            onChange={(v) => toggle('showAudio', v)}
          />
        </div>

        {settings.showAudio && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-teal">
              Reciter
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

      {/* Reading position */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Reading position
        </h2>
        <p className="mt-1 text-xs text-muted">
          Already partway through the Qur&apos;an? Pick where your reading
          should resume. Currently resuming on page {resumePage} of 604.
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
            Reset progress
          </button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm text-red-600">
              This clears your streak, position, and lifetime totals. This
              cannot be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                className="btn-ghost grow"
                onClick={() => setConfirmReset(false)}
              >
                Cancel
              </button>
              <button
                className="grow rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
                onClick={doReset}
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="mt-10 text-center text-xs text-muted">
        Tilawah · One page a day. Every day.
      </p>
      <p className="mt-1 text-center text-[11px] text-muted/80">
        Beta · thank you for testing. Use it freely — your feedback shapes it.
      </p>
    </div>
  )
}
