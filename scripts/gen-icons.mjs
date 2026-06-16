// Generates the PWA icon set (no image deps): a teal tile with a gold
// crescent + star, supersampled 4x for smooth edges. Run: npm run icons
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons')
mkdirSync(OUT, { recursive: true })

const TEAL = [27, 79, 114]
const GOLD = [201, 168, 76]
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
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0 // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- geometry --------------------------------------------------------------
function insideRoundedRect(x, y, size, cr) {
  const minX = cr
  const maxX = size - cr
  const minY = cr
  const maxY = size - cr
  const dx = Math.max(minX - x, 0, x - maxX)
  const dy = Math.max(minY - y, 0, y - maxY)
  return dx * dx + dy * dy <= cr * cr
}
function starVertices(cx, cy, outer, inner) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  return pts
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

function colorAt(x, y, o) {
  // footprint
  let base
  if (o.rounded) {
    if (!insideRoundedRect(x, y, o.size, o.cr)) return CLEAR
  }
  base = o.bg ? [o.bg[0], o.bg[1], o.bg[2], 255] : CLEAR

  const cx = o.size * 0.455
  const cy = o.size * 0.5
  const R = o.size * 0.3 * o.scale
  // crescent = outer disc minus an offset cutout disc
  const inOuter = (x - cx) ** 2 + (y - cy) ** 2 <= R * R
  const cutx = cx + R * 0.5
  const cuty = cy - R * 0.16
  const inCut = (x - cutx) ** 2 + (y - cuty) ** 2 <= (R * 0.84) ** 2
  if (inOuter && !inCut) return [o.art[0], o.art[1], o.art[2], 255]

  // star in the crescent's mouth
  if (o.star) {
    const star = starVertices(cx + R * 0.92, cy - R * 0.34, R * 0.32, R * 0.13)
    if (inPolygon(x, y, star)) return [o.art[0], o.art[1], o.art[2], 255]
  }
  return base
}

function render(size, o) {
  const SS = 4 // supersample factor
  const rgba = Buffer.alloc(size * size * 4)
  const opts = { ...o, size }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const [cr, cg, cb, ca] = colorAt(
            x + (sx + 0.5) / SS,
            y + (sy + 0.5) / SS,
            opts
          )
          const af = (ca ?? 255) / 255
          r += cr * af
          g += cg * af
          b += cb * af
          a += af
        }
      }
      const n = SS * SS
      const idx = (y * size + x) * 4
      const af = a / n
      // un-premultiply for straight-alpha PNG
      rgba[idx] = af ? Math.round(r / a) : 0
      rgba[idx + 1] = af ? Math.round(g / a) : 0
      rgba[idx + 2] = af ? Math.round(b / a) : 0
      rgba[idx + 3] = Math.round(af * 255)
    }
  }
  return encodePNG(size, size, rgba)
}

const tiles = [
  // app icons: teal rounded tile, gold crescent + star
  { file: 'icon-192.png', size: 192, o: { bg: TEAL, art: GOLD, rounded: true, cr: 192 * 0.2, scale: 1, star: true } },
  { file: 'icon-512.png', size: 512, o: { bg: TEAL, art: GOLD, rounded: true, cr: 512 * 0.2, scale: 1, star: true } },
  // maskable: full-bleed teal, art kept inside the safe zone (smaller)
  { file: 'icon-maskable-512.png', size: 512, o: { bg: TEAL, art: GOLD, rounded: false, scale: 0.72, star: true } },
  // apple touch: full-bleed teal (iOS rounds it itself)
  { file: 'apple-touch-icon.png', size: 180, o: { bg: TEAL, art: GOLD, rounded: false, scale: 1, star: true } },
  // notification badge: white silhouette on transparent
  { file: 'badge-72.png', size: 72, o: { bg: null, art: WHITE, rounded: false, scale: 1.2, star: false } },
]

for (const t of tiles) {
  writeFileSync(resolve(OUT, t.file), render(t.size, t.o))
  console.log('wrote', t.file)
}
