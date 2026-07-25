# Running SCRB Sanket locally

This project was exported from Replit, which normally provisions a `PORT`,
a `BASE_PATH`, request routing between services, and a Postgres database
for you automatically. Outside Replit you have to do that yourself — this
is why `pnpm dev` / `vite` failed with errors like
`PORT environment variable is required but was not provided.`

The steps below get the frontend + API server running locally.

## 0. Prerequisites

- Node.js 20+ and `pnpm` (`npm install -g pnpm`)
- A reachable Postgres database. Easiest options:
  - Install Postgres locally (`sudo apt install postgresql` on
    Ubuntu/WSL, `brew install postgresql` on macOS), or
  - Use a free hosted Postgres like [Neon](https://neon.tech) or
    [Supabase](https://supabase.com) and just grab the connection string.

  Note: the app's DB schema is currently an empty scaffold — all data
  comes from an in-memory synthetic dataset in the API server — so the
  database just needs to exist and be reachable, it doesn't need any
  tables set up.

## 1. Install dependencies

```bash
pnpm install
```

## 2. Environment variables (already set up)

This zip ships with working `.env` files pre-filled with the same
`PORT`/`BASE_PATH` values Replit was injecting, so you can skip straight
to step 3. They live at:

- `artifacts/scrb-sanket/.env.local`
- `artifacts/api-server/.env`

Only edit `DATABASE_URL` inside `artifacts/api-server/.env` if you're
**not** using a local Postgres with user `postgres` / password `postgres`
on the default port (e.g. if you're using a hosted Neon/Supabase database,
paste its connection string there instead).

`.env.example` / `.env.local.example` are also included as a reference —
if you ever delete the real `.env` files, just copy those again.

## 3. Run it

From the repo root:

```bash
pnpm dev
```

This starts the API server on `http://localhost:8080` and the frontend
on `http://localhost:26259`, with the frontend's `/api/*` requests
proxied to the API server (this proxy is a dev-only addition — Replit's
own router used to do this job in production).

Open **http://localhost:26259** in your browser.

### Running the pieces individually

```bash
pnpm run dev:api   # API server only, http://localhost:8080
pnpm run dev:web   # frontend only, http://localhost:26259
```

## Windows note

Two issues in the original export only show up on Windows:

1. The `preinstall` script used `sh -c '...'`, which only works if you
   have Git Bash or WSL's `sh` on your `PATH`. It's been replaced with a
   plain Node script (`scripts-internal/preinstall.mjs`) that does the
   same thing (removes stray `package-lock.json`/`yarn.lock` and
   requires pnpm) but works on any platform.
2. `pnpm-workspace.yaml` had overrides (commented "replit uses linux-x64
   only, we can exclude all other platforms") that stripped every
   Windows/macOS native binary for esbuild, rollup, lightningcss, and
   Tailwind's oxide engine out of the lockfile. That's fine on Replit's
   own Linux servers, but on Windows it causes errors like
   `Cannot find module @rollup/rollup-win32-x64-msvc`. The win32/darwin
   overrides have been removed and the lockfile regenerated so the
   right binaries install on any platform.
3. The API server's `dev` script used Unix-only `export VAR=val && ...`
   syntax, which fails with `'export' is not recognized...` on Windows.
   It's been switched to use `cross-env` instead, which works
   cross-platform.

## What changed from the original export

- `artifacts/scrb-sanket/vite.config.ts`: added a `server.proxy` entry for
  `/api` → `http://localhost:8080` (configurable via `API_PORT`), since
  there's no Replit router locally to handle that.
- `pnpm-workspace.yaml`: `allowBuilds` flipped to `true` for `esbuild` /
  `core-js` — otherwise `pnpm install` silently skips build scripts these
  packages need and things fail later in confusing ways.
- Added `.env.example` files for both services with the same `PORT` /
  `BASE_PATH` values Replit was injecting.
- Added root `dev`, `dev:api`, `dev:web` scripts (`concurrently` +
  `dotenv-cli`) so you don't have to export env vars by hand every time.
