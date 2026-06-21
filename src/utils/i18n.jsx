// Lightweight i18n: a flat key → string dictionary per language, a reactive
// provider so changing the language re-renders the whole app, and a `t()`
// helper with {var} interpolation. Falls back to English, then to the key.

import { createContext, useContext, useMemo, useState } from 'react'
import { getSettings, setSetting } from './storage'

export const LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'ms', name: 'Bahasa Melayu' },
  { id: 'id', name: 'Bahasa Indonesia' },
]

const en = {
  'common.appTagline': 'One page a day. Every day.',
  'common.continue': 'Continue',
  'common.cancel': 'Cancel',
  'common.day': 'day',
  'common.days': 'days',
  'common.page': 'page',
  'common.pages': 'pages',
  'common.of604': 'of 604',

  'onboarding.begin': 'Begin',
  'onboarding.welcomeBody':
    'A quiet space to build istiqomah with the Qur’an — no noise, no distraction. Just you and the words of Allah.',
  'onboarding.nameTitle': 'What should we call you?',
  'onboarding.nameSub': 'We’ll use it to keep your journey personal.',
  'onboarding.namePlaceholder': 'Your name',
  'onboarding.goalTitle': 'Set your daily goal',
  'onboarding.goalSub': 'Small and steady. You can change this anytime.',
  'onboarding.startTitle': 'Where would you like to start?',
  'onboarding.startSub':
    'New to the Qur’an or picking up where you already are — your choice. You can change this anytime.',
  'onboarding.bismillahMeaning':
    'In the name of Allah, the Most Gracious, the Most Merciful.',
  'onboarding.enter': 'Enter',

  'goal.half': 'Half a page',
  'goal.one': '1 page',
  'goal.two': '2 pages',
  'goal.juz': '1 juz',
  'goal.custom': 'Custom',
  'goal.pagesPerDay': 'pages per day',

  'home.salam': 'Assalamu’alaikum',
  'home.complete': 'Today’s reading is complete. May Allah accept it.',
  'home.keepStreak': 'Keep your streak alive — your page is waiting.',
  'home.beginToday': 'Begin today. One page is enough.',
  'home.todayGoal': 'Today’s goal',
  'home.continueReading': 'Continue Reading',
  'home.startToday': 'Start Today’s Reading',
  'home.resuming': 'Resuming on page {page} of 604',
  'home.next': 'Next: {name} · {time}',

  'install.title': 'Add Tilawah to your Home Screen',
  'install.body':
    'Install it for a full-screen, offline experience — and so reminders can reach you.',
  'install.button': 'Install',
  'install.iosSteps': 'In Safari: tap Share, then “Add to Home Screen”.',
  'install.dontShow': 'Don’t show again',

  'beta.title': 'You’re testing an early version.',
  'beta.body':
    'Jazākallāhu khayran for helping shape Tilawah. Everything here works — read, build your streak, and use it however you like. If anything feels off, your feedback makes it better.',

  'reflection.verse': 'Verse of the day',
  'reflection.hadith': 'Hadith of the day',

  'reader.page': 'Page {page}',
  'reader.loading': 'Loading…',
  'reader.unable': 'Unable to load. Please check your connection.',
  'reader.tryAgain': 'Try again',
  'reader.preparing': 'Preparing the mushaf…',
  'reader.fontFail':
    'Couldn’t load the mushaf font for this page. The Translation view works without these fonts.',
  'reader.useTranslation': 'Use Translation view',
  'reader.prev': 'Prev',
  'reader.markRead': 'Mark as read',
  'reader.read': 'Read',
  'reader.next': 'Next',
  'reader.rewardYou': 'May Allah reward you.',
  'reader.streak': '{n}-day streak',
  'reader.readAnother': 'Read another page',
  'reader.doneToday': 'Done for today',
  'jump.title': 'Jump to',
  'jump.bookmarks': 'Bookmarks',
  'jump.juz': 'Juz',
  'jump.surah': 'Surah',
  'jump.noBookmarks':
    'No bookmarks yet. Tap the bookmark icon while reading to save a page.',
  'jump.removeBookmark': 'Remove bookmark',
  'jump.addBookmark': 'Bookmark this page',
  'jump.open': 'Jump to Juz or Surah',
  'journey.title': 'Your journey',
  'journey.throughQuran': 'through the Qur’an',
  'journey.juz': 'Juz {n} of 30',
  'journey.page': 'Page {page} of 604',
  'journey.completions': 'Qur’an completions',
  'journey.firstKhatm': 'Your first completion awaits — one page at a time.',
  'journey.completedTimes': 'Completed {n}×',
  'journey.currentStreak': 'Current streak',
  'journey.bestStreak': 'Best streak',
  'journey.pagesRead': 'Pages read',
  'journey.completionsShort': 'Completions',
  'journey.viewJourney': 'View your journey',
  'journey.consistency': 'Reading days',
  'journey.daysThisMonth': '{n} days',
  'reader.khatmTitle': 'You completed the Qur’an!',
  'reader.khatmBody': 'May Allah accept it and make the Qur’an a light for you.',

  'settings.title': 'Settings',
  'settings.dayStreak': 'day streak',
  'settings.lifetime': 'pages read (lifetime)',
  'settings.yourName': 'Your name',
  'settings.dailyGoal': 'Daily goal',
  'settings.appLanguage': 'App language',
  'settings.appLanguageSub': 'Language of the app’s buttons and labels.',
  'settings.theme': 'Theme',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Night',
  'settings.themeSepia': 'Sepia',
  'settings.readingSize': 'Reading size',
  'settings.sizeSmall': 'Small',
  'settings.sizeMedium': 'Medium',
  'settings.sizeLarge': 'Large',
  'settings.hijriDate': 'Hijri date',
  'settings.hijriDateSub': 'Nudge ±1 day to match your local moon sighting.',
  'settings.appearance': 'Appearance',
  'settings.reading': 'Reading',
  'settings.profile': 'Your name',
  'settings.readingView': 'Reading view',
  'settings.mushafPage': 'Mushaf page',
  'settings.mushafSub': 'Exact Madani print',
  'settings.translationView': 'Translation',
  'settings.translationViewSub': 'Ayah list + meaning',
  'settings.dailyReflection': 'Daily reflection',
  'settings.reflectionSub': 'The verse/hadith shown on the home screen each day.',
  'settings.both': 'Both',
  'settings.quranOnly': 'Qur’an only',
  'settings.hadithOnly': 'Hadith only',
  'settings.off': 'Off',
  'settings.readingPosition': 'Reading position',
  'settings.readingPositionSub':
    'Already partway through the Qur’an? Pick where your reading should resume. Currently resuming on page {page} of 604.',
  'settings.readingAids': 'Reading aids',
  'settings.readingAidsSub': 'Used in the Translation view.',
  'settings.showTranslation': 'Show translation',
  'settings.showTranslationDesc': 'Meaning below each ayah',
  'settings.translation': 'Translation',
  'settings.showTransliteration': 'Show transliteration',
  'settings.showTransliterationDesc': 'Latin pronunciation in italics',
  'settings.showAudio': 'Show audio controls',
  'settings.showAudioDesc': 'Play recitation for each ayah',
  'settings.reciter': 'Reciter',
  'settings.resetProgress': 'Reset progress',
  'settings.resetConfirm':
    'This clears your streak, position, and lifetime totals. This cannot be undone.',
  'settings.reset': 'Reset',
  'settings.betaFooter':
    'Beta · thank you for testing. Use it freely — your feedback shapes it.',

  'start.ayahRange': 'Ayah 1–{max}',
  'start.ayahLabel': 'Ayah number',
  'start.set': 'Set as my starting point',
  'start.finding': 'Finding the page…',
  'start.orBeginning': 'Or start from the beginning',
  'start.fail': 'Couldn’t look that up. Check your connection and try again.',
  'start.setTo': 'Set to {label} — page {page}.',
  'start.beginning': 'the beginning',
  'start.dataNote':
    'This only changes where reading resumes — your streak, pages read, and completions stay.',
  'start.beginningConfirm':
    'Start again from page 1? Your streak, pages read, and completions are kept — only your reading position moves to the beginning.',
  'start.confirmBeginning': 'Yes, start from page 1',

  'sync.title': 'Back up & sync',
  'sync.intro':
    'Optional. Keep your progress backed up and in sync across devices — sign in with Google, or use a private sync code. The app works fully without this.',
  'sync.notConnected':
    'Sync isn’t connected yet. It activates once the sync service is set up.',
  'sync.orUseCode': 'or use a sync code',
  'sync.yourCode': 'Your sync code',
  'sync.copy': 'Copy',
  'sync.codeHint':
    'Enter this code on another device (or in the app) to restore your progress. Keep it private — anyone with it can read your data.',
  'sync.syncNow': 'Sync now',
  'sync.stop': 'Stop syncing',
  'sync.createCode': 'Create a sync code',
  'sync.haveCode': 'Already have a code?',
  'sync.restore': 'Restore',
  'sync.created': 'Sync code created. Save it somewhere safe.',
  'sync.restored': 'Restored and synced. Your progress is now backed up.',
  'sync.synced': 'Synced.',
  'sync.syncFail': 'Sync failed. Check your connection and try again.',
  'sync.stopped': 'This device is no longer syncing. Your data stays on it.',
  'sync.copied': 'Code copied to clipboard.',
  'sync.createFail': 'Could not create a sync code.',
  'sync.linkFail': 'Could not link that code.',

  'google.synced': 'Syncing across your devices via Google. ✓',
  'google.signOut': 'Sign out',
  'google.hint':
    'Sign in once on each device and your progress stays in sync automatically.',
  'google.signingIn': 'Signing in…',
  'google.loadFail': 'Could not load Google sign-in.',
  'google.signInFail': 'Sign-in failed.',

  'reminders.title': 'Prayer-time reminders',
  'reminders.sub':
    'A gentle nudge at each prayer time — only on days you haven’t read yet.',
  'reminders.on': 'Reminders are on',
  'reminders.turnOn': 'Turn on reminders',
  'reminders.notConnected':
    'The reminder service isn’t connected yet, so notifications can’t be delivered. You can still set your location and preview today’s prayer times below.',
  'reminders.needInstalled':
    'Reminders need the installed app. On iPhone: tap Share → “Add to Home Screen”, then open Tilawah from your Home Screen and enable reminders there.',
  'reminders.location': 'Location',
  'reminders.notSet': 'Not set',
  'reminders.update': 'Update',
  'reminders.useLocation': 'Use my location',
  'reminders.method': 'Calculation method',
  'reminders.asr': 'Asr time',
  'reminders.standard': 'Standard',
  'reminders.hanafi': 'Hanafi',
  'reminders.todaysTimes': 'Today’s times',
  'reminders.errUnsupported':
    'This browser can’t show reminders. On iPhone, add Tilawah to your Home Screen first, then open it from there.',
  'reminders.errDenied':
    'Notifications are blocked. Allow them for this site, then try again.',
  'reminders.errLocationNeeded':
    'Location permission is needed to calculate prayer times for where you are.',
  'reminders.errLocationFail': 'Couldn’t get your location. Please try again.',
  'reminders.iosHint':
    'On iPhone, reminders only work when the app is added to your Home Screen. Tap Share → "Add to Home Screen", then open Tilawah from there.',
  'reminders.errGeneric': 'Something went wrong. Please try again.',
}

