# Deploying SCRB Sanket

This project has two moving parts that need to be deployed separately:

| Piece | What it is | Where it goes |
|---|---|---|
| `artifacts/scrb-sanket` | The React/Vite frontend | **Vercel** (static build) |
| `artifacts/api-server` | An Express server (needs to stay running) | A host that runs persistent Node processes — **Render**, **Railway**, **Fly.io**, etc. Vercel's serverless functions aren't a fit for a long-lived Express app like this. |

The frontend calls the API at relative `/api/...` URLs. A small proxy
function (`/api/[...path].ts`) forwards those calls from Vercel to
wherever you host the API server, so **no frontend code changes are
needed** — you just set one environment variable.

## 1. Deploy the API server

Pick a host that runs a Node process continuously (Render's free web
service tier works fine for a demo):

1. Create a new web service pointing at this repo.
2. **Root directory:** `artifacts/api-server`
3. **Build command:** `pnpm install && pnpm run build` (run from the repo
   root so the pnpm workspace resolves correctly — most hosts let you set
   this explicitly; if not, `cd ../.. && pnpm install && pnpm --filter @workspace/api-server run build`)
4. **Start command:** `node --enable-source-maps dist/index.mjs`
5. Environment variables:
   - `DATABASE_URL` — a Postgres connection string (Render/Railway/Neon
     all offer free Postgres instances). The schema is currently an
     empty scaffold and all data is in-memory synthetic data, so this
     just needs to be a reachable database.
   - `NODE_ENV=production`
   - `PORT` — most hosts (Render, Railway) set this automatically; if
     yours doesn't, set it to whatever port you configure the service
     to listen on.
6. Deploy, then copy the resulting URL (e.g. `https://scrb-api.onrender.com`).
7. Confirm it works: `https://<your-api-url>/api/healthz` should return
   `{"status":"ok"}`.

## 2. Deploy the frontend to Vercel

1. Import this repo into a new Vercel project.
2. Leave the **Root Directory** at the repo root (default) — `vercel.json`
   at the top of the repo already tells Vercel how to build just the
   frontend package.
3. Framework preset: **Other** (the repo isn't Next.js/CRA/etc.).
4. Add one environment variable:
   - `API_ORIGIN` = the URL from step 1 (no trailing slash, e.g.
     `https://scrb-api.onrender.com`)
5. Deploy.

That's it — `vercel.json` handles the build command, output directory,
and SPA routing; the `/api/[...path].ts` function handles proxying API
calls to `API_ORIGIN`.

## Troubleshooting

- **Build fails with a JSON parse error on `package.json`** — the file
  Vercel is reading has invalid JSON syntax (often from a manual edit
  in GitHub's web editor). Copy the `package.json` from this fixed
  package over whatever's in your repo and re-push.
- **Frontend loads but API calls 500 with "API_ORIGIN environment
  variable is not set"** — you skipped step 2.4 above, or the API
  server isn't deployed yet.
- **API calls fail with a network/CORS-looking error** — double check
  the API server is actually reachable at `API_ORIGIN` (curl its
  `/api/healthz` endpoint) and that it's fully started, not just
  building.
