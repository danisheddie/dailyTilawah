// Renders an exact Madani mushaf page. The QCF v2 per-page font is loaded at
// runtime, then a single font size is computed so the whole page fits the
// screen — width (the densest line fills the column) and height (all lines fit
// without scrolling) — and each line is justified edge-to-edge like the print.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { mushafFontUrl } from '../utils/api'
import { useLang } from '../utils/i18n.jsx'

const BASE = 40 // px size used only for measuring natural line widths
const LINE_HEIGHT = 1.7
const MIN_FS = 12
const MAX_FS = 34
const GAP = '0.32em' // baseline spacing between words on a line
// Lines whose natural width reaches this fraction of the column are justified
// edge-to-edge; shorter ones (e.g. the last line of a passage) are centered.
const JUSTIFY_THRESHOLD = 0.7

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
  const { t } = useLang()
  const [family, setFamily] = useState(null)
  const [failed, setFailed] = useState(false)
  const [fontSize, setFontSize] = useState(null)
  const [layout, setLayout] = useState(null) // { naturals:number[], width }

  const containerRef = useRef(null)
  const lineRefs = useRef([])

  // Load the page font.
  useEffect(() => {
    let active = true
    setFamily(null)
    setFailed(false)
    setFontSize(null)
    setLayout(null)
    ensurePageFont(page)
      .then((f) => active && setFamily(f))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [page])

  // While in measuring mode (fontSize === null) the lines are laid out at BASE
  // size with words packed left, so their natural widths can be read. Pick one
  // size that fits the column width and the available height.
  useLayoutEffect(() => {
    if (!family || fontSize != null) return
    const container = containerRef.current
    if (!container) return
    const width = container.clientWidth
    const naturals = lineRefs.current.map((el) => (el ? el.scrollWidth : 0))
    const maxLine = Math.max(0, ...naturals)
    if (!maxLine || !width) return
    // Width fit: the densest line fills the column (small margin for safety).
    const byWidth = ((width * 0.97) / maxLine) * BASE
    // Height fit: all lines sit between the header and the action bar.
    const availH = window.innerHeight - 170
    const byHeight = availH / (lines.length * LINE_HEIGHT)
    setLayout({ naturals, width })
    setFontSize(Math.max(MIN_FS, Math.min(MAX_FS, byWidth, byHeight)))
  }, [family, lines, page, fontSize])

  // On resize/rotation, drop back into measuring mode to recompute the fit.
  useEffect(() => {
    function onResize() {
      setFontSize(null)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-5 py-24 text-center">
        <p className="max-w-xs text-sm text-muted">{t('reader.fontFail')}</p>
        {onSwitch && (
          <button className="btn-ghost" onClick={onSwitch}>
            {t('reader.useTranslation')}
          </button>
        )}
      </div>
    )
  }

  if (!family) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal/20 border-t-teal" />
        <p className="text-sm">{t('reader.preparing')}</p>
      </div>
    )
  }

  const measuring = fontSize == null

  return (
    <div ref={containerRef} className="mx-auto w-full max-w-xl" dir="rtl" lang="ar">
      {lines.map((line, idx) => {
        // Decide whether this line fills the column (justify) or is short
        // (center, like the last line of a passage in the printed mushaf).
        const natural = layout?.naturals[idx] || 0
        const finalWidth = natural * (fontSize / BASE)
        const fills = layout && finalWidth >= JUSTIFY_THRESHOLD * layout.width
        const justify = measuring
          ? 'flex-start'
          : fills
            ? 'space-between'
            : 'center'
        return (
          <div
            key={line.lineNumber}
            ref={(el) => (lineRefs.current[idx] = el)}
            className="flex text-teal"
            style={{
              fontFamily: family,
              fontSize: `${measuring ? BASE : fontSize}px`,
              lineHeight: LINE_HEIGHT,
              gap: GAP,
              justifyContent: justify,
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
              visibility: measuring ? 'hidden' : 'visible',
            }}
          >
            {line.words.map((w, i) => (
              <span key={i} className={w.end ? 'text-gold' : undefined}>
                {w.code}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}
