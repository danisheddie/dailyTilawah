// All localStorage read/write logic for Daily Tilawah lives here.
// Keeping it in one place keeps components free of storage details.

import { todayISO, isYesterday, isToday } from './dateUtils'

const KEYS = {
  onboarded: 'tilawah:onboarded',
  name: 'tilawah:userName',
  goal: 'tilawah:userGoal',
  streak: 'tilawah:streak',
  lastCompletedDate: 'tilawah:lastCompletedDate',
  totalPagesRead: 'tilawah:totalPagesRead',
  lastPage: 'tilawah:lastPage',
  completedToday: 'tilawah:completedToday',
  todayProgress: 'tilawah:todayProgress',
  progressDate: 'tilawah:progressDate',
  settings: 'tilawah:settings',
  reminders: 'tilawah:reminders',
  clientId: 'tilawah:clientId',
  customGoalPages: 'tilawah:customGoalPages',
  betaDismissed: 'tilawah:betaDismissed',
  installDismissed: 'tilawah:installDismissed',
  bookmarks: 'tilawah:bookmarks',
  khatmCount: 'tilawah:khatmCount',
  longestStreak: 'tilawah:longestStreak',
  readHistory: 'tilawah:readHistory',
}

// The reading goals the user can choose from. `pages` is the daily target
// expressed in mushaf pages (a juz is roughly 20 pages).
export const GOALS = [
  { id: 'half', label: 'Half a page', pages: 0.5 },
  { id: 'one', label: '1 page', pages: 1 },
  { id: 'two', label: '2 pages', pages: 2 },
  { id: 'juz', label: '1 juz', pages: 20 },
]

// Bounds for a user-defined custom daily goal (in mushaf pages).
export const MIN_CUSTOM_GOAL = 0.5
export const MAX_CUSTOM_GOAL = 604

export function clampGoalPages(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v <= 0) return 1
  return Math.min(MAX_CUSTOM_GOAL, Math.max(MIN_CUSTOM_GOAL, v))
}

export function goalLabel(pages) {
  const x = Number.isInteger(pages) ? pages : Number(pages).toFixed(1)
  return `${x} ${Number(pages) === 1 ? 'page' : 'pages'}`
}

export const DEFAULT_SETTINGS = {
  // 'list'   = ayah list in the KFGQPC Uthmanic font (exact mushaf font +
  //            tashkīl, always renders); 'mushaf' = exact Madani page layout
  //            via QCF v2 glyph fonts (needs the per-page fonts to load).
  readingView: 'list',
  // App UI language: 'en' | 'ms' | 'id'.
  appLang: 'en',
  // Reading theme: 'light' | 'dark' | 'sepia'.
  theme: 'light',
  // Arabic reading size: 's' | 'm' | 'l'.
  readingSize: 'm',
  // Hijri date adjustment in days (-2..+2) to match local moon sighting.
  hijriOffset: 0,
  // Daily home-screen reflection: 'both' | 'quran' | 'hadith' | 'off'.
  reflectionMode: 'both',
  showTranslation: true,
  translationEdition: 'en.asad',
  showTransliteration: false,
  showAudio: false,
  reciter: 'ar.alafasy',
}

// Prayer-time reminder preferences. `location` is { latitude, longitude,
// label } once the user grants geolocation; null until then.
export const DEFAULT_REMINDERS = {
  enabled: false,
  method: 'MuslimWorldLeague',
  madhab: 'shafi',
  location: null,
}

// --- low level helpers -----------------------------------------------------

function read(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or unavailable — fail quietly */
  }
}

// --- onboarding ------------------------------------------------------------

export function isOnboarded() {
  return read(KEYS.onboarded, false) === true
}

export function completeOnboarding(goalId, name, customPages) {
  setGoal(goalId, customPages)
  setName(name)
  write(KEYS.onboarded, true)
}

// --- beta notice -----------------------------------------------------------

export function isBetaDismissed() {
  return read(KEYS.betaDismissed, false) === true
}

export function dismissBeta() {
  write(KEYS.betaDismissed, true)
}

export function isInstallDismissed() {
  return read(KEYS.installDismissed, false) === true
}

export function dismissInstall() {
  write(KEYS.installDismissed, true)
}

// --- name ------------------------------------------------------------------

