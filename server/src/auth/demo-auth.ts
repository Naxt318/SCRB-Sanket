import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";

export const DEMO_AUTH_SECRET =
  process.env.DEMO_AUTH_SECRET || process.env.JWT_SECRET || "scrb_sanket_secret_key_2026";

export interface DemoUserProfile {
  id: string;
  email: string;
  name: string;
  role: "investigator" | "supervisor" | "admin";
  district: string;
  badgeNumber: string;
}

export const DEMO_PROFILES_REGISTRY: Record<string, DemoUserProfile> = {
  "investigator@scrb.demo": {
    id: "usr-investigator",
    email: "investigator@scrb.demo",
    name: "Insp. R. Kumar",
    role: "investigator",
    district: "Bengaluru Urban",
    badgeNumber: "KA-BU-1042",
  },
  "supervisor@scrb.demo": {
    id: "usr-supervisor",
    email: "supervisor@scrb.demo",
    name: "DSP M. Nair",
    role: "supervisor",
    district: "Bengaluru Urban",
    badgeNumber: "KA-BU-0321",
  },
  "admin@scrb.demo": {
    id: "usr-admin",
    email: "admin@scrb.demo",
    name: "SP J. Reddy",
    role: "admin",
    district: "SCRB HQ",
    badgeNumber: "KA-SCRB-001",
  },
};

export async function authenticateDemoUser(
  emailStr: string,
  passStr: string
): Promise<{ token: string; user: DemoUserProfile } | null> {
  const cleanEmail = emailStr.trim().toLowerCase();

  let dbUser: any = null;
  try {
    dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
  } catch {
    // DB offline/unseeded fallback
  }

  if (dbUser) {
    const isValid = await bcrypt.compare(passStr, dbUser.passwordHash);
    if (!isValid) return null;

    const userProfile: DemoUserProfile = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as any,
      district: dbUser.district,
      badgeNumber: dbUser.badgeNumber,
    };

    const token = jwt.sign({ userId: dbUser.id, email: dbUser.email, role: dbUser.role }, DEMO_AUTH_SECRET, {
      expiresIn: "7d",
    });

    return { token, user: userProfile };
  }

  const demoProfile = DEMO_PROFILES_REGISTRY[cleanEmail];
  if (demoProfile && passStr === "scrb2024") {
    const token = jwt.sign(
      { userId: demoProfile.id, email: cleanEmail, role: demoProfile.role },
      DEMO_AUTH_SECRET,
      { expiresIn: "7d" }
    );

    return { token, user: demoProfile };
  }

  return null;
}
