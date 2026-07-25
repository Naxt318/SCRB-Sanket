// SYNTHETIC DATA — No real case records, no real persons, no real case references.
// All data is algorithmically generated for demonstration purposes only.

export interface SyntheticFir {
  id: string;
  firNumber: string;
  district: string;
  policeStation: string;
  crimeType: string;
  subType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  status: "registered" | "under_investigation" | "chargesheeted" | "closed";
  latitude: number;
  longitude: number;
  personIds: string[];
  description: string;
  isSynthetic: boolean;
}

export interface SyntheticPerson {
  id: string;
  alias: string; // anonymized alias only
  district: string;
  crimeTypes: string[];
  caseIds: string[];
  group: number;
}

export const DISTRICTS = [
  { id: "bengaluru_urban", name: "Bengaluru Urban", lat: 12.9716, lng: 77.5946, stationCount: 112 },
  { id: "mysuru", name: "Mysuru", lat: 12.2958, lng: 76.6394, stationCount: 35 },
  { id: "dakshina_kannada", name: "Dakshina Kannada", lat: 12.8438, lng: 74.9900, stationCount: 28 },
  { id: "tumakuru", name: "Tumakuru", lat: 13.3379, lng: 77.1010, stationCount: 30 },
  { id: "belagavi", name: "Belagavi", lat: 15.8497, lng: 74.4977, stationCount: 45 },
  { id: "kalaburagi", name: "Kalaburagi", lat: 17.3297, lng: 76.8175, stationCount: 32 },
];

export const CRIME_TYPES = [
  "Chain Snatching",
  "Theft",
  "Cybercrime",
  "Narcotics",
  "Assault",
  "Burglary",
  "Vehicle Theft",
  "Fraud",
  "Robbery",
  "Domestic Violence",
];

const STATIONS: Record<string, string[]> = {
  bengaluru_urban: ["Cubbon Park PS", "Whitefield PS", "Koramangala PS", "Indiranagar PS", "Yeshwanthpur PS", "Jayanagar PS", "Majestic PS", "HSR Layout PS"],
  mysuru: ["Nazarbad PS", "Chamaraja PS", "Krishnamurthypuram PS", "Vijayanagar PS"],
  dakshina_kannada: ["Mangaluru North PS", "Mangaluru South PS", "Bantwal PS", "Puttur PS"],
  tumakuru: ["Tumakuru Urban PS", "Sira PS", "Tiptur PS", "Madhugiri PS"],
  belagavi: ["Belagavi Urban PS", "Hubli North PS", "Hubli South PS", "Dharwad PS"],
  kalaburagi: ["Kalaburagi Urban PS", "Bidar PS", "Raichur PS", "Yadgir PS"],
};

const SUBTYPES: Record<string, string[]> = {
  "Chain Snatching": ["Gold chain", "Mobile phone snatch", "Bag snatch"],
  "Theft": ["Shoplifting", "Pickpocketing", "House theft"],
  "Cybercrime": ["Online fraud", "Identity theft", "Phishing", "Ransomware"],
  "Narcotics": ["Ganja possession", "Brown sugar", "MDMA", "Synthetic drugs"],
  "Assault": ["Road rage", "Domestic dispute", "Gang fight"],
  "Burglary": ["Residential", "Commercial", "Bank ATM"],
  "Vehicle Theft": ["Two-wheeler", "Four-wheeler", "Auto-rickshaw"],
  "Fraud": ["Banking fraud", "Investment scam", "Property fraud"],
  "Robbery": ["Armed robbery", "Unarmed robbery"],
  "Domestic Violence": ["Physical abuse", "Dowry harassment"],
};

const STATUSES: SyntheticFir["status"][] = ["registered", "under_investigation", "chargesheeted", "closed"];
const STATUS_WEIGHTS = [0.15, 0.45, 0.2, 0.2];

function weightedRandom<T>(items: T[], weights: number[]): T {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (r < cumulative) return items[i];
  }
  return items[items.length - 1];
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function generateDate(seed: number, monthsBack: number = 18): string {
  const now = new Date("2026-07-24");
  const daysBack = Math.floor(seededRandom(seed) * monthsBack * 30);
  const d = new Date(now.getTime() - daysBack * 86400000);
  return d.toISOString().split("T")[0];
}

