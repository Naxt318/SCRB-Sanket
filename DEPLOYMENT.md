# SANKET deployment checklist

This repository is configured as a single production service: Express serves
the compiled React application and the `/api` routes from the same origin.

## Build and run

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The server reads `PORT` from the hosting platform and binds to `0.0.0.0`.

## Required secrets

Set these in the deployment platform, never in Git:

- `DEMO_AUTH_SECRET`: a long random value used to sign login tokens.
- `DATABASE_URL`: a PostgreSQL connection string. The demo can start without a
  reachable database and uses its synthetic/in-memory fallback where supported.
- `GEMINI_API_KEY`: optional; enables Gemini-backed answers.
- `VITE_SARVAM_API_KEY`: optional; enables browser-side speech-to-text. This is
  compiled into the frontend and is visible to visitors, so use a restricted
  demo key only.

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

## Verification

After deployment, confirm:

1. `/health` returns HTTP 200.
2. `/` loads SANKET and its `/assets/*` requests return HTTP 200.
3. A deep link such as `/dashboard` returns the app rather than a 404.
4. A demo login succeeds and `/api/auth/me` returns the selected profile.
