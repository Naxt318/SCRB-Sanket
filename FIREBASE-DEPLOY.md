# Deploying SCRB Sanket to Firebase

One platform, one `.env` file: **Firebase Hosting** serves the frontend,
a **Cloud Function** (`api`) serves the backend, and **Firebase
Authentication** handles login — no Render, no Vercel, no separate
Postgres database.

Login uses real Firebase Authentication (Email/Password provider). The
three demo accounts below aren't hardcoded passwords in the code anymore —
they're actual accounts you create once in the Firebase console. Each
account's role/district/badge is looked up by email in
[`artifacts/scrb-sanket/src/lib/demo-users.ts`](./artifacts/scrb-sanket/src/lib/demo-users.ts)
(and mirrored server-side in
[`firebase/functions/src/lib/demo-users.ts`](./firebase/functions/src/lib/demo-users.ts)
so the backend can attribute audit-log entries and gate the
Supervisor/Admin-only pages).

| Email | Password | Role |
|---|---|---|
| `investigator@scrb.demo` | `scrb2024` | Investigator |
| `supervisor@scrb.demo` | `scrb2024` | Supervisor |
| `admin@scrb.demo` | `scrb2024` | Admin |

## One-time setup

1. **Create a Firebase project** at https://console.firebase.google.com
   (Cloud Functions require the pay-as-you-go **Blaze** plan — it has a
   generous free tier, you won't be charged for a demo app like this).

2. **Enable Email/Password sign-in**: Firebase console → **Authentication**
   → Sign-in method → enable **Email/Password**.

3. **Create the three demo accounts**: Authentication → Users → Add user,
   for each row in the table above (exact email, password `scrb2024`).
   Want a fourth real account? Create it the same way, then add a matching
   entry to *both* `demo-users.ts` files above.

4. **Get your web app config**: Project settings (gear icon) → General →
   scroll to "Your apps" → Add app → Web (`</>`) → register it (Hosting
   setup isn't needed here, you can skip that step) → copy the `firebaseConfig`
   object it shows you.

5. **Set up the `.env` file**:
   ```bash
   cp artifacts/scrb-sanket/.env.example artifacts/scrb-sanket/.env
   ```
   Paste the six values from step 4 into it:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

6. **Install the Firebase CLI** (if you don't have it) and log in:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

7. **Set your project ID** in `.firebaserc` (repo root) — replace the
   placeholder with your actual Firebase project ID (top-left of the
   Firebase console, under the project name).

## Install & build

From the repo root:
```bash
pnpm install
npm install --prefix firebase/functions
pnpm --filter @workspace/scrb-sanket run build
```

## Deploy

```bash
firebase deploy
```

Deploys Hosting and the `api` function together. It prints a live URL
like `https://your-project-id.web.app` — open it and log in with any of
the three demo accounts.

Deploy just one piece with `firebase deploy --only hosting` or
`firebase deploy --only functions`.

## Local development

Two options, same idea as before, now backed by Firebase instead of Express:

- **Frontend only, fast reload**: `pnpm dev` (from repo root) — runs Vite
  against `artifacts/scrb-sanket/.env`. API calls proxy to
  `http://localhost:5000` by default (the Hosting emulator's port) — start
  that alongside it with `pnpm run dev:functions` in another terminal.
- **Full stack via emulators**: `pnpm run dev:functions` — runs
  `firebase emulators:start --only functions,hosting`, serving the last
  build of the frontend plus a live-reloading function, with the same
  routing as production. Rebuild the frontend (`pnpm --filter
  @workspace/scrb-sanket run build`) to pick up frontend changes here.

The Auth emulator isn't wired up — local dev signs in against your real
Firebase project's Authentication, same as production.

## Troubleshooting

- **Build fails with a JSON parse error on `package.json`** — the file
  being read has invalid JSON syntax (often from a manual edit in
  GitHub's web editor). Copy `package.json` from this fixed package over
  whatever's in your repo and re-push.
- **Login fails with "Firebase isn't configured"** — `.env` is missing or
  wasn't filled in; see step 5 above.
- **Login fails with "Invalid email or password"** — double check the
  account exists in Firebase console → Authentication → Users, and the
  email/password match exactly (including the `@scrb.demo` domain).
- **Logged in but immediately bounced back to the login page** — the
  signed-in email isn't in `demo-users.ts` on the *backend* (`firebase/
  functions/src/lib/demo-users.ts`), so `/auth/me` returns 403 and the
  frontend signs you back out. Add the email there and redeploy the
  function.
- **`firebase deploy` fails on the functions step** — run
  `npm run build --prefix firebase/functions` first and read the
  TypeScript error it prints; it'll point at the exact file/line.
