// Generates the PWA icon set from the master logo (assets/logo-master.png) —
// the open-Qur'an-on-a-rehal mark on a deep-navy tile. Run: npm run icons
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MASTER = resolve(ROOT, 'assets/logo-master.png')
const OUT = resolve(ROOT, 'public/icons')
mkdirSync(OUT, { recursive: true })

// Tile background navy (sampled from the master) — used to pad the maskable
// icon so the ring/art stay inside the platform's safe zone.
const NAVY = { r: 20, g: 67, b: 98, alpha: 1 }

async function resizeTo(size, file) {
  await sharp(MASTER).resize(size, size, { kernel: 'lanczos3' }).png().toFile(resolve(OUT, file))
  console.log('wrote', file)
}

// Maskable: full-bleed navy with the art scaled into the safe zone.
async function maskable(size, file, inset = 0.84) {
  const art = await sharp(MASTER)
    .resize(Math.round(size * inset), Math.round(size * inset), { kernel: 'lanczos3' })
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: art, gravity: 'center' }])
    .png()
    .toFile(resolve(OUT, file))
  console.log('wrote', file)
}

// Notification badge: white silhouette of the art on transparent (Android
// tints it). Light pixels become white; the navy tile becomes transparent.
async function badge(size, file) {
  const { data, info } = await sharp(MASTER)
    .resize(size, size, { kernel: 'lanczos3' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const out = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * info.channels]
    const g = data[i * info.channels + 1]
    const b = data[i * info.channels + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const on = lum > 140
    out[i * 4] = 255
    out[i * 4 + 1] = 255
    out[i * 4 + 2] = 255
    out[i * 4 + 3] = on ? 255 : 0
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(resolve(OUT, file))
  console.log('wrote', file)
}

await resizeTo(192, 'icon-192.png')
await resizeTo(512, 'icon-512.png')
await resizeTo(180, 'apple-touch-icon.png')
await maskable(512, 'icon-maskable-512.png')
await badge(72, 'badge-72.png')
