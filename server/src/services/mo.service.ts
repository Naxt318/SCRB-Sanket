import { prisma } from "../db.js";
import { getFirs as getSyntheticFirs, SyntheticFir } from "../controllers/synthetic-firs.js";

export interface ModusOperandiProfile {
  firId: string;
  firNumber: string;
  district: string;
  crimeType: string;
  subType: string;
  moAttributes: {
    entryMethod: string;
    weaponUsed: string;
    targetType: string;
    timeWindow: string;
    escapeMethod: string;
  };
  similarCasesCount: number;
}

export function extractMOAttributes(fir: {
  crimeType: string;
  subType: string;
  description: string;
  timeOfIncident: string;
}): ModusOperandiProfile["moAttributes"] {
  const desc = (fir.description || "").toLowerCase();
  const time = fir.timeOfIncident || "00:00";
  const hour = parseInt(time.split(":")[0], 10) || 0;

  // Time window classification
  let timeWindow = "Daytime (06:00-18:00)";
  if (hour >= 22 || hour < 4) timeWindow = "Late Night (22:00-04:00)";
  else if (hour >= 18 && hour < 22) timeWindow = "Evening (18:00-22:00)";
  else if (hour >= 4 && hour < 6) timeWindow = "Early Morning (04:00-06:00)";

  // Entry method
  let entryMethod = "Unknown / Direct Approach";
  if (desc.includes("forced") || desc.includes("lock") || desc.includes("door")) entryMethod = "Forced Entry (Lock Snap)";
  else if (desc.includes("window") || desc.includes("grill")) entryMethod = "Window / Ventilation Grill Removal";
  else if (desc.includes("snatch") || desc.includes("pillion")) entryMethod = "Speeding Bike Pillion Snatch";
  else if (desc.includes("phishing") || desc.includes("online") || desc.includes("link")) entryMethod = "Social Engineering / Phishing Link";

  // Weapon used
  let weaponUsed = "None Reported";
  if (desc.includes("knife") || desc.includes("blade") || desc.includes("dagger")) weaponUsed = "Sharp Object / Knife";
  else if (desc.includes("iron rod") || desc.includes("crowbar") || desc.includes("lever")) weaponUsed = "Crowbar / Iron Rod";
  else if (desc.includes("gun") || desc.includes("pistol")) weaponUsed = "Firearm / Pistol";

  // Target type
  let targetType = "Individual / Public Space";
  if (desc.includes("gold") || desc.includes("jewel") || desc.includes("chain")) targetType = "Pedestrian / Gold Jewelry";
  else if (desc.includes("residential") || desc.includes("house") || desc.includes("villa")) targetType = "Unattended Residential Premises";
  else if (desc.includes("bank") || desc.includes("atm") || desc.includes("cash")) targetType = "Commercial / Financial Premises";
  else if (desc.includes("cyber") || desc.includes("account") || desc.includes("upi")) targetType = "Digital Banking / UPI Account";

  // Escape method
  let escapeMethod = "On Foot / Unspecified";
  if (desc.includes("two-wheeler") || desc.includes("bike") || desc.includes("scooter")) escapeMethod = "Stolen Two-Wheeler";
  else if (desc.includes("car") || desc.includes("auto")) escapeMethod = "Four-Wheeler / Hired Cab";

  return {
    entryMethod,
    weaponUsed,
    targetType,
    timeWindow,
    escapeMethod,
  };
}

export async function getModusOperandiIntelligence(params: {
  district?: string;
  crimeType?: string;
  firId?: string;
  limit?: number;
}): Promise<ModusOperandiProfile[]> {
  const limit = params.limit || 30;

  let firs: any[] = [];
  try {
    firs = await prisma.fir.findMany({ orderBy: { dateOfIncident: "desc" } });
  } catch {
    firs = getSyntheticFirs();
  }

  if (params.district) firs = firs.filter((f) => f.district === params.district);
  if (params.crimeType) firs = firs.filter((f) => f.crimeType === params.crimeType);
  if (params.firId) firs = firs.filter((f) => f.id === params.firId);

  const profiles: ModusOperandiProfile[] = firs.slice(0, limit).map((f) => {
    const mo = extractMOAttributes({
      crimeType: f.crimeType,
      subType: f.subType,
      description: f.description,
      timeOfIncident: f.timeOfIncident,
    });

    const similarCasesCount = firs.filter(
      (cand) => cand.id !== f.id && cand.crimeType === f.crimeType && cand.subType === f.subType
    ).length;

    return {
      firId: f.id,
      firNumber: f.firNumber,
      district: f.district,
      crimeType: f.crimeType,
      subType: f.subType,
      moAttributes: mo,
      similarCasesCount,
    };
  });

  return profiles;
}
