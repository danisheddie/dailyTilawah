# Daily Tilawah — project guide

A calm, minimal "one page of Qur'an a day" PWA. Live at **https://dailytilawah.app**.
Philosophy: protect the calm, minimal aesthetic — resist feature/clutter creep.

## Stack
- React 18 + Vite + Tailwind + react-router-dom. PWA (`public/manifest.webmanifest`, `public/sw.js`).
- No test suite. Verify with `npm run build`. There is **no lint script**.

## Hosting & domain
- **Cloudflare Pages** serves the app at `dailytilawah.app` (build: `npm run build`, output `dist`).
- Vite `base` auto-detects (`vite.config.js`): GitHub Actions build → `/dailyTilawah/`; everything else (Cloudflare, local) → `/`. No env var needed.
- SPA routing on Cloudflare via `public/_redirects` (`/* /index.html 200`). (Do NOT re-add a GitHub `404.html` — it mangles URLs on Cloudflare.)
- The old GitHub Pages site (`danisheddie.github.io/dailyTilawah/`) still builds via `.github/workflows/deploy.yml` and **auto-redirects** to the new domain, carrying each device's progress via the URL fragment (`src/utils/migrate.js`). It's being retired.

## Backend (Cloudflare Worker, `worker/`)
- Worker `tilawah-reminders` + KV namespace `TILAWAH_KV`. Deploy: `cd worker && npm run deploy`.
- Endpoints: `/sync/pull`, `/sync/push` (account by Google session `{token}` or sync `{code}`), `/auth/google`, `/auth/signout`, `/subscribe`, `/read`, `/unsubscribe`, `/test`, and a cron (every 2 min) that sends prayer-time Web Push reminders.
- App config in `src/config.js`: `WORKER_URL` (set), `GOOGLE_CLIENT_ID` (set), `VAPID_PUBLIC_KEY` (empty — reminders inactive until set). `remindersConfigured()` gates the reminder UI.
- Worker secrets via `wrangler secret put` (e.g. `VAPID_PRIVATE_JWK`). `GOOGLE_CLIENT_ID`/`VAPID_PUBLIC_KEY`/`VAPID_SUBJECT` are non-secret `[vars]` in `worker/wrangler.toml`.

## Qur'an data (local-first, with live fallback)
- `npm run build-data` (`scripts/build-quran-data.mjs`) writes `public/data/`: `meta.json`, `page/<1..604>.json` (QCF v2 glyph lines + per-verse words/text), `translation/<edition>.json`, `ayah-pages.json`. See `scripts/DATA.md`.
- `src/utils/api.js` is **local-first**: `getMushafPage`/`getPage`/`getAyahPage` use `public/data/` when present, else fall back to live APIs (quran.com for glyphs, alquran.cloud for translations). Audio streams from islamic.network CDN via computed URLs.
- QCF per-page fonts load from jsDelivr (`mushafFontUrl`, `src/utils/fonts.js`). The KFGQPC Uthmanic Hafs unicode font is self-hosted (`public/fonts/`), used only as a fallback when glyphs aren't loaded.

## Key files
- `src/utils/api.js` — data layer (pages, translations, reciters, juz/surah tables).
- `src/utils/storage.js` — localStorage: settings, goal, streak, bookmarks, reading position.
- `src/utils/cloudSync.js` — sync + `mergeSnapshots` (smart merge; bookmarks union). `SYNC_KEYS` lists synced keys.
- `src/utils/i18n.jsx` — UI strings in **en / ms / id**. Every user-facing string must have a key in all three.
- `src/utils/dateUtils.js` — Hijri date (Umm al-Qura + numeric extraction + our month names + `hijriOffset` adjustment).
- Components: `Home`, `Reader` (+ `MushafPage`, `AyahCard`, `JumpSheet`), `Settings` (collapsible groups), `Onboarding`, `Reminders`, `SyncSettings`, `GoogleSignIn`, `StartingPoint`, `DailyReflection`, `BetaNotice`.

## Conventions
- Reading views: `readingView` setting = `mushaf` (QCF page) or `list` (per-ayah QCF glyphs + translation underneath).
- Themes via CSS variables (`light`/`dark`/`sepia`) in `index.css`; `paper`/`teal` invert so `bg-teal text-paper` stays legible. Applied pre-paint by an inline script in `index.html`.
- All settings live in `DEFAULT_SETTINGS` (`storage.js`) and sync via the `tilawah:settings` key.
- After changes: `npm run build` to verify; commit; push to `main` (Cloudflare auto-deploys).

## Open tasks
1. **Push `public/data/`** — generated locally but not yet on `origin/main`. `git add public/data && commit && push`, then confirm `dailytilawah.app/data/meta.json` returns JSON.
2. **Reminders** — `cd worker && npm run gen-vapid`; set `VAPID_PUBLIC_KEY`/`VAPID_SUBJECT` in `wrangler.toml`, `VAPID_PUBLIC_KEY` in `src/config.js`; `wrangler secret put VAPID_PRIVATE_JWK`; `npm run deploy`. iOS web push needs the app added to the Home Screen.
3. **Publish the Google OAuth consent screen** before a public launch (Testing mode caps at 100 users).
4. Optional: Phase 3 progress calendar (needs a per-day read history, not yet stored).
