import { prisma } from "../db.js";
import { getFirs as getSyntheticFirs, SyntheticFir } from "../controllers/synthetic-firs.js";

export interface CorrelationResult {
  firId: string;
  relatedFirId: string;
  score: number; // 0 to 100
  reasons: string[];
  sharedEntities: string[];
  spatialDistanceKm: number;
  temporalDaysDiff: number;
  moSimilarity: number;
  relatedFir: any;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function textSimilarity(desc1: string, desc2: string): number {
  const words1 = new Set(desc1.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  const words2 = new Set(desc2.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  if (words1.size === 0 || words2.size === 0) return 0;
  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return Math.round((intersection.size / union.size) * 100);
}

export async function getCaseCorrelations(params: {
  firId?: string;
  district?: string;
  crimeType?: string;
  limit?: number;
  minScore?: number;
}): Promise<CorrelationResult[]> {
  const limit = params.limit || 20;
  const minScore = params.minScore || 30;

  let allFirs: any[] = [];
  try {
    allFirs = await prisma.fir.findMany({
      include: { persons: true },
      orderBy: { dateOfIncident: "desc" },
    });
  } catch {
    allFirs = getSyntheticFirs().map((f: SyntheticFir) => ({
      ...f,
      persons: f.personIds.map((pid: string) => ({ personId: pid })),
    }));
  }

  if (allFirs.length === 0) return [];

  let targetFirs = allFirs;
  if (params.firId) {
    targetFirs = allFirs.filter((f) => f.id === params.firId);
  } else {
    if (params.district) targetFirs = targetFirs.filter((f) => f.district === params.district);
    if (params.crimeType) targetFirs = targetFirs.filter((f) => f.crimeType === params.crimeType);
    targetFirs = targetFirs.slice(0, 10);
  }

  const results: CorrelationResult[] = [];

  for (const target of targetFirs) {
    const candidates = allFirs.filter((f) => f.id !== target.id);

    for (const candidate of candidates) {
      const reasons: string[] = [];
      const sharedEntities: string[] = [];
      let score = 0;

      // 1. Person overlap
      const targetPersons = new Set((target.persons || []).map((p: any) => p.personId));
      const candidatePersons = (candidate.persons || []).map((p: any) => p.personId);
      const shared = candidatePersons.filter((pid: string) => targetPersons.has(pid));
      if (shared.length > 0) {
        score += 35 * shared.length;
        sharedEntities.push(...shared);
        reasons.push(`Shared offender/person of interest (${shared.join(", ")})`);
      }

      // 2. Spatial proximity
      const distKm = haversineDistance(target.latitude, target.longitude, candidate.latitude, candidate.longitude);
      if (distKm <= 3.0) {
        score += 25;
        reasons.push(`Close spatial proximity (${distKm} km apart)`);
      } else if (distKm <= 10.0) {
        score += 15;
        reasons.push(`Same geographic cluster (${distKm} km apart)`);
      }

      if (target.district === candidate.district) {
        score += 10;
        reasons.push(`Same district (${target.district})`);
      }
      if (target.policeStation === candidate.policeStation) {
        score += 10;
        reasons.push(`Same police station (${target.policeStation})`);
      }

      // 3. Crime Type & SubType
      if (target.crimeType === candidate.crimeType) {
        score += 15;
        reasons.push(`Identical crime category (${target.crimeType})`);
      }
      if (target.subType === candidate.subType) {
        score += 10;
        reasons.push(`Matching subtype (${target.subType})`);
      }

      // 4. Temporal proximity
      const tDate = new Date(target.dateOfIncident).getTime();
      const cDate = new Date(candidate.dateOfIncident).getTime();
      const daysDiff = Math.abs(Math.round((tDate - cDate) / 86400000));
      if (daysDiff <= 3) {
        score += 20;
        reasons.push(`Occurred within 3 days (${daysDiff} days diff)`);
      } else if (daysDiff <= 14) {
        score += 10;
        reasons.push(`Occurred within 2 weeks (${daysDiff} days diff)`);
      }

      // 5. Text & MO Similarity
      const textSim = textSimilarity(target.description || "", candidate.description || "");
      if (textSim > 25) {
        score += 15;
        reasons.push(`Similar description & MO characteristics (${textSim}% keyword overlap)`);
      }

      const finalScore = Math.min(Math.round(score), 99);
      if (finalScore >= minScore) {
        results.push({
          firId: target.id,
          relatedFirId: candidate.id,
          score: finalScore,
          reasons,
          sharedEntities,
          spatialDistanceKm: distKm,
          temporalDaysDiff: daysDiff,
          moSimilarity: textSim,
          relatedFir: {
            id: candidate.id,
            firNumber: candidate.firNumber,
            district: candidate.district,
            policeStation: candidate.policeStation,
            crimeType: candidate.crimeType,
            subType: candidate.subType,
            dateOfIncident: candidate.dateOfIncident,
            status: candidate.status,
            latitude: candidate.latitude,
            longitude: candidate.longitude,
          },
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}
