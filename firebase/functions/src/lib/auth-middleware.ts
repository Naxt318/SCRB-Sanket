import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "./firebase-admin.js";
import { profileForEmail, type DemoProfile } from "./demo-users.js";

export interface AuthedUser extends DemoProfile {
  uid: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authedUser?: AuthedUser;
    }
  }
}

async function verify(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.authorization ?? "";
  const idToken = authHeader.replace("Bearer ", "");
  if (!idToken) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const profile = profileForEmail(decoded.email);
    if (!profile) return null;
    return { uid: decoded.uid, email: decoded.email!, ...profile };
  } catch {
    return null;
  }
}

// Rejects the request if there's no valid, provisioned Firebase session.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await verify(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.authedUser = user;
  next();
}

// Attaches the user if a valid session is present, but doesn't reject
// the request otherwise — used on routes that work for anonymous callers
// too but want to attribute activity when a user is present.
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const user = await verify(req);
  if (user) req.authedUser = user;
  next();
}
