import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { DEMO_AUTH_SECRET, DEMO_PROFILES_REGISTRY } from "../auth/demo-auth.js";

export { DEMO_AUTH_SECRET as JWT_SECRET };

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: "investigator" | "supervisor" | "admin";
  district: string;
  badgeNumber: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing Bearer Token" });
    return;
  }

  const token = authHeader.split("Bearer ")[1]?.trim();
  if (!token) {
    res.status(401).json({ error: "Unauthorized: Empty Bearer Token" });
    return;
  }

  try {
    const decoded = jwt.verify(token, DEMO_AUTH_SECRET) as { userId: string; email: string; user?: any };
    if (!decoded || (!decoded.userId && !decoded.email)) {
      res.status(401).json({ error: "Unauthorized: Invalid JWT token payload" });
      return;
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: decoded.userId ? { id: decoded.userId } : { email: decoded.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          district: true,
          badgeNumber: true,
        },
      });
    } catch {
      // Database connection fallback
      const email = decoded.email || decoded.user?.email;
      const profile = DEMO_PROFILES_REGISTRY[email] || {
        id: decoded.userId || "demo-uid",
        email: email || "investigator@scrb.demo",
        name: email ? email.split("@")[0] : "Investigator",
        role: "investigator" as const,
        district: "Bengaluru Urban",
        badgeNumber: "KA-BU-1042",
      };
      user = {
        id: decoded.userId || profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        district: profile.district,
        badgeNumber: profile.badgeNumber,
      };
    }

    if (!user) {
      const email = decoded.email;
      const profile = DEMO_PROFILES_REGISTRY[email];
      if (profile) {
        user = profile;
      } else {
        res.status(401).json({ error: "Unauthorized: User not found" });
        return;
      }
    }

    req.user = {
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "investigator" | "supervisor" | "admin",
      district: user.district,
      badgeNumber: user.badgeNumber,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ error: "Unauthorized: Invalid or expired authentication token" });
  }
}
