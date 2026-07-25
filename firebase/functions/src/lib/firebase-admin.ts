import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// In Cloud Functions this picks up credentials automatically — no service
// account file needed. getApps() guard avoids re-initializing on warm starts.
if (!getApps().length) {
  initializeApp();
}

export const adminAuth = getAuth();
