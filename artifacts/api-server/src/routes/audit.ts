import { Router, type IRouter } from "express";
import { sessionStore } from "../lib/session-store.js";
import { tokenStore } from "./auth.js";

const router: IRouter = Router();

router.get("/audit/log", async (req, res): Promise<void> => {
  // Role check
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "");
  const user = tokenStore.get(token);

  if (!user || (user.role !== "supervisor" && user.role !== "admin")) {
    res.status(403).json({ error: "Access restricted to Supervisor and Admin roles" });
    return;
  }

  const limit = parseInt((req.query.limit as string) ?? "50", 10);
  res.json(sessionStore.getAuditLog(limit));
});

export default router;
