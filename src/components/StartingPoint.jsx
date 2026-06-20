// Lets the user set where their daily reading resumes — pick a surah and
// ayah (resolved to its mushaf page), or start from the very beginning.
// Used both during onboarding and in Settings.

import { useState } from 'react'
import { SURAH_NAMES, SURAH_AYAHS, getAyahPage } from '../utils/api'
import { useLang } from '../utils/i18n.jsx'

export default function StartingPoint({ onApplied }) {
  const { t } = useLang()
  const [surah, setSurah] = useState(1)
  const [ayah, setAyah] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [done, setDone] = useState(null) // null | { page, label }
  const [confirmBeginning, setConfirmBeginning] = useState(false)

  const maxAyah = SURAH_AYAHS[surah - 1] || 286

  function chooseSurah(n) {
    setSurah(n)
    setAyah(1)
    setDone(null)
  }

  async function apply() {
    setBusy(true)
    setError(false)
    try {
      const a = Math.min(Math.max(1, ayah || 1), maxAyah)
      const page = await getAyahPage(surah, a)
      onApplied?.(page)
      setDone({ page, label: `${SURAH_NAMES[surah - 1]} ${surah}:${a}` })
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  function startFromBeginning() {
    onApplied?.(1)
    setDone({ page: 1, label: t('start.beginning') })
    setConfirmBeginning(false)
  }

  return (
    <div>
      <div className="flex gap-3">
        <select
          value={surah}
          onChange={(e) => chooseSurah(Number(e.target.value))}
          className="grow rounded-2xl border border-teal/15 bg-transparent px-4 py-3 text-sm text-teal outline-none transition focus:border-teal"
        >
          {SURAH_NAMES.map((name, i) => (
            <option key={i} value={i + 1}>
              {i + 1}. {name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={maxAyah}
          value={ayah}
          onChange={(e) => {
            setAyah(Number(e.target.value))
            setDone(null)
          }}
          aria-label={t('start.ayahLabel')}
          className="w-20 rounded-2xl border border-teal/15 bg-transparent px-3 py-3 text-center text-sm text-teal outline-none transition focus:border-teal"
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">{t('start.ayahRange', { max: maxAyah })}</p>

      <button
        className="btn-primary mt-4 w-full"
        onClick={apply}
        disabled={busy}
      >
        {busy ? t('start.finding') : t('start.set')}
      </button>

      {!confirmBeginning ? (
        <button
          className="mt-3 w-full text-center text-sm text-muted underline-offset-2 hover:underline"
          onClick={() => setConfirmBeginning(true)}
          disabled={busy}
        >
          {t('start.orBeginning')}
        </button>
      ) : (
        <div className="mt-3 rounded-2xl border border-teal/15 bg-teal/5 p-4 text-center">
          <p className="text-xs leading-relaxed text-muted">
            {t('start.beginningConfirm')}
          </p>
          <div className="mt-3 flex gap-3">
            <button
              className="btn-ghost grow px-4 py-2 text-sm"
              onClick={() => setConfirmBeginning(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              className="btn-primary grow px-4 py-2 text-sm"
              onClick={startFromBeginning}
            >
              {t('start.confirmBeginning')}
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted/80">
        {t('start.dataNote')}
      </p>

      {error && (
        <p className="mt-3 text-center text-sm text-red-500">{t('start.fail')}</p>
      )}
      {done && (
        <p className="mt-3 text-center text-sm text-teal">
          {t('start.setTo', { label: done.label, page: done.page })}
        </p>
      )}
    </div>
  )
}
