// A curated set of Qur'an verses and authentic (Sahih/Hasan) hadith, each with
// its source, shown one-per-day on the home screen. Selection is deterministic
// per calendar day, so it's stable through the day and rotates.
//
// Sourcing: hadith are limited to Sahih al-Bukhari / Sahih Muslim (sahih by
// consensus) and a few from the Sunan graded sahih/hasan-sahih, with the
// collection and number cited so they can be verified. Translations of meaning
// follow the well-known renderings.

import { todayISO } from '../utils/dateUtils'

const QURAN = [
  {
    type: "Qur'an",
    arabic: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ',
    text: 'So remember Me; I will remember you.',
    source: 'Qur’an 2:152',
  },
  {
    type: "Qur'an",
    arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا',
    text: 'Indeed, with hardship comes ease.',
    source: 'Qur’an 94:6',
  },
  {
    type: "Qur'an",
    arabic: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ',
    text: 'Unquestionably, by the remembrance of Allah hearts are assured.',
    source: 'Qur’an 13:28',
  },
  {
    type: "Qur'an",
    arabic: 'إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ',
    text: 'Indeed, Allah is with the patient.',
    source: 'Qur’an 2:153',
  },
  {
    type: "Qur'an",
    arabic: 'ٱدْعُونِىٓ أَسْتَجِبْ لَكُمْ',
    text: 'Call upon Me; I will respond to you.',
    source: 'Qur’an 40:60',
  },
  {
    type: "Qur'an",
    text: 'And whoever fears Allah — He will make for him a way out, and will provide for him from where he does not expect.',
    source: 'Qur’an 65:2–3',
  },
  {
    type: "Qur'an",
    text: 'Allah does not burden a soul beyond that it can bear.',
    source: 'Qur’an 2:286',
  },
  {
    type: "Qur'an",
    text: 'Indeed, the prayer prohibits immorality and wrongdoing.',
    source: 'Qur’an 29:45',
  },
  {
    type: "Qur'an",
    text: 'And seek help through patience and prayer.',
    source: 'Qur’an 2:45',
  },
  {
    type: "Qur'an",
    text: 'My mercy encompasses all things.',
    source: 'Qur’an 7:156',
  },
  {
    type: "Qur'an",
    text: 'And He found you lost and guided you.',
    source: 'Qur’an 93:7',
  },
  {
    type: "Qur'an",
    text: 'Indeed, Allah loves those who rely upon Him.',
    source: 'Qur’an 3:159',
  },
  {
    type: "Qur'an",
    arabic: 'لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ',
    text: 'Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.',
    source: 'Qur’an 39:53',
  },
  {
    type: "Qur'an",
    text: 'And when My servants ask you concerning Me — indeed I am near. I respond to the call of the caller when he calls upon Me.',
    source: 'Qur’an 2:186',
  },
  {
    type: "Qur'an",
    text: 'So do not weaken and do not grieve, and you will be superior if you are believers.',
    source: 'Qur’an 3:139',
  },
  {
    type: "Qur'an",
    text: 'If you are grateful, I will surely increase you in favour.',
    source: 'Qur’an 14:7',
  },
  {
    type: "Qur'an",
    text: 'Whoever does righteousness, whether male or female, while a believer — We will surely cause them to live a good life.',
    source: 'Qur’an 16:97',
  },
  {
    type: "Qur'an",
    text: 'Indeed, the most noble of you in the sight of Allah is the most righteous of you.',
    source: 'Qur’an 49:13',
  },
  {
    type: "Qur'an",
    text: 'And I did not create the jinn and mankind except to worship Me.',
    source: 'Qur’an 51:56',
  },
  {
    type: "Qur'an",
    arabic: 'رَّبِّ زِدْنِى عِلْمًا',
    text: 'My Lord, increase me in knowledge.',
    source: 'Qur’an 20:114',
  },
  {
    type: "Qur'an",
    text: 'And whoever relies upon Allah — then He is sufficient for him.',
    source: 'Qur’an 65:3',
  },
  {
    type: "Qur'an",
    text: 'Perhaps you dislike a thing and it is good for you.',
    source: 'Qur’an 2:216',
  },
  {
    type: "Qur'an",
    text: 'O you who have believed, remember Allah with much remembrance.',
    source: 'Qur’an 33:41',
  },
  {
    type: "Qur'an",
    text: 'Indeed, Allah loves those who are constantly repentant and loves those who purify themselves.',
    source: 'Qur’an 2:222',
  },
  {
    type: "Qur'an",
    text: 'And We are closer to him than his jugular vein.',
    source: 'Qur’an 50:16',
  },
  {
    type: "Qur'an",
    text: 'And whoever believes in Allah — He will guide his heart.',
    source: 'Qur’an 64:11',
  },
  {
    type: "Qur'an",
    text: 'And be patient. Indeed, Allah is with the patient.',
    source: 'Qur’an 8:46',
  },
  {
    type: "Qur'an",
    text: 'By time, indeed mankind is in loss — except those who believe, do righteous deeds, and counsel each other to truth and to patience.',
    source: 'Qur’an 103:1–3',
  },
  {
    type: "Qur'an",
    text: 'Is the reward for good anything but good?',
    source: 'Qur’an 55:60',
  },
  {
    type: "Qur'an",
    text: 'O you who have believed, if you support Allah, He will support you and plant firmly your feet.',
    source: 'Qur’an 47:7',
  },
  {
    type: "Qur'an",
    text: 'Say: If you love Allah, then follow me, and Allah will love you and forgive you your sins.',
    source: 'Qur’an 3:31',
  },
  {
    type: "Qur'an",
    text: 'And those who strive for Us — We will surely guide them to Our ways.',
    source: 'Qur’an 29:69',
  },
  {
    type: "Qur'an",
    text: 'Repel evil by that which is better, and the one between you and him was enmity will become as a devoted friend.',
    source: 'Qur’an 41:34',
  },
  {
    type: "Qur'an",
    text: 'And We send down of the Qur’an that which is healing and mercy for the believers.',
    source: 'Qur’an 17:82',
  },
  {
    type: "Qur'an",
    text: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
    source: 'Qur’an 2:201',
  },
  {
    type: "Qur'an",
    text: 'O my son, establish prayer, enjoin what is right, forbid what is wrong, and be patient over what befalls you.',
    source: 'Qur’an 31:17',
  },
  {
    type: "Qur'an",
    text: 'Say: Indeed my prayer, my rites of sacrifice, my living and my dying are for Allah, Lord of the worlds.',
    source: 'Qur’an 6:162',
  },
  {
    type: "Qur'an",
    text: 'Every soul will taste death, and you will only be given your full compensation on the Day of Resurrection.',
    source: 'Qur’an 3:185',
  },
  {
    type: "Qur'an",
    text: 'Say: Never will we be struck except by what Allah has decreed for us; He is our protector. And upon Allah let the believers rely.',
    source: 'Qur’an 9:51',
  },
  {
    type: "Qur'an",
    text: 'We feed you only for the countenance of Allah. We wish not from you reward or gratitude.',
    source: 'Qur’an 76:9',
  },
  {
    type: "Qur'an",
    text: 'O you who have believed, be patient, persevere, remain stationed, and fear Allah that you may be successful.',
    source: 'Qur’an 3:200',
  },
  {
    type: "Qur'an",
    text: 'Indeed, Allah will not change the condition of a people until they change what is in themselves.',
    source: 'Qur’an 13:11',
  },
  {
    type: "Qur'an",
    text: 'Our Lord, let not our hearts deviate after You have guided us, and grant us mercy from Yourself.',
    source: 'Qur’an 3:8',
  },
  {
    type: "Qur'an",
    text: 'And hold firmly to the rope of Allah all together and do not become divided.',
    source: 'Qur’an 3:103',
  },
  {
    type: "Qur'an",
    text: 'Indeed, Allah commands justice, good conduct, and giving to relatives, and forbids immorality, bad conduct, and oppression.',
    source: 'Qur’an 16:90',
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
  {
    type: 'Hadith',
    text: 'Purity is half of faith.',
    source: 'Sahih Muslim 223',
  },
  {
    type: 'Hadith',
    text: 'Modesty is a branch of faith.',
    source: 'Sahih al-Bukhari 9; Sahih Muslim 35',
  },
  {
    type: 'Hadith',
    text: 'Whoever guides someone to goodness will have a reward like the one who does it.',
    source: 'Sahih Muslim 1893',
  },
  {
    type: 'Hadith',
    text: 'The Muslim is the brother of the Muslim. He does not wrong him, nor forsake him.',
    source: 'Sahih al-Bukhari 2442; Sahih Muslim 2580',
  },
  {
    type: 'Hadith',
    text: 'Whoever conceals the faults of a Muslim, Allah will conceal his faults in this world and the next.',
    source: 'Sahih Muslim 2590',
  },
  {
    type: 'Hadith',
    text: 'Charity does not decrease wealth.',
    source: 'Sahih Muslim 2588',
  },
  {
    type: 'Hadith',
    text: 'Whoever Allah wishes good for, He gives him understanding of the religion.',
    source: 'Sahih al-Bukhari 71; Sahih Muslim 1037',
  },
  {
    type: 'Hadith',
    text: 'When a person dies, their deeds end except three: ongoing charity, knowledge benefited from, or a righteous child who prays for them.',
    source: 'Sahih Muslim 1631',
  },
  {
    type: 'Hadith',
    text: 'There are two blessings which many people lose: health and free time.',
    source: 'Sahih al-Bukhari 6412',
  },
  {
    type: 'Hadith',
    text: 'Whoever fasts Ramadan out of faith and seeking reward, his previous sins will be forgiven.',
    source: 'Sahih al-Bukhari 38; Sahih Muslim 760',
  },
  {
    type: 'Hadith',
    text: 'The five daily prayers, and one Friday to the next, are an expiation for what is between them, so long as major sins are avoided.',
    source: 'Sahih Muslim 233',
  },
  {
    type: 'Hadith',
    text: 'Whoever sends one blessing upon me, Allah will send ten blessings upon him.',
    source: 'Sahih Muslim 408',
  },
  {
    type: 'Hadith',
    text: 'The most beloved words to Allah are four: SubhanAllah, Alhamdulillah, La ilaha illa Allah, and Allahu Akbar.',
    source: 'Sahih Muslim 2137',
  },
  {
    type: 'Hadith',
    text: 'Two words light on the tongue, heavy on the scale, beloved to the Most Merciful: SubhanAllah wa bihamdihi, SubhanAllah al-‘Azim.',
    source: 'Sahih al-Bukhari 6406; Sahih Muslim 2694',
  },
  {
    type: 'Hadith',
    text: 'Whoever says “SubhanAllah wa bihamdihi” one hundred times a day, his sins are wiped away though they be like the foam of the sea.',
    source: 'Sahih al-Bukhari 6405; Sahih Muslim 2691',
  },
  {
    type: 'Hadith',
    text: 'Be in this world as though you were a stranger or a traveller along a path.',
    source: 'Sahih al-Bukhari 6416',
  },
  {
    type: 'Hadith',
    text: 'He is not one of us who does not show mercy to our young and respect our elders.',
    source: 'Jami` at-Tirmidhi 1919 (sahih)',
  },
  {
    type: 'Hadith',
    text: 'The religion is sincerity (naseehah).',
    source: 'Sahih Muslim 55',
  },
  {
    type: 'Hadith',
    text: 'Whoever calls others to guidance will have a reward like the rewards of those who follow it, without lessening their own.',
    source: 'Sahih Muslim 2674',
  },
  {
    type: 'Hadith',
    text: 'The strong believer is better and more beloved to Allah than the weak believer, though in both there is good.',
    source: 'Sahih Muslim 2664',
  },
  {
    type: 'Hadith',
    text: 'Whoever loves to meet Allah, Allah loves to meet him.',
    source: 'Sahih al-Bukhari 6507; Sahih Muslim 2683',
  },
  {
    type: 'Hadith',
    text: 'Allah says: I am as My servant thinks of Me, and I am with him when he remembers Me.',
    source: 'Sahih al-Bukhari 7405; Sahih Muslim 2675',
  },
  {
    type: 'Hadith',
    text: 'The upper hand (that gives) is better than the lower hand (that receives).',
    source: 'Sahih al-Bukhari 1429; Sahih Muslim 1033',
  },
  {
    type: 'Hadith',
    text: 'Indeed, Allah is beautiful and loves beauty.',
    source: 'Sahih Muslim 91',
  },
  {
    type: 'Hadith',
    text: 'Smiling in the face of your brother is charity.',
    source: 'Jami` at-Tirmidhi 1956 (hasan)',
  },
  {
    type: 'Hadith',
    text: 'Whoever believes in Allah and the Last Day, let him be generous to his neighbour.',
    source: 'Sahih al-Bukhari 6019; Sahih Muslim 48',
  },
  {
    type: 'Hadith',
    text: 'The supplication of a Muslim for his absent brother is answered; an angel says: and for you the like.',
    source: 'Sahih Muslim 2733',
  },
  {
    type: 'Hadith',
    text: 'Allah says: My servant continues to draw near to Me with voluntary deeds until I love him.',
    source: 'Sahih al-Bukhari 6502',
  },
  {
    type: 'Hadith',
    text: 'Know that what has befallen you was never going to miss you, and what missed you was never going to befall you.',
    source: 'Jami` at-Tirmidhi 2516 (hasan sahih)',
  },
  {
    type: 'Hadith',
    text: 'Whoever does not thank people has not thanked Allah.',
    source: 'Sunan Abi Dawud 4811; Jami` at-Tirmidhi 1954 (sahih)',
  },
  {
    type: 'Hadith',
    text: 'Among those Allah shades on a day with no shade but His is a person who remembers Allah in private and his eyes overflow with tears.',
    source: 'Sahih al-Bukhari 660; Sahih Muslim 1031',
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
