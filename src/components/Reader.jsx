// Reading screen. Two engines, chosen in Settings:
//  - 'mushaf': exact Madani mushaf page (QCF v2 glyph fonts)
//  - 'list':   ayah list with translation/transliteration/audio aids
// Records progress on finish either way.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPage, getMushafPage, TOTAL_PAGES, TRANSLATIONS } from '../utils/api'
import {
  getLastPage,
  getSettings,
  setSetting,
  recordPageRead,
  isBookmarked,
  toggleBookmark,
} from '../utils/storage'
import { reportRead } from '../utils/sync'
import { schedulePush } from '../utils/cloudSync'
import AyahCard from './AyahCard'
import MushafPage from './MushafPage'
import JumpSheet from './JumpSheet'
import { ensurePageFont } from '../utils/fonts'
import { useLang } from '../utils/i18n.jsx'

function Spinner() {
  const { t } = useLang()
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal/20 border-t-teal" />
      <p className="text-sm">{t('reader.loading')}</p>
    </div>
  )
}

export default function Reader() {
  const navigate = useNavigate()
  const { t } = useLang()
  const [settings, setSettings] = useState(() => getSettings())
  const mode = settings.readingView === 'list' ? 'list' : 'mushaf'

  const [page, setPage] = useState(() => getLastPage())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [playingIndex, setPlayingIndex] = useState(null)
  const [completion, setCompletion] = useState(null) // null | {justCompleted}
  const [glyphPages, setGlyphPages] = useState(() => new Set()) // QCF fonts ready
  const [showJump, setShowJump] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const audioRef = useRef(null)
  const scrollRef = useRef(null)

  // --- data loading --------------------------------------------------------
  const load = useCallback(
    async (p) => {
      setLoading(true)
      setError(false)
      stopAudio()
      try {
        const result =
          mode === 'mushaf'
            ? await getMushafPage(p)
            : await getPage(p, {
                translation: settings.showTranslation,
                translationEdition: settings.translationEdition,
                transliteration: settings.showTransliteration,
                reciter: settings.reciter,
              })
        // For the ayah list, load the QCF page fonts so each ayah renders in
        // the exact mushaf glyphs (correct tajwīd marks). Ayahs whose fonts
        // don't load fall back to the Uthmani text.
        if (mode === 'list') {
          const pages = new Set()
          for (const a of result.ayahs || []) {
            for (const w of a.words || []) pages.add(w.page)
          }
          const ready = new Set()
          await Promise.all(
            [...pages].map((pg) =>
              ensurePageFont(pg)
                .then(() => ready.add(pg))
                .catch(() => {})
            )
          )
          setGlyphPages(ready)
        }
        setData(result)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    [
      mode,
      settings.showTranslation,
      settings.translationEdition,
      settings.showTransliteration,
      settings.reciter,
    ]
  )

  useEffect(() => {
    load(page)
    scrollRef.current?.scrollTo({ top: 0 })
    setBookmarked(isBookmarked(page))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, mode, settings.translationEdition, settings.showTranslation, settings.showTransliteration, settings.reciter])

  function toggleBm() {
    toggleBookmark(page)
    setBookmarked((b) => !b)
    schedulePush()
  }

  function jumpTo(p) {
    setShowJump(false)
    if (p !== page) setPage(p)
  }

  function changeSetting(key, value) {
    setSettings(setSetting(key, value))
  }

  // A page is "already read" in this pass once you've progressed past it.
  const alreadyRead = page < getLastPage()

  // --- audio (list view only) ----------------------------------------------
  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingIndex(null)
  }

  function playIndex(index) {
    const ayahs = data?.ayahs || []
    const ayah = ayahs[index]
    if (!ayah?.audio) {
      stopAudio()
      return
    }
    if (audioRef.current) audioRef.current.pause()

    const audio = new Audio(ayah.audio)
    audioRef.current = audio
    audio.onended = () => {
      if (index + 1 < ayahs.length) playIndex(index + 1)
      else stopAudio()
    }
    audio.play().catch(() => stopAudio())
    setPlayingIndex(index)
  }

  function togglePlay(index) {
    if (playingIndex === index) stopAudio()
    else playIndex(index)
  }

  useEffect(() => () => stopAudio(), [])

  // --- view switching ------------------------------------------------------
  function switchToList() {
    const next = setSetting('readingView', 'list')
    setSettings(next)
  }

  // --- finishing a page ----------------------------------------------------
  function finishPage() {
    const result = recordPageRead(page)
    reportRead() // suppress today's remaining prayer-time reminders
    schedulePush() // back up progress to the cloud if sync is on
    stopAudio()
    if (result.justCompleted || result.khatmCompleted) setCompletion(result)
    else goToNext()
  }

  function goToNext() {
    setCompletion(null)
    // Finishing the last page wraps to page 1 to begin a new khatm.
    if (page < TOTAL_PAGES) setPage(page + 1)
    else setPage(1)
  }

  function goToPrev() {
    if (page > 1) setPage(page - 1)
  }

  // --- render --------------------------------------------------------------
  return (
    <div ref={scrollRef} className="mx-auto h-screen max-w-2xl overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-teal/5 bg-paper/90 px-5 py-4 backdrop-blur">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="rounded-full p-1.5 text-muted transition active:scale-90"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="text-center">
          <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-teal">
            {t('reader.page', { page })}
            {alreadyRead && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-gold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {t('reader.read')}
              </span>
            )}
          </p>
          {data?.surahs?.length > 0 && (
            <p className="text-xs text-muted">
              {data.surahs.map((s) => s.englishName).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex items-center">
          <button
            onClick={toggleBm}
            aria-label={bookmarked ? t('jump.removeBookmark') : t('jump.addBookmark')}
            className={`rounded-full p-1.5 transition active:scale-90 ${
              bookmarked ? 'text-gold' : 'text-muted'
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button
            onClick={() => setShowJump(true)}
            aria-label={t('jump.open')}
            className="rounded-full p-1.5 text-muted transition active:scale-90"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </button>
        </div>
      </header>

      {/* Body */}
      <main className={mode === 'mushaf' ? 'px-2 pb-28 pt-2' : 'px-5 pb-32 pt-4'}>
        {loading && <Spinner />}

        {!loading && error && (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <p className="max-w-xs text-muted">{t('reader.unable')}</p>
            <button className="btn-ghost" onClick={() => load(page)}>
              {t('reader.tryAgain')}
            </button>
          </div>
        )}

        {!loading && !error && data && mode === 'mushaf' && (
          <MushafPage page={page} lines={data.lines} onSwitch={switchToList} />
        )}

        {!loading && !error && data && mode === 'list' && (
          <>
            {settings.showTranslation && (
              <div className="mb-2 flex items-center justify-end gap-2">
                <span className="text-xs text-muted">{t('settings.translation')}</span>
                <select
                  value={settings.translationEdition}
                  onChange={(e) => changeSetting('translationEdition', e.target.value)}
                  className="rounded-xl border border-teal/15 bg-transparent px-2.5 py-1.5 text-xs text-teal outline-none transition focus:border-teal"
                >
                  {TRANSLATIONS.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {data.ayahs.map((ayah, i) => (
              <div key={ayah.number}>
                {ayah.numberInSurah === 1 && (
                  <div className="mb-2 mt-6 first:mt-0 rounded-2xl bg-teal/5 px-4 py-3 text-center">
                    <p className="font-quran text-2xl text-teal" dir="rtl" lang="ar">
                      {ayah.surahName}
                    </p>
                    <p className="mt-0.5 text-xs uppercase tracking-wide text-muted">
                      {ayah.surahEnglishName}
                    </p>
                  </div>
                )}
                {ayah.showBasmalah && (
                  <p
                    className="mb-4 mt-2 text-center font-quran text-2xl leading-loose text-teal sm:text-3xl"
                    dir="rtl"
                    lang="ar"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                )}
                <AyahCard
                  ayah={ayah}
                  size={settings.readingSize}
                  glyphs={
                    !!ayah.words?.length &&
                    ayah.words.every((w) => glyphPages.has(w.page))
                  }
                  showTranslation={settings.showTranslation}
                  showTransliteration={settings.showTransliteration}
                  showAudio={settings.showAudio}
                  isPlaying={playingIndex === i}
                  onTogglePlay={() => togglePlay(i)}
                />
              </div>
            ))}
          </>
        )}
      </main>

      {/* Bottom action bar */}
      {!loading && !error && data && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-2xl border-t border-teal/10 bg-paper/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <button
              className="btn-ghost px-3"
              onClick={goToPrev}
              disabled={page <= 1}
              aria-label={t('reader.prev')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button className="btn-primary grow whitespace-nowrap" onClick={finishPage}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {t('reader.markRead')}
            </button>
            <button
              className="btn-ghost px-3"
              onClick={goToNext}
              disabled={page >= TOTAL_PAGES}
              aria-label={t('reader.next')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Jump-to panel: bookmarks, juz, surah */}
      {showJump && <JumpSheet onJump={jumpTo} onClose={() => setShowJump(false)} />}

      {/* Completion celebration */}
      {completion && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-paper/95 px-6 backdrop-blur">
          <div className="animate-scale-in text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-3xl">
              {completion.khatmCompleted ? '🌙' : '✦'}
            </div>
            <p className="font-quran text-3xl leading-loose text-teal sm:text-4xl" dir="rtl" lang="ar">
              جَزَاكَ اللَّهُ خَيْرًا
            </p>
            {completion.khatmCompleted ? (
              <>
                <p className="mt-3 text-base font-semibold text-teal">
                  {t('reader.khatmTitle')}
                </p>
                <p className="mt-1 text-sm text-muted">{t('reader.khatmBody')}</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-base text-muted">{t('reader.rewardYou')}</p>
                <p className="mt-1 text-sm text-gold">
                  {t('reader.streak', { n: completion.streak })}
                </p>
              </>
            )}
            <div className="mt-10 flex flex-col gap-3">
              <button className="btn-primary" onClick={goToNext}>
                {t('reader.readAnother')}
              </button>
              <button className="btn-ghost" onClick={() => navigate('/')}>
                {t('reader.doneToday')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
