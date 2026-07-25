import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { sessionStore } from "../lib/session-store.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

// Mock users for demo — no real credentials stored
const DEMO_USERS = [
  {
    id: "u-001",
    username: "investigator",
    password: "scrb2024",
    name: "Insp. R. Kumar",
    role: "investigator" as const,
    district: "Bengaluru Urban",
    badgeNumber: "KA-BU-1042",
  },
  {
    id: "u-002",
    username: "supervisor",
    password: "scrb2024",
    name: "DSP M. Nair",
    role: "supervisor" as const,
    district: "Bengaluru Urban",
    badgeNumber: "KA-BU-0321",
  },
  {
    id: "u-003",
    username: "admin",
    password: "scrb2024",
    name: "SP J. Reddy",
    role: "admin" as const,
    district: "SCRB HQ",
    badgeNumber: "KA-SCRB-001",
  },
];

// Simple token store (in-memory for prototype)
const tokenStore = new Map<string, typeof DEMO_USERS[0]>();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const user = DEMO_USERS.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = randomUUID();
  tokenStore.set(token, user);

  req.log.info({ userId: user.id, role: user.role }, "User logged in");

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      district: user.district,
      badgeNumber: user.badgeNumber,
    },
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.replace("Bearer ", "");
  const user = tokenStore.get(token);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({
    id: user.id,
    name: user.name,
    role: user.role,
    district: user.district,
    badgeNumber: user.badgeNumber,
  });
});

export { tokenStore };
export default router;