const ms = {
  'common.appTagline': 'Satu halaman sehari. Setiap hari.',
  'common.continue': 'Teruskan',
  'common.cancel': 'Batal',
  'common.day': 'hari',
  'common.days': 'hari',
  'common.page': 'halaman',
  'common.pages': 'halaman',
  'common.of604': 'daripada 604',

  'onboarding.begin': 'Mula',
  'onboarding.welcomeBody':
    'Ruang yang tenang untuk membina istiqamah bersama al-Qur’an — tanpa gangguan. Hanya anda dan kalam Allah.',
  'onboarding.nameTitle': 'Apa nama panggilan anda?',
  'onboarding.nameSub': 'Ia menjadikan perjalanan anda lebih peribadi.',
  'onboarding.namePlaceholder': 'Nama anda',
  'onboarding.goalTitle': 'Tetapkan sasaran harian',
  'onboarding.goalSub': 'Sedikit tetapi tekal. Boleh diubah bila-bila masa.',
  'onboarding.startTitle': 'Di mana anda ingin bermula?',
  'onboarding.startSub':
    'Baru bermula atau menyambung di tempat anda sekarang — pilihan anda. Boleh diubah bila-bila masa.',
  'onboarding.bismillahMeaning':
    'Dengan nama Allah, Yang Maha Pemurah, lagi Maha Mengasihani.',
  'onboarding.enter': 'Masuk',

  'goal.half': 'Setengah halaman',
  'goal.one': '1 halaman',
  'goal.two': '2 halaman',
  'goal.juz': '1 juzuk',
  'goal.custom': 'Tersendiri',
  'goal.pagesPerDay': 'halaman sehari',

  'home.salam': 'Assalamualaikum',
  'home.complete': 'Bacaan hari ini selesai. Semoga Allah menerimanya.',
  'home.keepStreak': 'Kekalkan rentetan anda — halaman anda menanti.',
  'home.beginToday': 'Mulakan hari ini. Satu halaman sudah memadai.',
  'home.todayGoal': 'Sasaran hari ini',
  'home.continueReading': 'Sambung Bacaan',
  'home.startToday': 'Mula Bacaan Hari Ini',
  'home.resuming': 'Menyambung pada halaman {page} daripada 604',
  'home.next': 'Seterusnya: {name} · {time}',

  'install.title': 'Tambah Tilawah ke Skrin Utama',
  'install.body':
    'Pasang untuk pengalaman skrin penuh, luar talian — dan supaya peringatan dapat sampai kepada anda.',
  'install.button': 'Pasang',
  'install.iosSteps': 'Dalam Safari: ketik Kongsi, kemudian “Tambah ke Skrin Utama”.',
  'install.dontShow': 'Jangan tunjuk lagi',

  'beta.title': 'Anda sedang menguji versi awal.',
  'beta.body':
    'Jazākallāhu khayran kerana membantu membentuk Tilawah. Semuanya berfungsi — baca, bina rentetan anda, dan gunakannya sesuka hati. Jika ada yang kurang kena, maklum balas anda menjadikannya lebih baik.',

  'reflection.verse': 'Ayat hari ini',
  'reflection.hadith': 'Hadis hari ini',

  'reader.page': 'Halaman {page}',
  'reader.loading': 'Memuatkan…',
  'reader.unable': 'Tidak dapat dimuatkan. Sila semak sambungan anda.',
  'reader.tryAgain': 'Cuba lagi',
  'reader.preparing': 'Menyediakan mushaf…',
  'reader.fontFail':
    'Tidak dapat memuatkan fon mushaf untuk halaman ini. Paparan Terjemahan berfungsi tanpa fon ini.',
  'reader.useTranslation': 'Guna paparan Terjemahan',
  'reader.prev': 'Sebelum',
  'reader.markRead': 'Tandai dibaca',
  'reader.read': 'Dibaca',
  'reader.next': 'Seterusnya',
  'reader.rewardYou': 'Semoga Allah memberkati anda.',
  'reader.streak': 'rentetan {n} hari',
  'reader.readAnother': 'Baca satu lagi halaman',
  'reader.doneToday': 'Cukup untuk hari ini',
  'jump.title': 'Pergi ke',
  'jump.bookmarks': 'Penanda',
  'jump.juz': 'Juzuk',
  'jump.surah': 'Surah',
  'jump.noBookmarks':
    'Tiada penanda lagi. Ketik ikon penanda semasa membaca untuk menyimpan halaman.',
  'jump.removeBookmark': 'Buang penanda',
  'jump.addBookmark': 'Tanda halaman ini',
  'jump.open': 'Pergi ke Juzuk atau Surah',
  'journey.title': 'Perjalanan anda',
  'journey.throughQuran': 'menerusi al-Qur’an',
  'journey.juz': 'Juzuk {n} daripada 30',
  'journey.page': 'Halaman {page} daripada 604',
  'journey.completions': 'Khatam al-Qur’an',
  'journey.firstKhatm': 'Khatam pertama anda menanti — satu halaman pada satu masa.',
  'journey.completedTimes': 'Khatam {n}×',
  'journey.currentStreak': 'Rentetan semasa',
  'journey.bestStreak': 'Rentetan terbaik',
  'journey.pagesRead': 'Halaman dibaca',
  'journey.completionsShort': 'Khatam',
  'journey.viewJourney': 'Lihat perjalanan anda',
  'journey.consistency': 'Hari membaca',
  'journey.daysThisMonth': '{n} hari',
  'reader.khatmTitle': 'Anda telah khatam al-Qur’an!',
  'reader.khatmBody': 'Semoga Allah menerimanya dan menjadikan al-Qur’an cahaya bagi anda.',

  'settings.title': 'Tetapan',
  'settings.dayStreak': 'hari rentetan',
  'settings.lifetime': 'halaman dibaca (keseluruhan)',
  'settings.yourName': 'Nama anda',
  'settings.dailyGoal': 'Sasaran harian',
  'settings.appLanguage': 'Bahasa aplikasi',
  'settings.appLanguageSub': 'Bahasa butang dan label aplikasi.',
  'settings.theme': 'Tema',
  'settings.themeLight': 'Cerah',
  'settings.themeDark': 'Malam',
  'settings.themeSepia': 'Sepia',
  'settings.readingSize': 'Saiz bacaan',
  'settings.sizeSmall': 'Kecil',
  'settings.sizeMedium': 'Sederhana',
  'settings.sizeLarge': 'Besar',
  'settings.hijriDate': 'Tarikh Hijrah',
  'settings.hijriDateSub': 'Laraskan ±1 hari mengikut rukyah tempatan anda.',
  'settings.appearance': 'Paparan',
  'settings.reading': 'Bacaan',
  'settings.profile': 'Nama anda',
  'settings.readingView': 'Paparan bacaan',
  'settings.mushafPage': 'Halaman mushaf',
  'settings.mushafSub': 'Cetakan Madani tepat',
  'settings.translationView': 'Terjemahan',
  'settings.translationViewSub': 'Senarai ayat + makna',
  'settings.dailyReflection': 'Renungan harian',
  'settings.reflectionSub':
    'Ayat/hadis yang dipaparkan di skrin utama setiap hari.',
  'settings.both': 'Kedua-duanya',
  'settings.quranOnly': 'Ayat sahaja',
  'settings.hadithOnly': 'Hadis sahaja',
  'settings.off': 'Tutup',
  'settings.readingPosition': 'Kedudukan bacaan',
  'settings.readingPositionSub':
    'Sudah separuh jalan dalam al-Qur’an? Pilih di mana bacaan anda patut disambung. Kini menyambung pada halaman {page} daripada 604.',
  'settings.readingAids': 'Bantuan bacaan',
  'settings.readingAidsSub': 'Digunakan dalam paparan Terjemahan.',
  'settings.showTranslation': 'Tunjuk terjemahan',
  'settings.showTranslationDesc': 'Makna di bawah setiap ayat',
  'settings.translation': 'Terjemahan',
  'settings.showTransliteration': 'Tunjuk transliterasi',
  'settings.showTransliterationDesc': 'Sebutan rumi dalam italik',
  'settings.showAudio': 'Tunjuk kawalan audio',
  'settings.showAudioDesc': 'Mainkan bacaan bagi setiap ayat',
  'settings.reciter': 'Qari',
  'settings.resetProgress': 'Set semula kemajuan',
  'settings.resetConfirm':
    'Ini akan memadam rentetan, kedudukan, dan jumlah keseluruhan anda. Tindakan ini tidak boleh dibatalkan.',
  'settings.reset': 'Set semula',
  'settings.betaFooter':
    'Beta · terima kasih kerana menguji. Gunakannya sesuka hati — maklum balas anda membentuknya.',

  'start.ayahRange': 'Ayat 1–{max}',
  'start.ayahLabel': 'Nombor ayat',
  'start.set': 'Tetapkan sebagai titik mula saya',
  'start.finding': 'Mencari halaman…',
  'start.orBeginning': 'Atau mula dari permulaan',
  'start.fail': 'Tidak dapat dicari. Semak sambungan anda dan cuba lagi.',
  'start.setTo': 'Ditetapkan ke {label} — halaman {page}.',
  'start.beginning': 'permulaan',
  'start.dataNote':
    'Ini hanya mengubah tempat bacaan disambung — streak, halaman dibaca, dan khatam anda kekal.',
  'start.beginningConfirm':
    'Mula semula dari halaman 1? Streak, halaman dibaca, dan khatam anda dikekalkan — hanya kedudukan bacaan berpindah ke permulaan.',
  'start.confirmBeginning': 'Ya, mula dari halaman 1',

  'sync.title': 'Sandaran & penyegerakan',
  'sync.intro':
    'Pilihan. Kekalkan kemajuan anda tersandar dan segerak merentas peranti — log masuk dengan Google, atau guna kod penyegerakan peribadi. Aplikasi berfungsi sepenuhnya tanpa ini.',
  'sync.notConnected':
    'Penyegerakan belum disambung. Ia aktif setelah perkhidmatan disediakan.',
  'sync.orUseCode': 'atau guna kod penyegerakan',
  'sync.yourCode': 'Kod penyegerakan anda',
  'sync.copy': 'Salin',
  'sync.codeHint':
    'Masukkan kod ini pada peranti lain untuk memulihkan kemajuan anda. Rahsiakan ia — sesiapa yang memilikinya boleh membaca data anda.',
  'sync.syncNow': 'Segerak sekarang',
  'sync.stop': 'Henti penyegerakan',
  'sync.createCode': 'Cipta kod penyegerakan',
  'sync.haveCode': 'Sudah ada kod?',
  'sync.restore': 'Pulih',
  'sync.created': 'Kod penyegerakan dicipta. Simpan di tempat yang selamat.',
  'sync.restored': 'Dipulihkan dan disegerakkan. Kemajuan anda kini tersandar.',
  'sync.synced': 'Disegerakkan.',
  'sync.syncFail': 'Penyegerakan gagal. Semak sambungan dan cuba lagi.',
  'sync.stopped':
    'Peranti ini tidak lagi disegerakkan. Data anda kekal padanya.',
  'sync.copied': 'Kod disalin ke papan keratan.',
  'sync.createFail': 'Tidak dapat mencipta kod penyegerakan.',
  'sync.linkFail': 'Tidak dapat memautkan kod itu.',

  'google.synced': 'Disegerakkan merentas peranti anda melalui Google. ✓',
  'google.signOut': 'Log keluar',
  'google.hint':
    'Log masuk sekali pada setiap peranti dan kemajuan anda kekal segerak secara automatik.',
  'google.signingIn': 'Sedang log masuk…',
  'google.loadFail': 'Tidak dapat memuatkan log masuk Google.',
  'google.signInFail': 'Log masuk gagal.',

  'reminders.title': 'Peringatan waktu solat',
  'reminders.sub':
    'Peringatan lembut pada setiap waktu solat — hanya pada hari anda belum membaca.',
  'reminders.on': 'Peringatan dihidupkan',
  'reminders.turnOn': 'Hidupkan peringatan',
  'reminders.notConnected':
    'Perkhidmatan peringatan belum disambung, jadi pemberitahuan tidak dapat dihantar. Anda masih boleh menetapkan lokasi dan melihat waktu solat hari ini di bawah.',
  'reminders.needInstalled':
    'Peringatan memerlukan aplikasi dipasang. Pada iPhone: ketik Kongsi → “Tambah ke Skrin Utama”, kemudian buka Tilawah dari Skrin Utama dan hidupkan peringatan di sana.',
  'reminders.location': 'Lokasi',
  'reminders.notSet': 'Belum ditetapkan',
  'reminders.update': 'Kemas kini',
  'reminders.useLocation': 'Guna lokasi saya',
  'reminders.method': 'Kaedah pengiraan',
  'reminders.asr': 'Waktu Asar',
  'reminders.standard': 'Biasa',
  'reminders.hanafi': 'Hanafi',
  'reminders.todaysTimes': 'Waktu hari ini',
  'reminders.errUnsupported':
    'Pelayar ini tidak boleh menunjukkan peringatan. Pada iPhone, tambah Tilawah ke Skrin Utama dahulu, kemudian buka dari sana.',
  'reminders.errDenied':
    'Pemberitahuan disekat. Benarkan untuk laman ini, kemudian cuba lagi.',
  'reminders.errLocationNeeded':
    'Kebenaran lokasi diperlukan untuk mengira waktu solat di tempat anda.',
  'reminders.errLocationFail':
    'Tidak dapat mendapatkan lokasi anda. Sila cuba lagi.',
  'reminders.iosHint':
    'Pada iPhone, peringatan hanya berfungsi apabila aplikasi ditambah ke Skrin Utama. Ketik Kongsi → "Tambah ke Skrin Utama", kemudian buka Tilawah dari sana.',
  'reminders.errGeneric': 'Sesuatu tidak kena. Sila cuba lagi.',
}

