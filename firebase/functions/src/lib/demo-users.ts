// Demo role/profile lookup, keyed by the email each demo account signs in
// with. Real authentication (password, sessions) is handled entirely by
// Firebase Auth — this just maps an authenticated email to the SCRB
// profile info (role, district, badge) the UI needs.
//
// Keep this in sync with the matching copy in
// artifacts/scrb-sanket/src/lib/demo-users.ts.
//
// To add a real user: create them in the Firebase console (Authentication
// tab) and add an entry here with their email.

export interface DemoProfile {
  role: "investigator" | "supervisor" | "admin";
  name: string;
  district: string;
  badgeNumber: string;
}

export const DEMO_PROFILES: Record<string, DemoProfile> = {
  "investigator@scrb.demo": {
    role: "investigator",
    name: "Insp. R. Kumar",
    district: "Bengaluru Urban",
    badgeNumber: "KA-BU-1042",
  },
  "supervisor@scrb.demo": {
    role: "supervisor",
    name: "DSP M. Nair",
    district: "Bengaluru Urban",
    badgeNumber: "KA-BU-0321",
  },
  "admin@scrb.demo": {
    role: "admin",
    name: "SP J. Reddy",
    district: "SCRB HQ",
    badgeNumber: "KA-SCRB-001",
  },
};

export function profileForEmail(email: string | undefined | null): DemoProfile | null {
  if (!email) return null;
  return DEMO_PROFILES[email] ?? null;
}
