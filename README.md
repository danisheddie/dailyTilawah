# Daily Tilawah

> One page a day. Every day.

A minimalist Qur'an daily-reading web app that helps build **istiqomah**
(consistency) — a calm, distraction-free habit loop, spiritually grounded
rather than gamified. Built with **React + Vite** and styled with **Tailwind
CSS**. All user data lives in `localStorage`; Qur'an content comes from the
free [alquran.cloud](https://alquran.cloud) API.

## Features

- **Onboarding** — set a daily goal (half page / 1 page / 2 pages / 1 juz),
  with a soft bismillah before you begin.
- **Home** — today's Hijri + Gregorian date, your streak, a progress bar, and
  one clear action.
- **Reader** — a digital-mushaf reading view with proper RTL Arabic, ayah
  numbering, page navigation (1–604), and a gentle completion blessing.
- **Reading aids** (toggle in Settings) — English translation (on by default),
  transliteration, and per-ayah audio (Mishary Alafasy) with auto-advance.
- **Streak & progress** — consecutive-day streaks, lifetime pages read, and
  last-read position, all stored locally.

## Tech

- React + Vite, React Router
- Tailwind CSS
- `localStorage` for state, `sessionStorage` to cache page data
- Hijri dates via the native `Intl` Islamic calendar (no extra dependency)

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the build
```

## Project structure

```
src/
  components/   Onboarding, Home, Reader, Settings, AyahCard, AudioPlayer, StreakBadge
  utils/        storage.js (localStorage), dateUtils.js (Hijri + streaks), api.js (alquran.cloud)
  App.jsx       routing + first-launch gate
  main.jsx
  index.css
```

## Data model (localStorage)

| Key                          | Meaning                                    |
| ---------------------------- | ------------------------------------------ |
| `tilawah:userGoal`           | chosen daily goal id                       |
| `tilawah:streak`             | consecutive-day streak                     |
| `tilawah:lastCompletedDate`  | ISO date of the last completed day         |
| `tilawah:totalPagesRead`     | lifetime pages read                        |
| `tilawah:lastPage`           | current position in the mushaf (1–604)     |
| `tilawah:completedToday`     | whether today's goal is met (resets daily) |
| `tilawah:settings`           | reading-aid toggles                        |
