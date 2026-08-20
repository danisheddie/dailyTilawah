// Renders a single ayah: Arabic (RTL, dominant), optional transliteration and
// translation (visually secondary), and a subtle "Listen" action below — no
// standalone circular button. Kept editorial and calm, like a printed mushaf.

import { useLang } from '../utils/i18n.jsx'

// Arabic-Indic numerals for the in-text ayah marker.
function toArabicNumber(n) {
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return String(n)
    .split('')
    .map((d) => map[Number(d)] ?? d)
    .join('')
}

const ARABIC_SIZE = {
  s: 'text-2xl sm:text-3xl',
  m: 'text-3xl sm:text-4xl',
  l: 'text-4xl sm:text-5xl',
}

export default function AyahCard({
  ayah,
  showTranslation,
  showTransliteration,
  showAudio,
  isPlaying,
  isLoadingAudio,
  onTogglePlay,
  glyphs, // true once the QCF page fonts for this ayah's words are loaded
  size = 'm',
}) {
  const { t } = useLang()
  const arabicSize = ARABIC_SIZE[size] || ARABIC_SIZE.m
  return (
    <article className="border-b border-teal/[0.06] py-7 last:border-b-0">
      {glyphs ? (
        // Exact mushaf rendering: each word in its QCF v2 page glyph; the
        // ayah-end word carries the ornate number, shown in gold.
        <p dir="rtl" lang="ar" className={`leading-[2.7] text-teal ${arabicSize}`}>
          {ayah.words.map((w, i) => (
            <span
              key={i}
              style={{ fontFamily: `qcf2p${w.page}` }}
              className={w.end ? 'text-gold' : undefined}
            >
              {w.code}
              {i < ayah.words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>
      ) : (
        <p dir="rtl" lang="ar" className={`font-quran leading-[2.5] text-teal ${arabicSize}`}>
          {ayah.arabic}{' '}
          <span className="font-arabic text-xl text-gold mx-1.5">
            ﴿{toArabicNumber(ayah.numberInSurah)}﴾
          </span>
        </p>
      )}

      {showTransliteration && ayah.transliteration && (
        <p className="mt-4 text-sm italic leading-relaxed text-muted">
          {ayah.transliteration}
        </p>
      )}

      {showTranslation && ayah.translation && (
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          <span className="mr-1.5 text-xs font-semibold text-gold">
            {ayah.numberInSurah}
          </span>
          {ayah.translation}
        </p>
      )}

      {showAudio && (
        <div className="mt-3.5 flex justify-end">
          <button
            onClick={onTogglePlay}
            disabled={!ayah.audio}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition active:scale-95 disabled:opacity-40 ${
              isPlaying || isLoadingAudio ? 'text-gold' : 'text-muted'
            }`}
          >
            {isLoadingAudio ? (
              <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            ) : isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5.14v13.72a1 1 0 0 0 1.5.87l11-6.86a1 1 0 0 0 0-1.74l-11-6.86A1 1 0 0 0 8 5.14Z" />
              </svg>
            )}
            {isPlaying ? t('reader.pause') : t('reader.listen')}
          </button>
        </div>
      )}
    </article>
  )
}
