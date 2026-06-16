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

  const ayahs = arabicAyahs.map((a, i) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    surahNumber: a.surah?.number,
    surahName: a.surah?.name,
    surahEnglishName: a.surah?.englishName,
    arabic: a.text,
    audio: a.audio || a.audioSecondary?.[0] || null,
    translation: translationAyahs[i]?.text || null,
    transliteration: transliterationAyahs[i]?.text || null,
  }))

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
