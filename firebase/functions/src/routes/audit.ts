import { Router, type IRouter } from "express";
import { sessionStore } from "../lib/session-store.js";
import { requireAuth } from "../lib/auth-middleware.js";

const router: IRouter = Router();

router.get("/audit/log", requireAuth, async (req, res): Promise<void> => {
  const u = req.authedUser!;
  if (u.role !== "supervisor" && u.role !== "admin") {
    res.status(403).json({ error: "Access restricted to Supervisor and Admin roles" });
    return;
  }

  const limit = parseInt((req.query.limit as string) ?? "50", 10);
  res.json(sessionStore.getAuditLog(limit));
});

export default router;
