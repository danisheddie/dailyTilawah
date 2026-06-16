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

export default function AyahCard({
  ayah,
  showTranslation,
  showTransliteration,
  showAudio,
  isPlaying,
  onTogglePlay,
}) {
  return (
    <article className="border-b border-teal/5 py-6 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        {showAudio && (
          <AudioPlayer
            isPlaying={isPlaying}
            disabled={!ayah.audio}
            onToggle={onTogglePlay}
          />
        )}

        <p
          dir="rtl"
          lang="ar"
          className="grow font-arabic text-3xl leading-[2.4] text-teal sm:text-4xl"
        >
          {ayah.arabic}{' '}
          <span className="text-gold text-2xl align-middle">
            ﴿{toArabicNumber(ayah.numberInSurah)}﴾
          </span>
        </p>
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
