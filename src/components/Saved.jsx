// Saved: the reader's bookmarks, as a calm list. Each row opens that page in
// the reader. Empty by default — a gentle prompt points to how to save.

import { useNavigate } from 'react-router-dom'
import { getBookmarks, setLastPage } from '../utils/storage'
import { SURAH_PAGES, SURAH_NAMES } from '../utils/api'
import { useLang } from '../utils/i18n.jsx'

function surahForPage(page) {
  let idx = 0
  for (let i = 0; i < SURAH_PAGES.length; i++) {
    if (SURAH_PAGES[i] <= page) idx = i
    else break
  }
  return SURAH_NAMES[idx] || SURAH_NAMES[0]
}

export default function Saved() {
  const navigate = useNavigate()
  const { t } = useLang()
  const bookmarks = getBookmarks()

  const open = (page) => {
    setLastPage(page)
    navigate('/read')
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-md px-6 pb-28 pt-8">
      <header className="mb-6">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-teal">
          {t('saved.title')}
        </h1>
        <p className="mt-0.5 t-body">{t('saved.subtitle')}</p>
      </header>

      {bookmarks.length === 0 ? (
        <div className="mt-16 flex flex-col items-center px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal/[0.05]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-gold" aria-hidden="true">
              <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
            </svg>
          </div>
          <p className="mt-5 t-body">{t('saved.empty')}</p>
          <button className="btn-ghost mt-6" onClick={() => navigate('/read')}>
            {t('saved.browse')}
          </button>
        </div>
      ) : (
        <ul className="card divide-y divide-teal/[0.06] px-4">
          {bookmarks.map((b) => (
            <li key={b.page}>
              <button className="row" onClick={() => open(b.page)}>
                <span className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/[0.06] text-[13px] font-semibold text-teal">
                    {b.page}
                  </span>
                  <span>
                    <span className="block font-display text-[15px] font-semibold text-teal">
                      {surahForPage(b.page)}
                    </span>
                    <span className="block t-caption">{t('reader.page', { page: b.page })}</span>
                  </span>
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
