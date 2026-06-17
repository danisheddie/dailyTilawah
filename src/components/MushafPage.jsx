// Renders an exact Madani mushaf page: the QCF v2 per-page font is loaded at
// runtime, then each of the page's lines is laid out justified (RTL) so the
// result is line-for-line faithful to the printed mushaf.

import { useEffect, useState } from 'react'
import { mushafFontUrl } from '../utils/api'

// Load (once) the QCF v2 font for a page and resolve when it's ready.
async function ensurePageFont(page) {
  const family = `qcf2p${page}`
  if ([...document.fonts].some((f) => f.family === family)) return family
  const face = new FontFace(family, `url(${mushafFontUrl(page)})`, {
    display: 'swap',
  })
  await face.load()
  document.fonts.add(face)
  return family
}

export default function MushafPage({ page, lines, onSwitch }) {
  const [family, setFamily] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    setFamily(null)
    setFailed(false)
    ensurePageFont(page)
      .then((f) => active && setFamily(f))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [page])

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-5 py-24 text-center">
        <p className="max-w-xs text-sm text-muted">
          Couldn’t load the mushaf font for this page. The Translation view works
          offline of these fonts.
        </p>
        {onSwitch && (
          <button className="btn-ghost" onClick={onSwitch}>
            Use Translation view
          </button>
        )}
      </div>
    )
  }

  if (!family) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal/20 border-t-teal" />
        <p className="text-sm">Preparing the mushaf…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-1 py-2" dir="rtl" lang="ar">
      {lines.map((line) => (
        <div
          key={line.lineNumber}
          className="flex justify-between text-teal"
          style={{
            fontFamily: family,
            fontSize: 'clamp(22px, 7.2vw, 30px)',
            lineHeight: 2.35,
            // Justify each line edge-to-edge like the printed page.
            textAlignLast: 'justify',
          }}
        >
          {line.words.map((w, i) => (
            <span key={i} className={w.end ? 'text-gold' : undefined}>
              {w.code}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
