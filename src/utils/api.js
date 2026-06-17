// All alquran.cloud API access. Results are normalised into a flat ayah
// list and cached in sessionStorage to avoid redundant network calls.

const BASE = 'https://api.alquran.cloud/v1'

// Edition identifiers used by the app.
const ARABIC = 'ar.alafasy' // Arabic text + Mishary Alafasy audio
const TRANSLATION = 'en.asad'
const TRANSLITERATION = 'en.transliteration'

export const TOTAL_PAGES = 604

function cacheKey(page, editions) {
  return `tilawah:page:${page}:${editions.join(',')}`
}

// Fetch a single mushaf page, optionally with translation/transliteration.
// Returns { page, surahs, ayahs } where each ayah is fully normalised.
export async function getPage(page, opts = {}) {
  const editions = [ARABIC]
  if (opts.translation) editions.push(TRANSLATION)
  if (opts.transliteration) editions.push(TRANSLITERATION)

  const key = cacheKey(page, editions)
  const cached = sessionStorage.getItem(key)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      /* fall through to refetch */
    }
  }

  // The page endpoint serves a single edition per request (unlike surah/ayah,
  // it has no /editions/ multiplexing), so fetch each edition in parallel and
  // zip the ayahs together by index.
  const editionsData = await Promise.all(
    editions.map(async (edition) => {
      const url = `${BASE}/page/${page}/${edition}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Request failed (${res.status})`)

      const json = await res.json()
      if (json.code !== 200 || !json.data || !Array.isArray(json.data.ayahs)) {
        throw new Error('Unexpected response from the Quran service.')
      }
      return json.data
    })
  )

  const result = normalise(editionsData, page)
  try {
    sessionStorage.setItem(key, JSON.stringify(result))
  } catch {
    /* sessionStorage full — non-fatal */
  }
  return result
}

// The Arabic editions prepend the basmalah to the first ayah of every surah
// except Al-Faatiha (where it is ayah 1) and At-Tawba (which has none). Split
// it off so the reader can show it as its own centered line above "الٓمٓ" etc.
// The basmalah is exactly four words; only a leading basmalah produces a first
// word whose letters are بسم, so this is safe to detect and strip.
function splitBasmalah(text, surahNumber, numberInSurah) {
  if (numberInSurah !== 1 || surahNumber === 1 || surahNumber === 9) {
    return { text, showBasmalah: false }
  }
  const words = text.trim().split(/\s+/)
  const firstWordLetters = words[0]?.replace(/[^ء-ي]/g, '')
  if (words.length > 4 && firstWordLetters === 'بسم') {
    return { text: words.slice(4).join(' '), showBasmalah: true }
  }
  return { text, showBasmalah: false }
}

// Each per-edition page response carries the same ayahs in the same order.
// Zip them together by index.
function normalise(editionsData, page) {
  const byIdentifier = {}
  editionsData.forEach((ed) => {
    byIdentifier[ed.edition.identifier] = ed.ayahs
  })

  const arabicAyahs = byIdentifier[ARABIC] || []
  const translationAyahs = byIdentifier[TRANSLATION] || []
  const transliterationAyahs = byIdentifier[TRANSLITERATION] || []

  const ayahs = arabicAyahs.map((a, i) => {
    const surahNumber = a.surah?.number
    const { text, showBasmalah } = splitBasmalah(a.text, surahNumber, a.numberInSurah)
    return {
      number: a.number,
      numberInSurah: a.numberInSurah,
      surahNumber,
      surahName: a.surah?.name,
      surahEnglishName: a.surah?.englishName,
      arabic: text,
      showBasmalah,
      audio: a.audio || a.audioSecondary?.[0] || null,
      translation: translationAyahs[i]?.text || null,
      transliteration: transliterationAyahs[i]?.text || null,
    }
  })

  // Distinct surahs appearing on this page, for section headers.
  const surahs = []
  ayahs.forEach((a) => {
    if (!surahs.some((s) => s.number === a.surahNumber)) {
      surahs.push({
        number: a.surahNumber,
        name: a.surahName,
        englishName: a.surahEnglishName,
      })
    }
  })

  return { page, surahs, ayahs }
}

// --- exact Madani mushaf (QCF v2 page glyphs) ------------------------------
// quran.com's word-by-word data carries per-word PUA glyph codes (`code_v2`)
// that render as the printed Madani mushaf when shown in the matching per-page
// font. We group words into the page's 15 lines for a faithful layout.

const QURAN_API = 'https://api.quran.com/api/v4'

// Per-page QCF v2 font file. Centralised so it's a one-line change if the CDN
// path differs. The @font-face family is assigned by MushafPage as `qcf2p<n>`.
export function mushafFontUrl(page) {
  // jsDelivr mirror of the verified QCF v2 page fonts, pinned to a branch so
  // the path resolves reliably. Lazy-loaded one page at a time.
  return `https://cdn.jsdelivr.net/gh/quran/quran.com-frontend-next@master/public/fonts/quran/hafs/v2/woff2/p${page}.woff2`
}

