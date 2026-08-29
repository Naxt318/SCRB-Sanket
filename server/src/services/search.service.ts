import { prisma } from "../db.js";
import { getFirs as getSyntheticFirs, DISTRICTS, CRIME_TYPES, SyntheticFir } from "../controllers/synthetic-firs.js";

export interface IntelligenceSearchResult {
  firId: string;
  firNumber: string;
  district: string;
  districtName: string;
  policeStation: string;
  crimeType: string;
  subType: string;
  dateOfIncident: string;
  timeOfIncident: string;
  description: string;
  score: number; // 0 to 100
  matchedFields: string[];
  reasons: string[];
}

export interface SearchResponse {
  query: string;
  results: IntelligenceSearchResult[];
  totalMatches: number;
}

export async function searchIntelligence(queryStr: string): Promise<SearchResponse> {
  const queryLower = queryStr.toLowerCase().trim();
  const keywords = queryLower.split(/\W+/).filter((w) => w.length > 2);

  let firs: any[] = [];
  try {
    firs = await prisma.fir.findMany({
      include: { persons: true },
      orderBy: { dateOfIncident: "desc" },
    });
  } catch {
    firs = getSyntheticFirs().map((f: SyntheticFir) => ({
      ...f,
      persons: f.personIds.map((pid: string) => ({ personId: pid })),
    }));
  }

  const results: IntelligenceSearchResult[] = [];

  for (const fir of firs) {
    let score = 0;
    const matchedFields: string[] = [];
    const reasons: string[] = [];

    const descLower = (fir.description || "").toLowerCase();
    const stationLower = (fir.policeStation || "").toLowerCase();
    const typeLower = (fir.crimeType || "").toLowerCase();
    const subLower = (fir.subType || "").toLowerCase();
    const districtObj = DISTRICTS.find((d) => d.id === fir.district);
    const districtLower = (districtObj?.name || fir.district || "").toLowerCase();

    // 1. Direct Crime Type Match
    if (CRIME_TYPES.some((ct) => queryLower.includes(ct.toLowerCase()) && ct.toLowerCase() === typeLower)) {
      score += 30;
      matchedFields.push("crimeType");
      reasons.push(`Direct crime type match: ${fir.crimeType}`);
    }

    // 2. Direct District Match
    if (districtLower && queryLower.includes(districtLower)) {
      score += 25;
      matchedFields.push("district");
      reasons.push(`District location match: ${districtObj?.name ?? fir.district}`);
    }

    // 3. Keyword overlap in description & subtype
    let keywordHits = 0;
    keywords.forEach((kw) => {
      if (descLower.includes(kw)) {
        keywordHits++;
        if (!matchedFields.includes("description")) matchedFields.push("description");
      }
      if (subLower.includes(kw)) {
        score += 15;
        if (!matchedFields.includes("subType")) matchedFields.push("subType");
      }
      if (stationLower.includes(kw)) {
        score += 15;
        if (!matchedFields.includes("policeStation")) matchedFields.push("policeStation");
      }
    });

    if (keywordHits > 0) {
      score += Math.min(keywordHits * 12, 35);
      reasons.push(`Matched ${keywordHits} relevant keywords in case record description`);
    }

    // 4. Person ID or FIR Number match
    if (queryLower.includes(fir.id.toLowerCase()) || queryLower.includes(fir.firNumber.toLowerCase())) {
      score += 50;
      matchedFields.push("firNumber");
      reasons.push(`Exact FIR identifier match`);
    }

    if (score >= 20) {
      results.push({
        firId: fir.id,
        firNumber: fir.firNumber,
        district: fir.district,
        districtName: districtObj?.name ?? fir.district,
        policeStation: fir.policeStation,
        crimeType: fir.crimeType,
        subType: fir.subType,
        dateOfIncident: fir.dateOfIncident,
        timeOfIncident: fir.timeOfIncident,
        description: fir.description,
        score: Math.min(Math.round(score), 99),
        matchedFields,
        reasons,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return {
    query: queryStr,
    results: results.slice(0, 30),
    totalMatches: results.length,
  };
}
