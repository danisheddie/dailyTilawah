// A calm, once-a-day reflection on the home screen: a Qur'an verse or an
// authentic hadith with its source. Changes each day.

import { getDailyReflection } from '../data/reflections'
import { getSettings } from '../utils/storage'
import { useLang } from '../utils/i18n.jsx'

export default function DailyReflection({ className = '' }) {
  const { t } = useLang()
  const r = getDailyReflection(getSettings().reflectionMode)
  if (!r) return null

  return (
    <figure
      className={`rounded-3xl border border-teal/10 bg-teal/[0.04] px-6 py-6 text-center ${className}`}
    >
      <span className="text-[11px] uppercase tracking-[0.18em] text-gold">
        {r.type === "Qur'an" ? t('reflection.verse') : t('reflection.hadith')}
      </span>

      {r.arabic && (
        <p
          dir="rtl"
          lang="ar"
          className="mt-3 font-quran text-2xl leading-[2] text-teal"
        >
          {r.arabic}
        </p>
      )}

      <blockquote className="mt-3 text-[15px] leading-relaxed text-teal/90">
        “{r.text}”
      </blockquote>

      <figcaption className="mt-3 text-xs font-medium text-muted">
        — {r.source}
      </figcaption>
    </figure>
  )
}