function generateTime(seed: number): string {
  const hour = Math.floor(seededRandom(seed * 3) * 24);
  const min = Math.floor(seededRandom(seed * 7) * 60);
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function jitter(base: number, amount: number, seed: number): number {
  return base + (seededRandom(seed) - 0.5) * amount;
}

// Generate persons of interest
export function generatePersons(): SyntheticPerson[] {
  const persons: SyntheticPerson[] = [];
  const groupCount = 8;
  for (let i = 0; i < 60; i++) {
    const districtIdx = Math.floor(seededRandom(i * 13) * DISTRICTS.length);
    const crimeCount = 1 + Math.floor(seededRandom(i * 17) * 3);
    const crimeTypes = Array.from({ length: crimeCount }, (_, j) =>
      CRIME_TYPES[Math.floor(seededRandom(i * 11 + j) * CRIME_TYPES.length)]
    ).filter((v, idx, arr) => arr.indexOf(v) === idx);

    persons.push({
      id: `POI-${String(i + 1).padStart(3, "0")}`,
      alias: `Subject-${String(i + 1).padStart(3, "0")}`,
      district: DISTRICTS[districtIdx].id,
      crimeTypes,
      caseIds: [],
      group: Math.floor(seededRandom(i * 19) * groupCount),
    });
  }
  return persons;
}

// Generate ~500 FIR records
export function generateFirs(): SyntheticFir[] {
  const firs: SyntheticFir[] = [];
  const persons = generatePersons();

  // Inject a realistic chain-snatching spike in Bengaluru Urban in recent months
  const spikeCrimeType = "Chain Snatching";
  const spikeDistrict = "bengaluru_urban";

  for (let i = 0; i < 520; i++) {
    const seed = i * 37 + 1;
    const districtObj = DISTRICTS[Math.floor(seededRandom(seed) * DISTRICTS.length)];
    const districtId = districtObj.id;
    const stations = STATIONS[districtId];
    const station = stations[Math.floor(seededRandom(seed * 2) * stations.length)];

    // Spike: more chain snatching in Bengaluru Urban in last 3 months
    let crimeType: string;
    let daysBack: number;
    if (i < 60 && districtId === spikeDistrict) {
      crimeType = spikeCrimeType;
      daysBack = Math.floor(seededRandom(seed * 5) * 90); // last 3 months
    } else {
      crimeType = CRIME_TYPES[Math.floor(seededRandom(seed * 3) * CRIME_TYPES.length)];
      daysBack = Math.floor(seededRandom(seed * 5) * 540);
    }

    const now = new Date("2026-07-24");
    const d = new Date(now.getTime() - daysBack * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const monthStr = dateStr.substring(0, 7);

    const subtypes = SUBTYPES[crimeType] || ["General"];
    const subType = subtypes[Math.floor(seededRandom(seed * 6) * subtypes.length)];

    // Assign 0-3 persons of interest
    const personCount = Math.floor(seededRandom(seed * 8) * 4);
    const personIds: string[] = [];
    for (let p = 0; p < personCount; p++) {
      const personIdx = Math.floor(seededRandom(seed * 9 + p) * persons.length);
      const pid = persons[personIdx].id;
      if (!personIds.includes(pid)) {
        personIds.push(pid);
        if (!persons[personIdx].caseIds.includes(`FIR-${String(i + 1).padStart(4, "0")}`)) {
          persons[personIdx].caseIds.push(`FIR-${String(i + 1).padStart(4, "0")}`);
          if (!persons[personIdx].crimeTypes.includes(crimeType)) {
            persons[personIdx].crimeTypes.push(crimeType);
          }
        }
      }
    }

    firs.push({
      id: `FIR-${String(i + 1).padStart(4, "0")}`,
      firNumber: `KA-${districtId.substring(0, 3).toUpperCase()}/${monthStr.replace("-", "/")}/CR/${String(Math.floor(seededRandom(seed * 11) * 900) + 100)}`,
      district: districtId,
      policeStation: station,
      crimeType,
      subType,
      dateOfIncident: dateStr,
      timeOfIncident: generateTime(seed),
      status: weightedRandom(STATUSES, STATUS_WEIGHTS),
      latitude: jitter(districtObj.lat, 0.3, seed * 13),
      longitude: jitter(districtObj.lng, 0.3, seed * 17),
      personIds,
      description: `[SYNTHETIC] ${crimeType} — ${subType} reported at ${station}, ${districtObj.name} district. No real persons or cases referenced.`,
      isSynthetic: true,
    });
  }

  return firs;
}

// Singleton cache
let _firs: SyntheticFir[] | null = null;
let _persons: SyntheticPerson[] | null = null;

export function getFirs(): SyntheticFir[] {
  if (!_firs) _firs = generateFirs();
  return _firs;
}

export function getPersons(): SyntheticPerson[] {
  if (!_persons) _persons = generatePersons();
  return _persons;
}
