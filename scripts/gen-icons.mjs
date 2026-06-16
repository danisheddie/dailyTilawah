// Generates the PWA icon set (no image deps): a minimalist open-book mark on a
// deep-teal tile, supersampled for smooth edges. Run: npm run icons
// Pass a variant name (e.g. `node scripts/gen-icons.mjs preview`) to render
// comparison tiles into public/icons/_preview instead of the final set.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(ROOT, '../public/icons')

// Palette
const TEAL_TOP = [33, 95, 134]
const TEAL_BOT = [18, 54, 81]
const GOLD = [216, 184, 100]
const GOLD_DK = [183, 150, 74]
const WHITE = [255, 255, 255]
const CLEAR = [0, 0, 0, 0]

// --- minimal PNG encoder ---------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- geometry helpers (all in normalised 0..1 space) -----------------------
function lerp(a, b, t) {
  return a + (b - a) * t
}
function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]
}
function quad(p0, c, p1, steps, out) {
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const u = 1 - t
    out.push([
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1],
    ])
  }
}
function inPolygon(x, y, pts) {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
function insideRoundedRect(x, y, cr) {
  const dx = Math.max(cr - x, 0, x - (1 - cr))
  const dy = Math.max(cr - y, 0, y - (1 - cr))
  return dx * dx + dy * dy <= cr * cr
}

// Build the right half-page outline; the left page is its mirror. The page
// rides high at the central spine and slopes down to the outer fore-edge,
// giving the classic open-book tent silhouette. cy is the book's centre.
function buildPage(cy) {
  const spineTop = [0.5, cy - 0.2] // ridge, highest point
  const outerTop = [0.9, cy - 0.085]
  const outerBot = [0.875, cy + 0.115]
  const spineBot = [0.5, cy + 0.05] // spine sits higher than the outer edge
  const pts = []
  pts.push(spineTop)
  quad(spineTop, [0.69, cy - 0.215], outerTop, 24, pts) // convex top (page crown)
  quad(outerTop, [0.92, cy + 0.015], outerBot, 16, pts) // rounded fore-edge
  quad(outerBot, [0.7, cy + 0.075], spineBot, 24, pts) // sweep back to the spine
  pts.push(spineBot)
  return pts
}
function mirror(pts) {
  return pts.map(([x, y]) => [1 - x, y])
}

function colorAt(px, py, o) {
  if (!insideRoundedRect(px, py, o.cr)) return CLEAR
  let col = o.bg ? mix(TEAL_TOP, TEAL_BOT, py) : null

  // Scale the foreground art about the centre (keeps it inside mask safe zones).
  const nx = 0.5 + (px - 0.5) / o.scale
  const ny = 0.5 + (py - 0.5) / o.scale
  const cy = o.bookCY

  // Crescent above the book (optional).
  if (o.crescent) {
    const ccx = 0.5
    const ccy = o.bookCY - 0.305
    const R = 0.092
    const inOuter = (nx - ccx) ** 2 + (ny - ccy) ** 2 <= R * R
    const inCut = (nx - (ccx + R * 0.42)) ** 2 + (ny - (ccy - R * 0.12)) ** 2 <= (R * 0.86) ** 2
    if (inOuter && !inCut) col = o.art
  }

  // Open book.
  const inBook = inPolygon(nx, ny, o.right) || inPolygon(nx, ny, o.left)
  if (inBook) {
    col = o.art
    // spine gap
    if (Math.abs(nx - 0.5) < 0.01 && ny > cy - 0.2 && ny < cy + 0.05) {
      col = o.bg ? mix(TEAL_TOP, TEAL_BOT, py) : CLEAR
    }
    // page text lines
    if (o.lines) {
      for (let li = 0; li < 3; li++) {
        const ly = cy - 0.07 + li * 0.07
        if (Math.abs(ny - ly) < 0.0145) {
          const onLeft = nx > 0.155 && nx < 0.44
          const onRight = nx > 0.56 && nx < 0.845
          if (onLeft || onRight) col = GOLD_DK
        }
      }
    }
  }

  return col ? [col[0], col[1], col[2], 255] : CLEAR
}

function render(size, o) {
  const SS = 4
  const cr = o.cr
  const rgba = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = colorAt((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size, o)
          const af = (c[3] ?? 255) / 255
          r += c[0] * af
          g += c[1] * af
          b += c[2] * af
          a += af
        }
      }
      const idx = (y * size + x) * 4
      rgba[idx] = a ? Math.round(r / a) : 0
      rgba[idx + 1] = a ? Math.round(g / a) : 0
      rgba[idx + 2] = a ? Math.round(b / a) : 0
      rgba[idx + 3] = Math.round((a / (SS * SS)) * 255)
    }
  }
  return encodePNG(size, size, rgba)
}

// Compose the per-render options (precompute page polygons).
function opts({ bg = true, art = GOLD, crescent = false, lines = true, bookCY = 0.5, cr = 0.2, scale = 1 }) {
  const right = buildPage(bookCY)
  return { bg, art, crescent, lines, bookCY, cr, scale, right, left: mirror(right) }
}

const mode = process.argv[2]

if (mode === 'preview') {
  const dir = resolve(OUT, '_preview')
  mkdirSync(dir, { recursive: true })
  const variants = {
    'A-clean': opts({ bookCY: 0.5, lines: false }),
    'B-lines': opts({ bookCY: 0.5, lines: true }),
    'C-crescent': opts({ bookCY: 0.56, crescent: true, lines: false }),
    'D-crescent-lines': opts({ bookCY: 0.56, crescent: true, lines: true }),
  }
  for (const [name, o] of Object.entries(variants)) {
    writeFileSync(resolve(dir, `${name}.png`), render(256, o))
    console.log('wrote preview', name)
  }
} else {
  mkdirSync(OUT, { recursive: true })
  // Book + crescent on a deep-teal tile; no internal lines (cleaner).
  const main = (cr, scale = 1) => opts({ bookCY: 0.56, crescent: true, lines: false, cr, scale })
  const tiles = [
    { file: 'icon-192.png', size: 192, o: main(0.2) },
    { file: 'icon-512.png', size: 512, o: main(0.2) },
    // maskable: full-bleed square tile (cr 0), art scaled into the safe zone
    { file: 'icon-maskable-512.png', size: 512, o: main(0, 0.78) },
    // apple-touch: full-bleed square; iOS applies its own rounded mask
    { file: 'apple-touch-icon.png', size: 180, o: main(0, 1) },
    // notification badge: simple white book silhouette on transparent
    { file: 'badge-72.png', size: 72, o: opts({ bg: false, art: WHITE, crescent: false, lines: false, bookCY: 0.5, cr: 0.5 }) },
  ]
  for (const t of tiles) {
    writeFileSync(resolve(OUT, t.file), render(t.size, t.o))
    console.log('wrote', t.file)
  }
}
