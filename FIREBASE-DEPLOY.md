# Deploying SCRB Sanket to Firebase (one platform, no Render/Vercel)

This replaces the old Vercel + Render setup with a single Firebase project:
**Firebase Hosting** serves the frontend, and a **Cloud Function** (`api`)
replaces the Express server that used to run on Render. Hosting is
configured to transparently forward every `/api/**` request to that
function, so there's no separate origin, no `API_ORIGIN` env var, and no
CORS to worry about — everything lives under one domain.

Login is still the same hardcoded demo accounts (no database involved):

| Username | Password |
|---|---|
| `investigator` | `scrb2024` |
| `supervisor` | `scrb2024` |
| `admin` | `scrb2024` |

## One-time setup

1. **Create a Firebase project** at https://console.firebase.google.com
   (free "Spark" plan works, but Cloud Functions require the pay-as-you-go
   **Blaze** plan to be enabled — it has a generous free tier, you won't be
   charged for a demo app like this).

2. **Install the Firebase CLI** (if you don't have it):
   ```
   npm install -g firebase-tools
   ```

3. **Log in:**
   ```
   firebase login
   ```

4. **Set your project ID** — open `.firebaserc` in the repo root and
   replace `YOUR-FIREBASE-PROJECT-ID` with your actual Firebase project ID
   (find it in the Firebase console, top-left, under the project name).

## Install dependencies

From the repo root:
```
npm install --prefix firebase/functions
```

Build the frontend (this is what Hosting will serve):
```
cd artifacts/scrb-sanket
npm install
npm run build
cd ../..
```
This produces `artifacts/scrb-sanket/dist/public`, which `firebase.json`
is already configured to serve.

## Deploy

From the repo root:
```
firebase deploy
```

That deploys both the Hosting site and the `api` function in one shot.
When it finishes, it prints your live URL, something like:
```
Hosting URL: https://your-project-id.web.app
```

Open that URL, log in with `investigator` / `scrb2024`, and you're done —
no separate API host, no environment variables, no cold-start wake-up
delays to worry about (Cloud Functions still cold-start on the free tier,
but far less painfully than Render's free tier).

## Redeploying after changes

Same command any time you make changes:
```
firebase deploy
```
Or deploy just one piece:
```
firebase deploy --only hosting     # frontend only
firebase deploy --only functions   # API only
```

## Troubleshooting

- **`firebase deploy` fails on the functions step** — run
  `npm run build --prefix firebase/functions` first and read the
  TypeScript error it prints; it'll point at the exact file/line.
- **Blaze plan required** — Cloud Functions (2nd gen) need billing enabled
  on the Firebase project, even though usage at this scale is free. The
  Firebase console will prompt you to upgrade if you try to deploy without it.
- **Login still fails after deploying** — open browser dev tools → Network
  tab → retry login → check the `login` request's status/response, same as
  before. Since there's no separate origin anymore, most of the old
  proxy/env-var failure modes can't happen here.
