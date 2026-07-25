// Firebase Cloud Functions entry point.
//
// This wraps the same Express app (app.ts) in an onRequest handler instead
// of calling app.listen(PORT) — Cloud Functions manages the HTTP server for
// us. Firebase Hosting is configured (see /firebase.json at the repo root)
// to rewrite every /api/** request to this function, so the frontend keeps
// calling relative "/api/..." URLs with zero code changes and zero CORS
// issues, since it's all served from the same domain.

import { onRequest } from "firebase-functions/v2/https";
import app from "./app";

export const api = onRequest(
  {
    region: "us-central1",
    cors: true,
  },
  app,
);
