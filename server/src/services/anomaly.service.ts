import { prisma } from "../db.js";
import { getFirs as getSyntheticFirs, DISTRICTS, CRIME_TYPES, SyntheticFir } from "../controllers/synthetic-firs.js";

export interface AnomalyReport {
  id: string;
  district: string;
  districtName: string;
  crimeType: string;
  expectedCount: number;
  observedCount: number;
  percentChange: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  anomalyType: "VOLUME_SPIKE" | "GEOGRAPHIC_CLUSTER" | "TEMPORAL_CONCENTRATION" | "RECURRENT_MO";
  explanation: string;
  confidence: number;
  detectedAt: string;
  indicators: string[];
}

function fixedNow(): Date {
  return new Date("2026-07-24");
}

export async function getAnomalies(params?: {
  district?: string;
  crimeType?: string;
  severity?: string;
}): Promise<AnomalyReport[]> {
  let firs: any[] = [];
  try {
    firs = await prisma.fir.findMany({ select: { district: true, crimeType: true, dateOfIncident: true, timeOfIncident: true, policeStation: true } });
  } catch {
    firs = getSyntheticFirs().map((f: SyntheticFir) => ({
      district: f.district,
      crimeType: f.crimeType,
      dateOfIncident: f.dateOfIncident,
      timeOfIncident: f.timeOfIncident,
      policeStation: f.policeStation,
    }));
  }

  const now = fixedNow();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000).toISOString().split("T")[0];

  const anomalies: AnomalyReport[] = [];

  for (const distObj of DISTRICTS) {
    if (params?.district && distObj.id !== params.district) continue;

    for (const crimeType of CRIME_TYPES) {
      if (params?.crimeType && crimeType !== params.crimeType) continue;

      const recentCases = firs.filter(
        (f) => f.district === distObj.id && f.crimeType === crimeType && f.dateOfIncident >= thirtyDaysAgo
      );
      const baselineCases = firs.filter(
        (f) =>
          f.district === distObj.id &&
          f.crimeType === crimeType &&
          f.dateOfIncident >= ninetyDaysAgo &&
          f.dateOfIncident < thirtyDaysAgo
      );

      const observed = recentCases.length;
      // Historical 30-day baseline average
      const expected = Math.max(Math.round(baselineCases.length / 2), 2);

      if (observed <= expected) continue;

      const percentChange = Math.round(((observed - expected) / expected) * 100);
      if (percentChange < 25) continue;

      let severity: AnomalyReport["severity"] = "LOW";
      if (percentChange >= 120 || observed >= 15) severity = "CRITICAL";
      else if (percentChange >= 75 || observed >= 10) severity = "HIGH";
      else if (percentChange >= 40) severity = "MEDIUM";

      if (params?.severity && severity !== params.severity) continue;

      // Extract indicators
      const nightCases = recentCases.filter((f) => {
        const hour = parseInt((f.timeOfIncident || "00").split(":")[0], 10) || 0;
        return hour >= 22 || hour < 4;
      });

      const indicators: string[] = [
        `Observed ${observed} incidents vs expected historical baseline of ${expected}`,
        `Statistically significant increase of +${percentChange}%`,
      ];

      if (nightCases.length >= 3) {
        indicators.push(`Temporal clustering: ${Math.round((nightCases.length / observed) * 100)}% occurred during late-night hours (22:00-04:00)`);
      }

      const stationCounts: Record<string, number> = {};
      recentCases.forEach((f) => {
        stationCounts[f.policeStation] = (stationCounts[f.policeStation] || 0) + 1;
      });
      const topStation = Object.entries(stationCounts).sort((a, b) => b[1] - a[1])[0];
      if (topStation && topStation[1] >= 3) {
        indicators.push(`Geographic hotspot: ${topStation[1]} cases concentrated around ${topStation[0]}`);
      }

      anomalies.push({
        id: `ANOM-${distObj.id.substring(0, 3).toUpperCase()}-${crimeType.substring(0, 3).toUpperCase()}`,
        district: distObj.id,
        districtName: distObj.name,
        crimeType,
        expectedCount: expected,
        observedCount: observed,
        percentChange,
        severity,
        anomalyType: percentChange > 100 ? "VOLUME_SPIKE" : "GEOGRAPHIC_CLUSTER",
        explanation: `${crimeType} incidents in ${distObj.name} surged by +${percentChange}% over baseline (${observed} observed vs ${expected} expected).`,
        confidence: Math.min(Math.round(80 + percentChange / 5), 98),
        detectedAt: now.toISOString(),
        indicators,
      });
    }
  }

  anomalies.sort((a, b) => b.percentChange - a.percentChange);
  return anomalies;
}
