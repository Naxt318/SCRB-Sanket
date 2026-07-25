import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth-middleware.js";

const router: IRouter = Router();

// Sign-in itself happens client-side via the Firebase Auth SDK
// (signInWithEmailAndPassword). This route just confirms the resulting
// ID token is valid and returns the caller's SCRB profile — role,
// district, badge number — once they're signed in.
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const u = req.authedUser!;
  req.log.info({ uid: u.uid, role: u.role }, "Session verified");
  res.json({
    id: u.uid,
    name: u.name,
    role: u.role,
    district: u.district,
    badgeNumber: u.badgeNumber,
  });
});

export default router;
