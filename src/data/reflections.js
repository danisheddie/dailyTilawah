// A small curated set of Qur'an verses and authentic (Sahih/Hasan) hadith,
// each with its source, shown one-per-day on the home screen. The selection is
// deterministic per calendar day, so it's stable through the day and rotates.
//
// Sourcing notes: hadith are limited to Sahih al-Bukhari / Sahih Muslim (sahih
// by consensus) and a few from the Sunan graded sahih/hasan-sahih, with the
// collection and number cited so they can be verified.

import { todayISO } from '../utils/dateUtils'

const QURAN = [
  {
    type: "Qur'an",
    arabic: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ',
    text: 'So remember Me; I will remember you.',
    source: "Qur'an 2:152",
  },
  {
    type: "Qur'an",
    arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا',
    text: 'Indeed, with hardship comes ease.',
    source: "Qur'an 94:6",
  },
  {
    type: "Qur'an",
    arabic: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ',
    text: 'Unquestionably, by the remembrance of Allah hearts are assured.',
    source: "Qur'an 13:28",
  },
  {
    type: "Qur'an",
    arabic: 'إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ',
    text: 'Indeed, Allah is with the patient.',
    source: "Qur'an 2:153",
  },
  {
    type: "Qur'an",
    arabic: 'ٱدْعُونِىٓ أَسْتَجِبْ لَكُمْ',
    text: 'Call upon Me; I will respond to you.',
    source: "Qur'an 40:60",
  },
  {
    type: "Qur'an",
    text: 'And whoever fears Allah — He will make for him a way out, and will provide for him from where he does not expect.',
    source: "Qur'an 65:2–3",
  },
  {
    type: "Qur'an",
    text: 'Allah does not burden a soul beyond that it can bear.',
    source: "Qur'an 2:286",
  },
  {
    type: "Qur'an",
    text: 'Indeed, the prayer prohibits immorality and wrongdoing.',
    source: "Qur'an 29:45",
  },
  {
    type: "Qur'an",
    text: 'And seek help through patience and prayer.',
    source: "Qur'an 2:45",
  },
  {
    type: "Qur'an",
    text: 'My mercy encompasses all things.',
    source: "Qur'an 7:156",
  },
  {
    type: "Qur'an",
    text: 'And He found you lost and guided you.',
    source: "Qur'an 93:7",
  },
  {
    type: "Qur'an",
    text: 'Indeed, Allah loves those who rely upon Him.',
    source: "Qur'an 3:159",
  },
]

const HADITH = [
  {
    type: 'Hadith',
    text: 'Actions are but by intentions, and every person will have only what they intended.',
    source: 'Sahih al-Bukhari 1; Sahih Muslim 1907',
  },
  {
    type: 'Hadith',
    text: 'The most beloved of deeds to Allah are those done consistently, even if they are few.',
    source: 'Sahih al-Bukhari 6464; Sahih Muslim 783',
  },
  {
    type: 'Hadith',
    text: 'The best of you are those who learn the Qur’an and teach it.',
    source: 'Sahih al-Bukhari 5027',
  },
  {
    type: 'Hadith',
    text: 'Whoever travels a path in search of knowledge, Allah will make easy for him a path to Paradise.',
    source: 'Sahih Muslim 2699',
  },
  {
    type: 'Hadith',
    text: 'None of you truly believes until he loves for his brother what he loves for himself.',
    source: 'Sahih al-Bukhari 13; Sahih Muslim 45',
  },
  {
    type: 'Hadith',
    text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
    source: 'Sahih al-Bukhari 6018; Sahih Muslim 47',
  },
  {
    type: 'Hadith',
    text: 'Allah is gentle and loves gentleness in all matters.',
    source: 'Sahih al-Bukhari 6927; Sahih Muslim 2165',
  },
  {
    type: 'Hadith',
    text: 'Make things easy and do not make them difficult; give glad tidings and do not repel people.',
    source: 'Sahih al-Bukhari 69',
  },
  {
    type: 'Hadith',
    text: 'Richness is not in having many possessions; rather, true richness is the richness of the soul.',
    source: 'Sahih al-Bukhari 6446; Sahih Muslim 1051',
  },
  {
    type: 'Hadith',
    text: 'He who is not merciful to people, Allah will not be merciful to him.',
    source: 'Sahih al-Bukhari 7376; Sahih Muslim 2319',
  },
  {
    type: 'Hadith',
    text: 'A good word is charity.',
    source: 'Sahih al-Bukhari 2989; Sahih Muslim 1009',
  },
  {
    type: 'Hadith',
    text: 'Fear Allah wherever you are; follow a bad deed with a good one and it will erase it; and treat people with good character.',
    source: 'Jami` at-Tirmidhi 1987 (hasan sahih)',
  },
  {
    type: 'Hadith',
    text: 'The most complete of believers in faith are those with the best character.',
    source: 'Jami` at-Tirmidhi 1162 (hasan sahih)',
  },
  {
    type: 'Hadith',
    text: 'Whoever reads a letter from the Book of Allah earns a good deed, and each good deed is multiplied ten times.',
    source: 'Jami` at-Tirmidhi 2910 (hasan sahih)',
  },
]

// Interleave verses and hadith so consecutive days alternate between the two.
function interleave(a, b) {
  const out = []
  const n = Math.max(a.length, b.length)
  for (let i = 0; i < n; i++) {
    if (i < a.length) out.push(a[i])
    if (i < b.length) out.push(b[i])
  }
  return out
}

export const REFLECTIONS = interleave(QURAN, HADITH)

// Stable per-day index: days since the Unix epoch, computed from the local
// calendar date so it changes at local midnight.
function dayIndex(len, date = new Date()) {
  const [y, m, d] = todayISO(date).split('-').map(Number)
  const epochDay = Math.floor(Date.UTC(y, m - 1, d) / 86400000)
  return ((epochDay % len) + len) % len
}

// Today's reflection for the chosen rotation mode:
//   'both'   — verses and hadith (alternating)
//   'quran'  — verses only
//   'hadith' — hadith only
//   'off'    — nothing
export function getDailyReflection(mode = 'both', date = new Date()) {
  const pool =
    mode === 'quran'
      ? QURAN
      : mode === 'hadith'
        ? HADITH
        : mode === 'off'
          ? []
          : REFLECTIONS
  if (!pool.length) return null
  return pool[dayIndex(pool.length, date)]
}