export function getName() {
  const name = read(KEYS.name, '')
  return typeof name === 'string' ? name : ''
}

export function setName(name) {
  const clean = typeof name === 'string' ? name.trim().slice(0, 40) : ''
  write(KEYS.name, clean)
}

// --- goal ------------------------------------------------------------------

export function getGoal() {
  const id = read(KEYS.goal, 'one')
  if (id === 'custom') {
    const pages = clampGoalPages(read(KEYS.customGoalPages, 1))
    return { id: 'custom', label: goalLabel(pages), pages }
  }
  return GOALS.find((g) => g.id === id) || GOALS[1]
}

export function setGoal(goalId, customPages) {
  if (goalId === 'custom') {
    write(KEYS.goal, 'custom')
    write(KEYS.customGoalPages, clampGoalPages(customPages))
    return
  }
  const valid = GOALS.find((g) => g.id === goalId) ? goalId : 'one'
  write(KEYS.goal, valid)
}

// --- settings --------------------------------------------------------------

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) }
}

export function setSetting(key, value) {
  const next = { ...getSettings(), [key]: value }
  write(KEYS.settings, next)
  return next
}

// --- reminders -------------------------------------------------------------

export function getReminders() {
  return { ...DEFAULT_REMINDERS, ...read(KEYS.reminders, {}) }
}

export function setReminders(partial) {
  const next = { ...getReminders(), ...partial }
  write(KEYS.reminders, next)
  return next
}

// A stable per-device id so the backend can key a subscriber's location and
// read-state. Generated once, then persisted.
export function getClientId() {
  let id = read(KEYS.clientId, null)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `c_${Date.now()}_${Math.random().toString(36).slice(2)}`
    write(KEYS.clientId, id)
  }
  return id
}

// --- reading position ------------------------------------------------------

export function getLastPage() {
  return read(KEYS.lastPage, 1)
}

export function setLastPage(page) {
  const clamped = Math.min(604, Math.max(1, page))
  write(KEYS.lastPage, clamped)
}

export function getTotalPagesRead() {
  return read(KEYS.totalPagesRead, 0)
}

// --- bookmarks -------------------------------------------------------------
// A bookmark is a saved page: { page, ts }. Kept sorted by page.

export function getBookmarks() {
  const list = read(KEYS.bookmarks, [])
  return Array.isArray(list) ? list : []
}

export function isBookmarked(page) {
  return getBookmarks().some((b) => b.page === page)
}

export function toggleBookmark(page) {
  const list = getBookmarks()
  const next = list.some((b) => b.page === page)
    ? list.filter((b) => b.page !== page)
    : [...list, { page, ts: Date.now() }].sort((a, b) => a.page - b.page)
  write(KEYS.bookmarks, next)
  return next
}

export function removeBookmark(page) {
  const next = getBookmarks().filter((b) => b.page !== page)
  write(KEYS.bookmarks, next)
  return next
}

// --- daily progress --------------------------------------------------------

// Make sure today's counters belong to today; reset them at a new day.
function rolloverIfNeeded() {
  const today = todayISO()
  if (read(KEYS.progressDate, null) !== today) {
    write(KEYS.progressDate, today)
    write(KEYS.todayProgress, 0)
    write(KEYS.completedToday, false)
  }
}

export function getTodayProgress() {
  rolloverIfNeeded()
  return read(KEYS.todayProgress, 0)
}

export function isCompletedToday() {
  rolloverIfNeeded()
  return read(KEYS.completedToday, false) === true
}

// Returns the effective streak, accounting for missed days.
// A streak survives only if the last completion was today or yesterday.
export function getStreak() {
  const streak = read(KEYS.streak, 0)
  const last = read(KEYS.lastCompletedDate, null)
  if (!last) return 0
  if (isToday(last) || isYesterday(last)) return streak
  return 0
}

export function getProgressSummary() {
  return {
    goal: getGoal(),
    todayProgress: getTodayProgress(),
    completedToday: isCompletedToday(),
    streak: getStreak(),
    totalPagesRead: getTotalPagesRead(),
    lastPage: getLastPage(),
  }
}

// --- journey (whole-Qur'an progress) ---------------------------------------

export function getKhatmCount() {
  return read(KEYS.khatmCount, 0)
}

