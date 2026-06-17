// Reading screen. Two engines, chosen in Settings:
//  - 'mushaf': exact Madani mushaf page (QCF v2 glyph fonts)
//  - 'list':   ayah list with translation/transliteration/audio aids
// Records progress on finish either way.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPage, getMushafPage, TOTAL_PAGES } from '../utils/api'
import { getLastPage, getSettings, setSetting, recordPageRead } from '../utils/storage'
import { reportRead } from '../utils/sync'
import { schedulePush } from '../utils/cloudSync'
import AyahCard from './AyahCard'
import MushafPage from './MushafPage'

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal/20 border-t-teal" />
      <p className="text-sm">Loading…</p>
    </div>
  )
}

export default function Reader() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(() => getSettings())
  const mode = settings.readingView === 'list' ? 'list' : 'mushaf'

  const [page, setPage] = useState(() => getLastPage())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [playingIndex, setPlayingIndex] = useState(null)
  const [completion, setCompletion] = useState(null) // null | {justCompleted}

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
                transliteration: settings.showTransliteration,
              })
        setData(result)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    },
    [mode, settings.showTranslation, settings.showTransliteration]
  )

  useEffect(() => {
    load(page)
    scrollRef.current?.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, mode])

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
    if (result.justCompleted) setCompletion(result)
    else goToNext()
  }

  function goToNext() {
    setCompletion(null)
    if (page < TOTAL_PAGES) setPage(page + 1)
    else navigate('/')
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
          <p className="text-sm font-semibold text-teal">Page {page}</p>
          {data?.surahs?.length > 0 && (
            <p className="text-xs text-muted">
              {data.surahs.map((s) => s.englishName).join(' · ')}
            </p>
          )}
        </div>
        <span className="w-[34px]" aria-hidden="true" />
      </header>

      {/* Body */}
      <main className={mode === 'mushaf' ? 'px-2 pb-28 pt-2' : 'px-5 pb-32 pt-4'}>
        {loading && <Spinner />}

        {!loading && error && (
          <div className="flex flex-col items-center gap-5 py-24 text-center">
            <p className="max-w-xs text-muted">
              Unable to load. Please check your connection.
            </p>
            <button className="btn-ghost" onClick={() => load(page)}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && data && mode === 'mushaf' && (
          <MushafPage page={page} lines={data.lines} onSwitch={switchToList} />
        )}

        {!loading && !error && data && mode === 'list' && (
          <>
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
          <div className="flex items-center gap-3">
            <button className="btn-ghost px-4" onClick={goToPrev} disabled={page <= 1}>
              Prev
            </button>
            <button className="btn-primary grow" onClick={finishPage}>
              Mark page as read
            </button>
            <button
              className="btn-ghost px-4"
              onClick={goToNext}
              disabled={page >= TOTAL_PAGES}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Completion celebration */}
      {completion && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-paper/95 px-6 backdrop-blur">
          <div className="animate-scale-in text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-3xl">
              ✦
            </div>
            <p className="font-quran text-3xl leading-loose text-teal sm:text-4xl" dir="rtl" lang="ar">
              جَزَاكَ اللَّهُ خَيْرًا
            </p>
            <p className="mt-3 text-base text-muted">May Allah reward you.</p>
            <p className="mt-1 text-sm text-gold">{completion.streak}-day streak</p>
            <div className="mt-10 flex flex-col gap-3">
              <button className="btn-primary" onClick={goToNext}>
                Read another page
              </button>
              <button className="btn-ghost" onClick={() => navigate('/')}>
                Done for today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
