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
sync). Once `WORKER_URL` is set in `src/config.js`, it works automatically —
no VAPID keys involved, and it shares the same KV namespace:
- `POST /sync/push` — `{ code, data }` stores a snapshot under `acct:<code>`.
- `POST /sync/pull` — `{ code }` returns the stored snapshot (404 if unknown).

The sync **code is the credential** (anyone with it can read/write that
record), so it's generated with ~60 bits of entropy. Reading data only —
prayer reminders and sync are independent and can be used separately.

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
