// A bottom sheet for navigating the reader: saved Bookmarks, all 30 Juz, and
// all 114 Surahs. Picking any of them jumps the reader to that page.

import { useState } from 'react'
import {
  JUZ_START_PAGES,
  SURAH_PAGES,
  SURAH_NAMES,
} from '../utils/api'
import { getBookmarks, removeBookmark } from '../utils/storage'
import { useLang } from '../utils/i18n.jsx'

export default function JumpSheet({ onJump, onClose }) {
  const { t } = useLang()
  const [tab, setTab] = useState('bookmarks')
  const [bookmarks, setBookmarks] = useState(() => getBookmarks())
  const [query, setQuery] = useState('')

  const tabs = [
    { id: 'bookmarks', label: t('jump.bookmarks') },
    { id: 'juz', label: t('jump.juz') },
    { id: 'surah', label: t('jump.surah') },
  ]

  function drop(page) {
    setBookmarks(removeBookmark(page))
  }

  // Forgiving surah search: ignore case, hyphens and apostrophes so "baqara",
  // "al-baqara" and "Al-Baqara" all match. Bare digits match the surah number.
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const nq = norm(query)
  const surahMatches = SURAH_NAMES.map((name, i) => ({ name, i })).filter(
    ({ name, i }) =>
      !nq || norm(name).includes(nq) || String(i + 1).includes(query.trim())
  )

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end bg-teal/30 backdrop-blur-sm">
      {/* tap the backdrop to close */}
      <button
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="animate-fade-in relative mx-auto flex max-h-[80vh] w-full max-w-2xl flex-col rounded-t-3xl bg-paper shadow-xl">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-base font-semibold text-teal">{t('jump.title')}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted transition active:scale-90"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* tabs */}
        <div className="mt-3 grid grid-cols-3 gap-2 px-5">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              onClick={() => {
                setTab(tb.id)
                setQuery('')
              }}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                tab === tb.id
                  ? 'bg-teal text-paper'
                  : 'bg-teal/5 text-teal active:scale-[0.99]'
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-y-auto px-5 pb-8 pt-1">
          {tab === 'bookmarks' &&
            (bookmarks.length === 0 ? (
              <p className="py-10 text-center text-sm leading-relaxed text-muted">
                {t('jump.noBookmarks')}
              </p>
            ) : (
              <ul className="divide-y divide-teal/5">
                {bookmarks.map((b) => (
                  <li key={b.page} className="flex items-center gap-3 py-1">
                    <button
                      onClick={() => onJump(b.page)}
                      className="flex grow items-center gap-3 py-2 text-left active:opacity-70"
                    >
                      <span className="flex h-9 w-12 items-center justify-center rounded-lg bg-teal/5 text-sm font-semibold text-teal">
                        {b.page}
                      </span>
                      <span className="text-sm text-teal">
                        {t('reader.page', { page: b.page })}
                      </span>
                    </button>
                    <button
                      onClick={() => drop(b.page)}
                      aria-label={t('jump.removeBookmark')}
                      className="rounded-full p-2 text-muted transition active:scale-90"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'juz' && (
            <div className="grid grid-cols-5 gap-2.5">
              {JUZ_START_PAGES.map((page, i) => (
                <button
                  key={i}
                  onClick={() => onJump(page)}
                  className="rounded-xl border border-teal/10 py-3 text-sm font-semibold text-teal transition active:scale-95"
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {tab === 'surah' && (
            <>
              <input
                type="text"
                inputMode="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('jump.searchSurah')}
                className="mb-2 w-full rounded-xl border border-teal/15 bg-transparent px-3 py-2 text-sm text-teal outline-none transition placeholder:text-muted focus:border-teal"
              />
              {surahMatches.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">
                  {t('jump.noSurahMatch')}
                </p>
              ) : (
                <ul className="divide-y divide-teal/5">
                  {surahMatches.map(({ name, i }) => (
                    <li key={i}>
                      <button
                        onClick={() => onJump(SURAH_PAGES[i])}
                        className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-70"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/5 text-xs font-semibold text-teal">
                          {i + 1}
                        </span>
                        <span className="grow text-sm text-teal">{name}</span>
                        <span className="text-xs text-muted">{SURAH_PAGES[i]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
