import { PrismaClient } from "../src/generated/client/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

const STATUSES = ["registered", "under_investigation", "chargesheeted", "closed"];
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

function generateTime(seed: number): string {
  const hour = Math.floor(seededRandom(seed * 3) * 24);
  const min = Math.floor(seededRandom(seed * 7) * 60);
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function jitter(base: number, amount: number, seed: number): number {
  return base + (seededRandom(seed) - 0.5) * amount;
}

async function seed() {
  console.log("Starting PostgreSQL database seed...");

  // Generate Persons
  const personRecords: Array<{
    id: string;
    alias: string;
    district: string;
    crimeTypes: string[];
    group: number;
  }> = [];

  const groupCount = 8;
  for (let i = 0; i < 60; i++) {
    const districtIdx = Math.floor(seededRandom(i * 13) * DISTRICTS.length);
    const crimeCount = 1 + Math.floor(seededRandom(i * 17) * 3);
    const crimeTypes = Array.from({ length: crimeCount }, (_, j) =>
      CRIME_TYPES[Math.floor(seededRandom(i * 11 + j) * CRIME_TYPES.length)]
    ).filter((v, idx, arr) => arr.indexOf(v) === idx);

    personRecords.push({
      id: `POI-${String(i + 1).padStart(3, "0")}`,
      alias: `Subject-${String(i + 1).padStart(3, "0")}`,
      district: DISTRICTS[districtIdx].id,
      crimeTypes,
      group: Math.floor(seededRandom(i * 19) * groupCount),
    });
  }

  // Seed Persons
  for (const person of personRecords) {
    await prisma.person.upsert({
      where: { id: person.id },
      update: {
        alias: person.alias,
        district: person.district,
        crimeTypes: person.crimeTypes,
        group: person.group,
      },
      create: person,
    });
  }
  console.log(`Seeded ${personRecords.length} Persons.`);

  // Generate FIRs
  const spikeCrimeType = "Chain Snatching";
  const spikeDistrict = "bengaluru_urban";

  const firPersonPairs: Array<{ firId: string; personId: string }> = [];

  for (let i = 0; i < 520; i++) {
    const seedNum = i * 37 + 1;
    const districtObj = DISTRICTS[Math.floor(seededRandom(seedNum) * DISTRICTS.length)];
    const districtId = districtObj.id;
    const stations = STATIONS[districtId];
    const station = stations[Math.floor(seededRandom(seedNum * 2) * stations.length)];

    let crimeType: string;
    let daysBack: number;
    if (i < 60 && districtId === spikeDistrict) {
      crimeType = spikeCrimeType;
      daysBack = Math.floor(seededRandom(seedNum * 5) * 90);
    } else {
      crimeType = CRIME_TYPES[Math.floor(seededRandom(seedNum * 3) * CRIME_TYPES.length)];
      daysBack = Math.floor(seededRandom(seedNum * 5) * 540);
    }

    const now = new Date("2026-07-24");
    const d = new Date(now.getTime() - daysBack * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const monthStr = dateStr.substring(0, 7);

    const subtypes = SUBTYPES[crimeType] || ["General"];
    const subType = subtypes[Math.floor(seededRandom(seedNum * 6) * subtypes.length)];

    const firId = `FIR-${String(i + 1).padStart(4, "0")}`;
    const firNumber = `KA-${districtId.substring(0, 3).toUpperCase()}/${monthStr.replace("-", "/")}/CR/${String(Math.floor(seededRandom(seedNum * 11) * 900) + 100)}`;

    const personCount = Math.floor(seededRandom(seedNum * 8) * 4);
    for (let p = 0; p < personCount; p++) {
      const personIdx = Math.floor(seededRandom(seedNum * 9 + p) * personRecords.length);
      const pid = personRecords[personIdx].id;
      if (!firPersonPairs.some((pair) => pair.firId === firId && pair.personId === pid)) {
        firPersonPairs.push({ firId, personId: pid });
      }
    }

    const status = weightedRandom(STATUSES, STATUS_WEIGHTS);
    const latitude = jitter(districtObj.lat, 0.3, seedNum * 13);
    const longitude = jitter(districtObj.lng, 0.3, seedNum * 17);
    const description = `[SYNTHETIC] ${crimeType} — ${subType} reported at ${station}, ${districtObj.name} district. No real persons or cases referenced.`;

    await prisma.fir.upsert({
      where: { id: firId },
      update: {
        firNumber,
        district: districtId,
        policeStation: station,
        crimeType,
        subType,
        dateOfIncident: dateStr,
        timeOfIncident: generateTime(seedNum),
        status,
        latitude,
        longitude,
        description,
        isSynthetic: true,
      },
      create: {
        id: firId,
        firNumber,
        district: districtId,
        policeStation: station,
        crimeType,
        subType,
        dateOfIncident: dateStr,
        timeOfIncident: generateTime(seedNum),
        status,
        latitude,
        longitude,
        description,
        isSynthetic: true,
      },
    });
  }

  console.log(`Seeded 520 FIRs.`);

  // Seed FirPerson junction
  for (const pair of firPersonPairs) {
    await prisma.firPerson.upsert({
      where: {
        firId_personId: {
          firId: pair.firId,
          personId: pair.personId,
        },
      },
      update: {},
      create: {
        firId: pair.firId,
        personId: pair.personId,
      },
    });
  }
  console.log(`Seeded ${firPersonPairs.length} FIR-Person links.`);

  // Seed Demo Users
  const demoUsers = [
    {
      id: "usr-investigator",
      email: "investigator@scrb.demo",
      name: "Insp. R. Kumar",
      role: "investigator",
      district: "Bengaluru Urban",
      badgeNumber: "KA-BU-1042",
    },
    {
      id: "usr-supervisor",
      email: "supervisor@scrb.demo",
      name: "DSP M. Nair",
      role: "supervisor",
      district: "Bengaluru Urban",
      badgeNumber: "KA-BU-0321",
    },
    {
      id: "usr-admin",
      email: "admin@scrb.demo",
      name: "SP J. Reddy",
      role: "admin",
      district: "SCRB HQ",
      badgeNumber: "KA-SCRB-001",
    },
  ];

  const defaultPasswordHash = bcrypt.hashSync("scrb2024", 10);

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        district: u.district,
        badgeNumber: u.badgeNumber,
        passwordHash: defaultPasswordHash,
      },
      create: {
        ...u,
        passwordHash: defaultPasswordHash,
      },
    });
  }
  console.log(`Seeded ${demoUsers.length} Demo Users.`);

  console.log("PostgreSQL database seeding complete.");
}

seed()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
