// First-launch experience: welcome, set a daily goal, then a soft bismillah
// before entering the app. Runs only when localStorage has no `onboarded` flag.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GOALS,
  MIN_CUSTOM_GOAL,
  MAX_CUSTOM_GOAL,
  clampGoalPages,
  completeOnboarding,
  setLastPage,
} from '../utils/storage'
import StartingPoint from './StartingPoint'

export default function Onboarding({ onDone }) {
  const navigate = useNavigate()
  // 0 welcome, 1 name, 2 goal, 3 starting point, 4 bismillah
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [goalId, setGoalId] = useState('one')
  const [customPages, setCustomPages] = useState(3)
  const [startPage, setStartPage] = useState(1)

  function finish() {
    completeOnboarding(goalId, name, customPages)
    setLastPage(startPage)
    onDone?.()
    navigate('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      {step === 0 && (
        <div className="animate-fade-in">
          <p className="font-arabic text-2xl text-gold" dir="rtl" lang="ar">
            تِلَاوَة
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-teal">
            Tilawah
          </h1>
          <p className="mt-4 text-lg text-muted">One page a day. Every day.</p>
          <p className="mx-auto mt-8 max-w-xs text-sm leading-relaxed text-muted">
            A quiet space to build istiqomah with the Qur'an — no noise, no
            distraction. Just you and the words of Allah.
          </p>
          <button className="btn-primary mt-10 w-full" onClick={() => setStep(1)}>
            Begin
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="w-full animate-fade-in">
          <h2 className="text-2xl font-semibold text-teal">
            What should we call you?
          </h2>
          <p className="mt-2 text-sm text-muted">
            We'll use it to keep your journey personal.
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) setStep(2)
            }}
            placeholder="Your name"
            autoFocus
            maxLength={40}
            className="mt-8 w-full rounded-2xl border border-teal/15 bg-transparent px-5 py-4 text-center text-lg text-teal outline-none transition placeholder:text-muted/60 focus:border-teal"
          />
          <button
            className="btn-primary mt-8 w-full disabled:opacity-40"
            disabled={!name.trim()}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full animate-fade-in">
          <h2 className="text-2xl font-semibold text-teal">
            Set your daily goal
          </h2>
          <p className="mt-2 text-sm text-muted">
            Small and steady. You can change this anytime.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {GOALS.map((g) => (
              <button
                key={g.id}
                onClick={() => setGoalId(g.id)}
                className={`rounded-2xl border px-5 py-4 text-left text-base font-medium transition ${
                  goalId === g.id
                    ? 'border-teal bg-teal text-paper'
                    : 'border-teal/15 text-teal active:scale-[0.99]'
                }`}
              >
                {g.label}
              </button>
            ))}
            <button
              onClick={() => setGoalId('custom')}
              className={`rounded-2xl border px-5 py-4 text-left text-base font-medium transition ${
                goalId === 'custom'
                  ? 'border-teal bg-teal text-paper'
                  : 'border-teal/15 text-teal active:scale-[0.99]'
              }`}
            >
              Custom
            </button>
            {goalId === 'custom' && (
              <div className="flex items-center gap-3 px-1">
                <input
                  type="number"
                  min={MIN_CUSTOM_GOAL}
                  max={MAX_CUSTOM_GOAL}
                  step={0.5}
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  onBlur={(e) => setCustomPages(clampGoalPages(e.target.value))}
                  className="w-24 rounded-2xl border border-teal/15 bg-transparent px-4 py-3 text-center text-base text-teal outline-none transition focus:border-teal"
                />
                <span className="text-sm text-muted">pages per day</span>
              </div>
            )}
          </div>
          <button className="btn-primary mt-8 w-full" onClick={() => setStep(3)}>
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="w-full animate-fade-in text-left">
          <h2 className="text-center text-2xl font-semibold text-teal">
            Where would you like to start?
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm text-muted">
            New to the Qur&apos;an or picking up where you already are — your
            choice. You can change this anytime.
          </p>
          <div className="mt-8">
            <StartingPoint onApplied={(page) => setStartPage(page)} />
          </div>
          <button className="btn-ghost mt-6 w-full" onClick={() => setStep(4)}>
            Continue
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="animate-scale-in">
          <p
            className="font-arabic text-3xl leading-loose text-teal sm:text-4xl"
            dir="rtl"
            lang="ar"
          >
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="mt-4 text-sm text-muted">
            In the name of Allah, the Most Gracious, the Most Merciful.
          </p>
          <button className="btn-primary mt-12 w-full" onClick={finish}>
            Enter
          </button>
        </div>
      )}
    </div>
  )
}
