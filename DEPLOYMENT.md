# SANKET deployment checklist

This repository is configured as a single production service: Express serves
the compiled React application and the `/api` routes from the same origin.

## Build and run

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The server reads `X_ZOHO_CATALYST_LISTEN_PORT` (or the conventional `PORT`)
from the hosting platform and binds to `0.0.0.0`.
The build also stages the static application in the repository-level `dist/`
directory expected by Slate and Catalyst static deployers.

## Required secrets

Set these in the deployment platform, never in Git:

- `DEMO_AUTH_SECRET`: a long random value used to sign login tokens.
- `DATABASE_URL`: a PostgreSQL connection string. The demo can start without a
  reachable database and uses its synthetic/in-memory fallback where supported.
- `GEMINI_API_KEY`: optional; enables Gemini-backed answers.
- `VITE_SARVAM_API_KEY`: optional; enables browser-side speech-to-text. This is
  compiled into the frontend and is visible to visitors, so use a restricted
  demo key only.

## API mode

- Static Slate/Catalyst deployment: leave `VITE_API_MODE` unset or set it to
  `local`. Demo login and the core synthetic API run in the browser.
- Full-stack deployment: set `VITE_API_MODE=server` at build time and run
  `pnpm start` so `/api/*` is handled by Express.

Generate an auth secret with:

```bash
openssl rand -hex 32
```

## Deployment settings

- Runtime: Node.js 22
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Run command: `pnpm start`
- Health check: `/health`

## Zoho Catalyst AppSail

Use AppSail for the full-stack deployment. Slate is suitable for the static
demo, but cannot keep the Gemini credential server-side.

1. Build with `VITE_API_MODE=server pnpm build`.
2. Deploy the repository root as a Node.js AppSail service.
3. Set the startup command to `node server/dist/index.js`.
4. Add `GEMINI_API_KEY`, `DEMO_AUTH_SECRET`, and (optionally) `DATABASE_URL`
   as AppSail environment variables in the Catalyst console.

Do not configure `VITE_GEMINI_API_KEY`; Vite variables are embedded in public
browser assets.

## Verification

After deployment, confirm:

1. `/health` returns HTTP 200.
2. `/` loads SANKET and its `/assets/*` requests return HTTP 200.
3. A deep link such as `/dashboard` returns the app rather than a 404.
4. A demo login succeeds and `/api/auth/me` returns the selected profile.
