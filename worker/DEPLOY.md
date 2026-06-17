# Deploying the Tilawah reminder backend (Cloudflare Workers)

This Worker computes each subscriber's prayer times and sends a Web Push
reminder at each prayer time **only if they haven't read that day**. It's free
on Cloudflare's Workers + KV free tiers.

You'll do this once. Total time ~10–15 minutes. Everything runs from the
`worker/` folder.

## 0. Prerequisites
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up)
- Node.js 18+ installed locally

```bash
cd worker
npm install
npx wrangler login        # opens the browser to authorise
```

## 1. Create the KV namespace (stores subscribers)
```bash
npx wrangler kv namespace create TILAWAH_KV
```
Copy the printed `id = "…"` into `wrangler.toml` under `[[kv_namespaces]]`
(replace `REPLACE_WITH_KV_NAMESPACE_ID`).

## 2. Generate VAPID keys (sign the push messages)
```bash
npm run gen-vapid
```
This prints two things:

- **VAPID_PUBLIC_KEY** — paste it in two places:
  1. `wrangler.toml` → `[vars] VAPID_PUBLIC_KEY = "…"`
  2. the app: `src/config.js` → `export const VAPID_PUBLIC_KEY = '…'`
- **VAPID_PRIVATE_JWK** — store as a secret (never commit it):
  ```bash
  npx wrangler secret put VAPID_PRIVATE_JWK
  # paste the one-line JSON when prompted
  ```

Also set your contact email in `wrangler.toml` → `VAPID_SUBJECT`
(e.g. `mailto:you@gmail.com`). Push services require a real `mailto:`.

## 3. Deploy
```bash
npm run deploy
```
Note the deployed URL, e.g. `https://tilawah-reminders.<you>.workers.dev`.
Verify it's up:
```bash
curl https://tilawah-reminders.<you>.workers.dev/health   # {"ok":true}
```

## 4. Point the app at the Worker
In the repo root, edit `src/config.js`:
```js
export const WORKER_URL = 'https://tilawah-reminders.<you>.workers.dev'
export const VAPID_PUBLIC_KEY = '<the same public key>'
```
Commit and push to `main` — GitHub Pages redeploys the app automatically.

## 5. Turn it on (on your iPhone)
1. Open the site in **Safari** (not an in-app browser).
2. **Share → Add to Home Screen**. Open Tilawah from the Home Screen icon.
3. **Settings → Prayer-time reminders → turn on**. Allow notifications and
   location when prompted.

## 6. Verify end-to-end
Send yourself an immediate test push (find your `clientId` in Settings is not
shown, so use the browser console: `localStorage.getItem('tilawah:clientId')`):
```bash
curl -X POST https://tilawah-reminders.<you>.workers.dev/test \
  -H 'Content-Type: application/json' \
  -d '{"clientId":"<your-clientId>"}'
```
You should get a notification within a few seconds. To watch the scheduler:
```bash
npx wrangler tail
```

## Cloud sync (included — no extra setup)
The same Worker also powers optional "Back up & sync" (Settings → Back up &
sync). Once `WORKER_URL` is set in `src/config.js`, the **sync code** works
automatically — no VAPID keys involved, and it shares the same KV namespace:
- `POST /sync/push` — `{ code, data }` stores a snapshot under `acct:<code>`.
- `POST /sync/pull` — `{ code }` returns the stored snapshot (404 if unknown).

The sync **code is the credential** (anyone with it can read/write that
record), so it's generated with ~60 bits of entropy. Reading data only —
prayer reminders and sync are independent and can be used separately.

## Sign in with Google (optional — one-tap sync)
This lets a user just tap **Sign in with Google** on each device instead of
copying a code. It needs a free Google OAuth client; the Worker validates the
sign-in and stores that user's data under `gacct:<google-user-id>`.

1. **Create an OAuth Client ID** in the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Create (or pick) a project → **OAuth consent screen** → External →
     fill in app name + your email → save. Add yourself under **Test users**
     (or **Publish** the app once you're happy).
   - **Credentials → Create credentials → OAuth client ID → Web application**.
   - Under **Authorised JavaScript origins**, add the site origin(s) where the
     app runs, e.g. `https://danisheddie.github.io`
     *(origin only — no path. For local dev also add `http://localhost:5173`.)*
   - Copy the **Client ID** (looks like `…apps.googleusercontent.com`).

2. **Tell the app and the Worker** the same client id:
   - App: `src/config.js` → `export const GOOGLE_CLIENT_ID = '…apps.googleusercontent.com'`
   - Worker: `worker/wrangler.toml` → `[vars] GOOGLE_CLIENT_ID = "…apps.googleusercontent.com"`

3. **Redeploy** the Worker (`npm run deploy`) and push the app change to `main`.

The "Sign in with Google" button appears automatically once both
`WORKER_URL` and `GOOGLE_CLIENT_ID` are set. Endpoints:
- `POST /auth/google` — `{ idToken }`; verified via Google's `tokeninfo`,
  returns an opaque `token` (180-day session) + any existing data.
- `POST /sync/pull` & `/sync/push` also accept `{ token }` instead of `{ code }`.

> GitHub Pages serves the app under a path (`/dailyTilawah/`), but Google only
> needs the **origin** (`https://danisheddie.github.io`) in the origins list.

## How reminders work
- `POST /subscribe` — the app upserts `{subscription, location, method, madhab,
  timeZone}` keyed by a per-device `clientId`.
- `POST /read` — the app reports the day's reading is done; reminders for the
  rest of that day are suppressed.
- **Cron `* * * * *`** — every minute the Worker checks each subscriber: if a
  prayer time falls in this minute (in their timezone) and they haven't read
  today, it sends one push and records it so it won't repeat.
- Expired subscriptions (HTTP 404/410) are pruned automatically.

## Notes
- iOS requires the app be **installed to the Home Screen** (iOS 16.4+) for web
  push — there is no way around this on iPhone.
- Costs: at a handful of users this stays comfortably inside the free tier
  (cron is 1 invocation/min; KV reads are a few per minute).