export async function getMushafPage(page) {
  const key = `tilawah:mushaf:${page}`
  const cached = sessionStorage.getItem(key)
  if (cached) {
    try {
      return JSON.parse(cached)
    } catch {
      /* refetch */
    }
  }

  const url =
    `${QURAN_API}/verses/by_page/${page}` +
    `?words=true&per_page=300&fields=chapter_id` +
    `&word_fields=code_v2,line_number,page_number,char_type_name`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  const json = await res.json()
  const verses = json?.verses
  if (!Array.isArray(verses) || verses.length === 0) {
    throw new Error('Unexpected response from the Quran service.')
  }

  // Flatten words, then group by their line number (1..15) preserving order.
  const lineMap = new Map()
  const chapterIds = new Set()
  for (const v of verses) {
    if (v.chapter_id) chapterIds.add(v.chapter_id)
    for (const w of v.words || []) {
      const ln = w.line_number || 0
      if (!lineMap.has(ln)) lineMap.set(ln, [])
      lineMap.get(ln).push({
        code: w.code_v2 || w.text || '',
        end: w.char_type_name === 'end',
      })
    }
  }
  const lines = [...lineMap.keys()]
    .sort((a, b) => a - b)
    .map((ln) => ({ lineNumber: ln, words: lineMap.get(ln) }))

  const surahs = [...chapterIds].sort((a, b) => a - b).map((id) => ({
    number: id,
    englishName: SURAH_NAMES[id - 1] || `Surah ${id}`,
  }))

  const result = { page, lines, surahs }
  try {
    sessionStorage.setItem(key, JSON.stringify(result))
  } catch {
    /* non-fatal */
  }
  return result
}

// English (transliterated) surah names, indexed 0 → Surah 1, for page headers.
const SURAH_NAMES = [
  'Al-Faatiha', 'Al-Baqara', 'Aal-i-Imraan', 'An-Nisaa', 'Al-Maaida',
  "Al-An'aam", "Al-A'raaf", 'Al-Anfaal', 'At-Tawba', 'Yunus', 'Hud', 'Yusuf',
  "Ar-Ra'd", 'Ibrahim', 'Al-Hijr', 'An-Nahl', 'Al-Israa', 'Al-Kahf', 'Maryam',
  'Taa-Haa', 'Al-Anbiyaa', 'Al-Hajj', "Al-Mu'minoon", 'An-Noor', 'Al-Furqaan',
  "Ash-Shu'araa", 'An-Naml', 'Al-Qasas', 'Al-Ankaboot', 'Ar-Room', 'Luqman',
  'As-Sajda', 'Al-Ahzaab', 'Saba', 'Faatir', 'Yaseen', 'As-Saaffaat', 'Saad',
  'Az-Zumar', 'Ghafir', 'Fussilat', 'Ash-Shura', 'Az-Zukhruf', 'Ad-Dukhaan',
  'Al-Jaathiya', 'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujuraat', 'Qaaf',
  'Adh-Dhaariyat', 'At-Toor', 'An-Najm', 'Al-Qamar', 'Ar-Rahmaan',
  'Al-Waaqia', 'Al-Hadid', 'Al-Mujaadila', 'Al-Hashr', 'Al-Mumtahana',
  'As-Saff', "Al-Jumu'a", 'Al-Munaafiqoon', 'At-Taghaabun', 'At-Talaaq',
  'At-Tahrim', 'Al-Mulk', 'Al-Qalam', 'Al-Haaqqa', "Al-Ma'aarij", 'Nooh',
  'Al-Jinn', 'Al-Muzzammil', 'Al-Muddaththir', 'Al-Qiyaama', 'Al-Insaan',
  'Al-Mursalaat', 'An-Naba', "An-Naazi'aat", 'Abasa', 'At-Takwir',
  'Al-Infitaar', 'Al-Mutaffifin', 'Al-Inshiqaaq', 'Al-Burooj', 'At-Taariq',
  "Al-A'laa", 'Al-Ghaashiya', 'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Lail',
  'Ad-Dhuhaa', 'Ash-Sharh', 'At-Tin', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyina',
  'Az-Zalzala', 'Al-Aadiyaat', 'Al-Qaari’a', 'At-Takaathur', "Al-'Asr",
  'Al-Humaza', 'Al-Fil', 'Quraish', "Al-Maa'un", 'Al-Kawthar', 'Al-Kaafiroon',
  'An-Nasr', 'Al-Masad', 'Al-Ikhlaas', 'Al-Falaq', 'An-Naas',
]
