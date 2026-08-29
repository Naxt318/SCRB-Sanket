import { prisma } from "../db.js";
import { getFirs as getSyntheticFirs, DISTRICTS, SyntheticFir } from "../controllers/synthetic-firs.js";

export interface RiskFactor {
  name: string;
  contribution: number; // e.g. +24
  description: string;
}

export interface RiskAssessment {
  district: string;
  districtName: string;
  crimeType?: string;
  riskScore: number; // 0 to 100
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: RiskFactor[];
  summary: string;
}

function fixedNow(): Date {
  return new Date("2026-07-24");
}

export async function getRiskScoring(params: {
  district?: string;
  crimeType?: string;
  periodDays?: number;
}): Promise<RiskAssessment[]> {
  const periodDays = params.periodDays || 30;

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
  const currentPeriodCutoff = new Date(now.getTime() - periodDays * 86400000).toISOString().split("T")[0];
  const priorPeriodCutoff = new Date(now.getTime() - periodDays * 2 * 86400000).toISOString().split("T")[0];

  const targetDistricts = params.district ? DISTRICTS.filter((d) => d.id === params.district) : DISTRICTS;

  const assessments: RiskAssessment[] = [];

  for (const dObj of targetDistricts) {
    let dFirs = firs.filter((f) => f.district === dObj.id);
    if (params.crimeType) dFirs = dFirs.filter((f) => f.crimeType === params.crimeType);

    const currentFirs = dFirs.filter((f) => f.dateOfIncident >= currentPeriodCutoff);
    const priorFirs = dFirs.filter((f) => f.dateOfIncident >= priorPeriodCutoff && f.dateOfIncident < currentPeriodCutoff);

    const factors: RiskFactor[] = [];
    let baseScore = 20; // baseline risk

    // 1. Recent Volume Factor
    const recentCount = currentFirs.length;
    const volumeContrib = Math.min(Math.round(recentCount * 0.8), 25);
    factors.push({
      name: "Recent Incident Volume",
      contribution: volumeContrib,
      description: `${recentCount} incidents recorded in the past ${periodDays} days`,
    });

    // 2. Crime Growth Rate Factor
    const priorCount = priorFirs.length;
    const growthPercent = priorCount > 0 ? Math.round(((recentCount - priorCount) / priorCount) * 100) : 0;
    const growthContrib = Math.max(Math.min(Math.round(growthPercent * 0.3), 25), 0);
    factors.push({
      name: "Crime Surge / Growth Rate",
      contribution: growthContrib,
      description: growthPercent > 0 ? `+${growthPercent}% surge compared to prior period` : `Stable / declining trend`,
    });

    // 3. Temporal Concentration Factor (Nighttime)
    const nightFirs = currentFirs.filter((f) => {
      const hour = parseInt((f.timeOfIncident || "00").split(":")[0], 10) || 0;
      return hour >= 22 || hour < 4;
    });
    const nightPercent = recentCount > 0 ? Math.round((nightFirs.length / recentCount) * 100) : 0;
    const nightContrib = Math.min(Math.round(nightPercent * 0.2), 20);
    factors.push({
      name: "Late-Night Temporal Concentration",
      contribution: nightContrib,
      description: `${nightPercent}% of incidents occurred between 22:00 and 04:00`,
    });

    // 4. Spatial Hotspot Clustering Factor
    const stationMap: Record<string, number> = {};
    currentFirs.forEach((f) => {
      stationMap[f.policeStation] = (stationMap[f.policeStation] || 0) + 1;
    });
    const maxStationCount = Math.max(...Object.values(stationMap), 0);
    const clusterContrib = Math.min(maxStationCount * 3, 15);
    factors.push({
      name: "Police Station Hotspot Concentration",
      contribution: clusterContrib,
      description: maxStationCount > 0 ? `High density concentration near top station (${maxStationCount} cases)` : "Distributed evenly",
    });

    const totalScore = Math.min(baseScore + volumeContrib + growthContrib + nightContrib + clusterContrib, 98);

    let riskLevel: RiskAssessment["riskLevel"] = "LOW";
    if (totalScore >= 75) riskLevel = "CRITICAL";
    else if (totalScore >= 60) riskLevel = "HIGH";
    else if (totalScore >= 40) riskLevel = "MODERATE";

    assessments.push({
      district: dObj.id,
      districtName: dObj.name,
      crimeType: params.crimeType,
      riskScore: totalScore,
      riskLevel,
      factors,
      summary: `Area Risk Score for ${dObj.name} is ${totalScore}/100 (${riskLevel} RISK). Driven primarily by ${factors[0].name} (+${factors[0].contribution}) and ${factors[1].name} (+${factors[1].contribution}).`,
    });
  }

  assessments.sort((a, b) => b.riskScore - a.riskScore);
  return assessments;
}