export function getLongestStreak() {
  return Math.max(read(KEYS.longestStreak, 0), getStreak())
}

// Dates (YYYY-MM-DD) on which the daily goal was completed — for the calendar.
// On first access, seed from the current streak so past consistency shows.
export function getReadHistory() {
  const stored = read(KEYS.readHistory, null)
  if (Array.isArray(stored)) return stored
  const seeded = seedReadHistoryFromStreak()
  write(KEYS.readHistory, seeded)
  return seeded
}

function seedReadHistoryFromStreak() {
  const streak = getStreak()
  const last = read(KEYS.lastCompletedDate, null)
  if (!streak || !last) return []
  const [y, m, d] = last.split('-').map(Number)
  const base = new Date(y, m - 1, d)
  const out = []
  for (let i = 0; i < streak; i++) {
    const dt = new Date(base)
    dt.setDate(base.getDate() - i)
    out.push(todayISO(dt))
  }
  return out.sort()
}

// The most recent day a page was read (YYYY-MM-DD), or null if never.
export function getLastReadDate() {
  const h = getReadHistory()
  return h.length ? h[h.length - 1] : null
}

export function markReadDay(date = todayISO()) {
  const h = getReadHistory()
  if (h.includes(date)) return h
  const next = [...h, date].sort()
  write(KEYS.readHistory, next)
  return next
}

export function getJourneySummary() {
  return {
    lastPage: getLastPage(),
    totalPagesRead: getTotalPagesRead(),
    khatmCount: getKhatmCount(),
    streak: getStreak(),
    longestStreak: getLongestStreak(),
  }
}

// Record that the user finished reading one page. Reading any new page keeps
// the streak and marks the day; the daily goal is a separate target whose
// completion sets `justCompleted` so the UI can celebrate.
export function recordPageRead(page) {
  rolloverIfNeeded()

  // Idempotent: a page is only counted the first time you pass it. Re-marking
  // a page you've already read (below your furthest point) does nothing, so it
  // can't inflate today's progress, lifetime total, or the streak.
  if (page < getLastPage()) {
    return {
      ...getProgressSummary(),
      justCompleted: false,
      khatmCompleted: false,
      alreadyRead: true,
    }
  }

  // lifetime total
  write(KEYS.totalPagesRead, getTotalPagesRead() + 1)

  // furthest position — finishing the last page completes a khatm and starts a
  // fresh pass at page 1.
  let khatmCompleted = false
  if (page >= 604) {
    write(KEYS.khatmCount, getKhatmCount() + 1)
    setLastPage(1)
    khatmCompleted = true
  } else {
    setLastPage(page + 1)
  }

  // Reading any new page keeps the streak alive and marks today on the
  // calendar (both idempotent per day) — consistency rewards showing up, it
  // isn't gated by hitting the full daily goal.
  bumpStreak()
  markReadDay()

  const goal = getGoal()
  const progress = getTodayProgress() + 1
  write(KEYS.todayProgress, progress)

  // The daily goal is a separate target: meeting it triggers the celebration.
  const wasComplete = read(KEYS.completedToday, false) === true
  let justCompleted = false

  if (!wasComplete && progress >= goal.pages) {
    write(KEYS.completedToday, true)
    justCompleted = true
  }

  return { ...getProgressSummary(), justCompleted, khatmCompleted }
}

function bumpStreak() {
  const last = read(KEYS.lastCompletedDate, null)
  const today = todayISO()
  if (last === today) return // already counted today

  let streak = read(KEYS.streak, 0)
  if (last && isYesterday(last)) {
    streak += 1
  } else {
    streak = 1 // fresh start or broken streak
  }
  write(KEYS.streak, streak)
  write(KEYS.lastCompletedDate, today)
  if (streak > read(KEYS.longestStreak, 0)) write(KEYS.longestStreak, streak)
}

// --- reset -----------------------------------------------------------------

export function resetProgress() {
  ;[
    KEYS.streak,
    KEYS.lastCompletedDate,
    KEYS.totalPagesRead,
    KEYS.lastPage,
    KEYS.completedToday,
    KEYS.todayProgress,
    KEYS.progressDate,
    KEYS.khatmCount,
    KEYS.longestStreak,
  ].forEach((k) => localStorage.removeItem(k))
}
