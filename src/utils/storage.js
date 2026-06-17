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

// Record that the user finished reading one page. Updates lifetime totals,
// today's progress, and — if the daily goal is met — the streak.
// Returns a summary including `justCompleted` so the UI can celebrate.
export function recordPageRead(page) {
  rolloverIfNeeded()

  // lifetime total + furthest position
  write(KEYS.totalPagesRead, getTotalPagesRead() + 1)
  setLastPage(Math.min(604, page + 1))

  const goal = getGoal()
  const progress = getTodayProgress() + 1
  write(KEYS.todayProgress, progress)

  const wasComplete = read(KEYS.completedToday, false) === true
  let justCompleted = false

  if (!wasComplete && progress >= goal.pages) {
    write(KEYS.completedToday, true)
    justCompleted = true
    bumpStreak()
  }

  return { ...getProgressSummary(), justCompleted }
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
  ].forEach((k) => localStorage.removeItem(k))
}
