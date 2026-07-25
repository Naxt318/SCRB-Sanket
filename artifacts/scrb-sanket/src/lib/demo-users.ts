// Demo accounts for this prototype. These map a login email to the SCRB
// profile shown in the UI (role, district, badge). The actual password
// check happens entirely through Firebase Auth — create matching accounts
// in the Firebase console (Authentication tab) with these emails.
//
// Keep the emails here in sync with the full profiles (role, district,
// badge) in src/local-api/demo-profiles.ts.

export interface DemoAccount {
  email: string;
  role: 'investigator' | 'supervisor' | 'admin';
  label: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: 'investigator@scrb.demo', role: 'investigator', label: 'Investigator' },
  { email: 'supervisor@scrb.demo', role: 'supervisor', label: 'Supervisor' },
  { email: 'admin@scrb.demo', role: 'admin', label: 'Admin' },
];

export const DEMO_PASSWORD = 'scrb2024';