const id = {
  'common.appTagline': 'Satu halaman sehari. Setiap hari.',
  'common.continue': 'Lanjutkan',
  'common.cancel': 'Batal',
  'common.day': 'hari',
  'common.days': 'hari',
  'common.page': 'halaman',
  'common.pages': 'halaman',
  'common.of604': 'dari 604',

  'onboarding.begin': 'Mulai',
  'onboarding.welcomeBody':
    'Ruang tenang untuk membangun istikamah bersama Al-Qur’an — tanpa gangguan. Hanya Anda dan firman Allah.',
  'onboarding.nameTitle': 'Apa panggilan Anda?',
  'onboarding.nameSub': 'Agar perjalanan Anda terasa lebih personal.',
  'onboarding.namePlaceholder': 'Nama Anda',
  'onboarding.goalTitle': 'Tetapkan target harian',
  'onboarding.goalSub': 'Sedikit tetapi konsisten. Bisa diubah kapan saja.',
  'onboarding.startTitle': 'Di mana Anda ingin memulai?',
  'onboarding.startSub':
    'Baru memulai atau melanjutkan dari posisi Anda sekarang — pilihan Anda. Bisa diubah kapan saja.',
  'onboarding.bismillahMeaning':
    'Dengan nama Allah, Yang Maha Pengasih, lagi Maha Penyayang.',
  'onboarding.enter': 'Masuk',

  'goal.half': 'Setengah halaman',
  'goal.one': '1 halaman',
  'goal.two': '2 halaman',
  'goal.juz': '1 juz',
  'goal.custom': 'Khusus',
  'goal.pagesPerDay': 'halaman per hari',

  'home.salam': 'Assalamualaikum',
  'home.complete': 'Bacaan hari ini selesai. Semoga Allah menerimanya.',
  'home.keepStreak': 'Jaga rentetan Anda — halaman Anda menanti.',
  'home.beginToday': 'Mulai hari ini. Satu halaman sudah cukup.',
  'home.todayGoal': 'Target hari ini',
  'home.continueReading': 'Lanjutkan Membaca',
  'home.startToday': 'Mulai Bacaan Hari Ini',
  'home.resuming': 'Melanjutkan di halaman {page} dari 604',
  'home.next': 'Berikutnya: {name} · {time}',

  'install.title': 'Tambahkan Tilawah ke Layar Utama',
  'install.body':
    'Pasang untuk pengalaman layar penuh, offline — dan agar pengingat dapat menjangkau Anda.',
  'install.button': 'Pasang',
  'install.iosSteps': 'Di Safari: ketuk Bagikan, lalu “Tambahkan ke Layar Utama”.',
  'install.dontShow': 'Jangan tampilkan lagi',

  'beta.title': 'Anda sedang menguji versi awal.',
  'beta.body':
    'Jazākallāhu khayran telah membantu membentuk Tilawah. Semuanya berfungsi — baca, bangun rentetan Anda, dan gunakan sesuka Anda. Jika ada yang kurang pas, masukan Anda membuatnya lebih baik.',

  'reflection.verse': 'Ayat hari ini',
  'reflection.hadith': 'Hadis hari ini',

  'reader.page': 'Halaman {page}',
  'reader.loading': 'Memuat…',
  'reader.unable': 'Tidak dapat memuat. Silakan periksa koneksi Anda.',
  'reader.tryAgain': 'Coba lagi',
  'reader.preparing': 'Menyiapkan mushaf…',
  'reader.fontFail':
    'Tidak dapat memuat font mushaf untuk halaman ini. Tampilan Terjemahan berfungsi tanpa font ini.',
  'reader.useTranslation': 'Gunakan tampilan Terjemahan',
  'reader.prev': 'Sebelum',
  'reader.markRead': 'Tandai dibaca',
  'reader.read': 'Dibaca',
  'reader.next': 'Berikutnya',
  'reader.rewardYou': 'Semoga Allah membalas Anda.',
  'reader.streak': 'rentetan {n} hari',
  'reader.readAnother': 'Baca halaman lain',
  'reader.doneToday': 'Cukup untuk hari ini',
  'jump.title': 'Lompat ke',
  'jump.bookmarks': 'Penanda',
  'jump.juz': 'Juz',
  'jump.surah': 'Surah',
  'jump.noBookmarks':
    'Belum ada penanda. Ketuk ikon penanda saat membaca untuk menyimpan halaman.',
  'jump.removeBookmark': 'Hapus penanda',
  'jump.addBookmark': 'Tandai halaman ini',
  'jump.open': 'Lompat ke Juz atau Surah',
  'journey.title': 'Perjalanan Anda',
  'journey.throughQuran': 'melalui Al-Qur’an',
  'journey.juz': 'Juz {n} dari 30',
  'journey.page': 'Halaman {page} dari 604',
  'journey.completions': 'Khatam Al-Qur’an',
  'journey.firstKhatm': 'Khatam pertama Anda menanti — satu halaman setiap kali.',
  'journey.completedTimes': 'Khatam {n}×',
  'journey.currentStreak': 'Rentetan saat ini',
  'journey.bestStreak': 'Rentetan terbaik',
  'journey.pagesRead': 'Halaman dibaca',
  'journey.completionsShort': 'Khatam',
  'journey.viewJourney': 'Lihat perjalanan Anda',
  'journey.consistency': 'Hari membaca',
  'journey.daysThisMonth': '{n} hari',
  'reader.khatmTitle': 'Anda telah khatam Al-Qur’an!',
  'reader.khatmBody': 'Semoga Allah menerimanya dan menjadikan Al-Qur’an cahaya bagi Anda.',

  'settings.title': 'Pengaturan',
  'settings.dayStreak': 'hari rentetan',
  'settings.lifetime': 'halaman dibaca (total)',
  'settings.yourName': 'Nama Anda',
  'settings.dailyGoal': 'Target harian',
  'settings.appLanguage': 'Bahasa aplikasi',
  'settings.appLanguageSub': 'Bahasa tombol dan label aplikasi.',
  'settings.theme': 'Tema',
  'settings.themeLight': 'Terang',
  'settings.themeDark': 'Malam',
  'settings.themeSepia': 'Sepia',
  'settings.readingSize': 'Ukuran bacaan',
  'settings.sizeSmall': 'Kecil',
  'settings.sizeMedium': 'Sedang',
  'settings.sizeLarge': 'Besar',
  'settings.hijriDate': 'Tanggal Hijriah',
  'settings.hijriDateSub': 'Sesuaikan ±1 hari sesuai rukyat lokal Anda.',
  'settings.appearance': 'Tampilan',
  'settings.reading': 'Bacaan',
  'settings.profile': 'Nama Anda',
  'settings.readingView': 'Tampilan bacaan',
  'settings.mushafPage': 'Halaman mushaf',
  'settings.mushafSub': 'Cetakan Madani persis',
  'settings.translationView': 'Terjemahan',
  'settings.translationViewSub': 'Daftar ayat + makna',
  'settings.dailyReflection': 'Renungan harian',
  'settings.reflectionSub':
    'Ayat/hadis yang ditampilkan di layar utama setiap hari.',
  'settings.both': 'Keduanya',
  'settings.quranOnly': 'Ayat saja',
  'settings.hadithOnly': 'Hadis saja',
  'settings.off': 'Mati',
  'settings.readingPosition': 'Posisi bacaan',
  'settings.readingPositionSub':
    'Sudah separuh jalan dalam Al-Qur’an? Pilih di mana bacaan Anda harus dilanjutkan. Kini melanjutkan di halaman {page} dari 604.',
  'settings.readingAids': 'Alat bantu baca',
  'settings.readingAidsSub': 'Digunakan dalam tampilan Terjemahan.',
  'settings.showTranslation': 'Tampilkan terjemahan',
  'settings.showTranslationDesc': 'Makna di bawah setiap ayat',
  'settings.translation': 'Terjemahan',
  'settings.showTransliteration': 'Tampilkan transliterasi',
  'settings.showTransliterationDesc': 'Pelafalan latin dalam huruf miring',
  'settings.showAudio': 'Tampilkan kontrol audio',
  'settings.showAudioDesc': 'Putar bacaan untuk setiap ayat',
  'settings.reciter': 'Qari',
  'settings.resetProgress': 'Atur ulang kemajuan',
  'settings.resetConfirm':
    'Ini menghapus rentetan, posisi, dan total keseluruhan Anda. Tindakan ini tidak dapat dibatalkan.',
  'settings.reset': 'Atur ulang',
  'settings.betaFooter':
    'Beta · terima kasih telah menguji. Gunakan sesuka Anda — masukan Anda membentuknya.',

  'start.ayahRange': 'Ayat 1–{max}',
  'start.ayahLabel': 'Nomor ayat',
  'start.set': 'Tetapkan sebagai titik awal saya',
  'start.finding': 'Mencari halaman…',
  'start.orBeginning': 'Atau mulai dari awal',
  'start.fail': 'Tidak dapat menemukannya. Periksa koneksi dan coba lagi.',
  'start.setTo': 'Ditetapkan ke {label} — halaman {page}.',
  'start.beginning': 'awal',
  'start.dataNote':
    'Ini hanya mengubah tempat bacaan dilanjutkan — rentetan, halaman dibaca, dan khatam Anda tetap.',
  'start.beginningConfirm':
    'Mulai lagi dari halaman 1? Rentetan, halaman dibaca, dan khatam Anda tetap — hanya posisi bacaan berpindah ke awal.',
  'start.confirmBeginning': 'Ya, mulai dari halaman 1',

  'sync.title': 'Cadangkan & sinkronkan',
  'sync.intro':
    'Opsional. Jaga kemajuan Anda tercadang dan tersinkron antar perangkat — masuk dengan Google, atau gunakan kode sinkronisasi pribadi. Aplikasi berfungsi penuh tanpa ini.',
  'sync.notConnected':
    'Sinkronisasi belum tersambung. Ini aktif setelah layanan disiapkan.',
  'sync.orUseCode': 'atau gunakan kode sinkronisasi',
  'sync.yourCode': 'Kode sinkronisasi Anda',
  'sync.copy': 'Salin',
  'sync.codeHint':
    'Masukkan kode ini di perangkat lain untuk memulihkan kemajuan Anda. Rahasiakan — siapa pun yang memilikinya bisa membaca data Anda.',
  'sync.syncNow': 'Sinkronkan sekarang',
  'sync.stop': 'Hentikan sinkronisasi',
  'sync.createCode': 'Buat kode sinkronisasi',
  'sync.haveCode': 'Sudah punya kode?',
  'sync.restore': 'Pulihkan',
  'sync.created': 'Kode sinkronisasi dibuat. Simpan di tempat yang aman.',
  'sync.restored': 'Dipulihkan dan tersinkron. Kemajuan Anda kini tercadang.',
  'sync.synced': 'Tersinkron.',
  'sync.syncFail': 'Sinkronisasi gagal. Periksa koneksi dan coba lagi.',
  'sync.stopped':
    'Perangkat ini tidak lagi tersinkron. Data Anda tetap ada di dalamnya.',
  'sync.copied': 'Kode disalin ke papan klip.',
  'sync.createFail': 'Tidak dapat membuat kode sinkronisasi.',
  'sync.linkFail': 'Tidak dapat menautkan kode itu.',

  'google.synced': 'Tersinkron antar perangkat Anda melalui Google. ✓',
  'google.signOut': 'Keluar',
  'google.hint':
    'Masuk sekali di setiap perangkat dan kemajuan Anda tetap tersinkron otomatis.',
  'google.signingIn': 'Sedang masuk…',
  'google.loadFail': 'Tidak dapat memuat masuk dengan Google.',
  'google.signInFail': 'Gagal masuk.',

  'reminders.title': 'Pengingat waktu salat',
  'reminders.sub':
    'Dorongan lembut pada setiap waktu salat — hanya pada hari Anda belum membaca.',
  'reminders.on': 'Pengingat aktif',
  'reminders.turnOn': 'Aktifkan pengingat',
  'reminders.notConnected':
    'Layanan pengingat belum tersambung, jadi notifikasi tidak dapat dikirim. Anda tetap bisa menetapkan lokasi dan melihat waktu salat hari ini di bawah.',
  'reminders.needInstalled':
    'Pengingat memerlukan aplikasi terpasang. Di iPhone: ketuk Bagikan → “Tambahkan ke Layar Utama”, lalu buka Tilawah dari Layar Utama dan aktifkan pengingat di sana.',
  'reminders.location': 'Lokasi',
  'reminders.notSet': 'Belum diatur',
  'reminders.update': 'Perbarui',
  'reminders.useLocation': 'Gunakan lokasi saya',
  'reminders.method': 'Metode perhitungan',
  'reminders.asr': 'Waktu Asar',
  'reminders.standard': 'Standar',
  'reminders.hanafi': 'Hanafi',
  'reminders.todaysTimes': 'Waktu hari ini',
  'reminders.errUnsupported':
    'Peramban ini tidak dapat menampilkan pengingat. Di iPhone, tambahkan Tilawah ke Layar Utama dahulu, lalu buka dari sana.',
  'reminders.errDenied':
    'Notifikasi diblokir. Izinkan untuk situs ini, lalu coba lagi.',
  'reminders.errLocationNeeded':
    'Izin lokasi diperlukan untuk menghitung waktu salat di tempat Anda.',
  'reminders.errLocationFail':
    'Tidak dapat memperoleh lokasi Anda. Silakan coba lagi.',
  'reminders.iosHint':
    'Di iPhone, pengingat hanya berfungsi jika aplikasi ditambahkan ke Layar Utama. Ketuk Bagikan → "Tambahkan ke Layar Utama", lalu buka Tilawah dari sana.',
  'reminders.errGeneric': 'Terjadi kesalahan. Silakan coba lagi.',
}

const DICT = { en, ms, id }

export function translate(lang, key, vars) {
  const table = DICT[lang] || DICT.en
  let s = table[key] ?? DICT.en[key] ?? key
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.split(`{${k}}`).join(String(vars[k]))
    }
  }
  return s
}

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k })

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => getSettings().appLang || 'en')
  const value = useMemo(
    () => ({
      lang,
      setLang: (l) => {
        setSetting('appLang', l)
        setLangState(l)
      },
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang]
  )
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLang = () => useContext(LanguageContext)
