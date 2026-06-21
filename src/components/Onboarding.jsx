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
import { useLang } from '../utils/i18n.jsx'

export default function Onboarding({ onDone }) {
  const navigate = useNavigate()
  const { t } = useLang()
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

  // Steps 1–4 carry a small back control and progress dots so the flow feels
  // navigable, not a one-way chute. The welcome screen (0) stays clean.
  const TOTAL_STEPS = 4

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      {step >= 1 && (
        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-md items-center justify-between px-6 pt-6">
          <button
            onClick={() => setStep(step - 1)}
            aria-label={t('common.back')}
            className="rounded-full p-1.5 text-muted transition active:scale-90"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i + 1 === step ? 'w-5 bg-teal' : 'w-1.5 bg-teal/20'
                }`}
              />
            ))}
          </div>
          <span className="w-8" aria-hidden="true" />
        </div>
      )}

      {step === 0 && (
        <div className="animate-fade-in">
          <p className="font-arabic text-2xl text-gold" dir="rtl" lang="ar">
            تِلَاوَة
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-teal">
            Tilawah
          </h1>
          <p className="mt-4 text-lg text-muted">{t('common.appTagline')}</p>
          <p className="mx-auto mt-8 max-w-xs text-sm leading-relaxed text-muted">
            {t('onboarding.welcomeBody')}
          </p>
          <button className="btn-primary mt-10 w-full" onClick={() => setStep(1)}>
            {t('onboarding.begin')}
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="w-full animate-fade-in">
          <h2 className="text-2xl font-semibold text-teal">
            {t('onboarding.nameTitle')}
          </h2>
          <p className="mt-2 text-sm text-muted">{t('onboarding.nameSub')}</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) setStep(2)
            }}
            placeholder={t('onboarding.namePlaceholder')}
            autoFocus
            maxLength={40}
            className="mt-8 w-full rounded-2xl border border-teal/15 bg-transparent px-5 py-4 text-center text-lg text-teal outline-none transition placeholder:text-muted/60 focus:border-teal"
          />
          <button
            className="btn-primary mt-8 w-full disabled:opacity-40"
            disabled={!name.trim()}
            onClick={() => setStep(2)}
          >
            {t('common.continue')}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full animate-fade-in">
          <h2 className="text-2xl font-semibold text-teal">
            {t('onboarding.goalTitle')}
          </h2>
          <p className="mt-2 text-sm text-muted">{t('onboarding.goalSub')}</p>
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
                {t('goal.' + g.id)}
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
              {t('goal.custom')}
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
                <span className="text-sm text-muted">{t('goal.pagesPerDay')}</span>
              </div>
            )}
          </div>
          <button className="btn-primary mt-8 w-full" onClick={() => setStep(3)}>
            {t('common.continue')}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="w-full animate-fade-in text-left">
          <h2 className="text-center text-2xl font-semibold text-teal">
            {t('onboarding.startTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm text-muted">
            {t('onboarding.startSub')}
          </p>
          <div className="mt-8">
            <StartingPoint onApplied={(page) => setStartPage(page)} />
          </div>
          <button className="btn-ghost mt-6 w-full" onClick={() => setStep(4)}>
            {t('common.continue')}
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
            {t('onboarding.bismillahMeaning')}
          </p>
          <button className="btn-primary mt-12 w-full" onClick={finish}>
            {t('onboarding.enter')}
          </button>
        </div>
      )}
    </div>
  )
}
