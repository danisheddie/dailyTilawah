// Renders a single ayah: Arabic (RTL), optional transliteration, translation,
// and an optional play button. Kept visually calm, like a printed mushaf.

import AudioPlayer from './AudioPlayer'

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
  const arabicSize = ARABIC_SIZE[size] || ARABIC_SIZE.m
  return (
    <article className="border-b border-teal/5 py-6 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        {showAudio && (
          <AudioPlayer
            isPlaying={isPlaying}
            isLoading={isLoadingAudio}
            disabled={!ayah.audio}
            onToggle={onTogglePlay}
          />
        )}

        {glyphs ? (
          // Exact mushaf rendering: each word in its QCF v2 page glyph; the
          // ayah-end word carries the ornate number, shown in gold.
          <p
            dir="rtl"
            lang="ar"
            className={`grow leading-[2.5] text-teal ${arabicSize}`}
          >
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
          <p
            dir="rtl"
            lang="ar"
            className={`grow font-quran leading-[2.3] text-teal ${arabicSize}`}
          >
            {ayah.arabic}{' '}
            <span className="font-arabic text-gold text-xl mx-1.5">
              ﴿{toArabicNumber(ayah.numberInSurah)}﴾
            </span>
          </p>
        )}
      </div>

      {showTransliteration && ayah.transliteration && (
        <p className="mt-3 text-sm italic leading-relaxed text-muted">
          {ayah.transliteration}
        </p>
      )}

      {showTranslation && ayah.translation && (
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          <span className="mr-1 font-semibold text-gold">
            {ayah.numberInSurah}.
          </span>
          {ayah.translation}
        </p>
      )}
    </article>
  )
}
