import { CRIME_TYPES, DISTRICTS, getFirs, getPersons, type SyntheticFir } from './synthetic-firs';

const DAY = 86_400_000;
const REFERENCE_DATE = new Date('2026-07-24T00:00:00Z');

function districtName(id: string) {
  return DISTRICTS.find((district) => district.id === id)?.name ?? id;
}

function distanceKm(a: SyntheticFir, b: SyntheticFir) {
  const radius = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)) * 10) / 10;
}

function similarity(a: string, b: string) {
  const left = new Set(a.toLowerCase().split(/\W+/).filter((word) => word.length > 3));
  const right = new Set(b.toLowerCase().split(/\W+/).filter((word) => word.length > 3));
  const union = new Set([...left, ...right]);
  if (!union.size) return 0;
  return Math.round(([...left].filter((word) => right.has(word)).length / union.size) * 100);
}

export function searchIntelligence(query: string) {
  const normalized = query.toLowerCase().trim();
  const keywords = normalized.split(/\W+/).filter((word) => word.length > 2);
  const results = getFirs().flatMap((fir) => {
    const district = districtName(fir.district);
    const fields = {
      crimeType: fir.crimeType.toLowerCase(),
      district: district.toLowerCase(),
      policeStation: fir.policeStation.toLowerCase(),
      subType: fir.subType.toLowerCase(),
      description: fir.description.toLowerCase(),
    };
    let score = 0;
    const matchedFields: string[] = [];
    const reasons: string[] = [];

    if (normalized.includes(fir.id.toLowerCase()) || normalized.includes(fir.firNumber.toLowerCase())) {
      score += 60;
      matchedFields.push('firNumber');
      reasons.push('Exact FIR identifier match');
    }
    if (normalized.includes(fields.crimeType)) {
      score += 30;
      matchedFields.push('crimeType');
      reasons.push(`Crime category match: ${fir.crimeType}`);
    }
    if (normalized.includes(fields.district)) {
      score += 25;
      matchedFields.push('district');
      reasons.push(`District match: ${district}`);
    }

    const searchable = Object.entries(fields);
    const hits = keywords.filter((keyword) => searchable.some(([, value]) => value.includes(keyword)));
    if (hits.length) {
      score += Math.min(hits.length * 14, 42);
      matchedFields.push(...searchable.filter(([, value]) => hits.some((hit) => value.includes(hit))).map(([key]) => key));
      reasons.push(`Matched ${hits.length} intelligence keyword${hits.length === 1 ? '' : 's'}`);
    }

    if (score < 20) return [];
    return [{
      firId: fir.id,
      firNumber: fir.firNumber,
      district: fir.district,
      districtName: district,
      policeStation: fir.policeStation,
      crimeType: fir.crimeType,
      subType: fir.subType,
      dateOfIncident: fir.dateOfIncident,
      timeOfIncident: fir.timeOfIncident,
      description: fir.description,
      score: Math.min(score, 99),
      matchedFields: [...new Set(matchedFields)],
      reasons,
    }];
  }).sort((a, b) => b.score - a.score);

  return { query, results: results.slice(0, 30), totalMatches: results.length };
}

export function getCorrelations(params: URLSearchParams) {
  const all = getFirs();
  const targetId = params.get('firId');
  const district = params.get('district');
  const crimeType = params.get('crimeType');
  let targets = targetId ? all.filter((fir) => fir.id.toLowerCase() === targetId.toLowerCase()) : all;
  if (district) targets = targets.filter((fir) => fir.district === district);
  if (crimeType) targets = targets.filter((fir) => fir.crimeType === crimeType);

  const results = targets.slice(0, 10).flatMap((target) => all.filter((candidate) => candidate.id !== target.id).flatMap((candidate) => {
    const reasons: string[] = [];
    const sharedEntities = candidate.personIds.filter((id) => target.personIds.includes(id));
    const spatialDistanceKm = distanceKm(target, candidate);
    const temporalDaysDiff = Math.abs(Math.round((Date.parse(target.dateOfIncident) - Date.parse(candidate.dateOfIncident)) / DAY));
    const moSimilarity = similarity(target.description, candidate.description);
    let score = sharedEntities.length * 35;
    if (sharedEntities.length) reasons.push(`Shared person of interest (${sharedEntities.join(', ')})`);
    if (spatialDistanceKm <= 3) { score += 25; reasons.push(`Close spatial proximity (${spatialDistanceKm} km)`); }
    else if (spatialDistanceKm <= 10) { score += 15; reasons.push(`Same geographic cluster (${spatialDistanceKm} km)`); }
    if (target.district === candidate.district) { score += 10; reasons.push(`Same district (${districtName(target.district)})`); }
    if (target.crimeType === candidate.crimeType) { score += 15; reasons.push(`Identical crime category (${target.crimeType})`); }
    if (target.subType === candidate.subType) { score += 10; reasons.push(`Matching subtype (${target.subType})`); }
    if (temporalDaysDiff <= 3) { score += 20; reasons.push(`Occurred within ${temporalDaysDiff} days`); }
    else if (temporalDaysDiff <= 14) { score += 10; reasons.push(`Occurred within two weeks`); }
    if (moSimilarity > 25) { score += 15; reasons.push(`Similar MO language (${moSimilarity}% overlap)`); }
    score = Math.min(score, 99);
    if (score < 40) return [];
    return [{ firId: target.id, relatedFirId: candidate.id, score, reasons, sharedEntities, spatialDistanceKm, temporalDaysDiff, moSimilarity }];
  })).sort((a, b) => b.score - a.score).slice(0, 20);

  return { correlations: results };
}

function moAttributes(fir: SyntheticFir) {
  const hour = Number(fir.timeOfIncident.split(':')[0]);
  const timeWindow = hour >= 22 || hour < 4 ? 'Late Night (22:00-04:00)' : hour >= 18 ? 'Evening (18:00-22:00)' : 'Daytime (06:00-18:00)';
  const crime = fir.crimeType;
  return {
    entryMethod: crime === 'Cybercrime' ? 'Social Engineering / Phishing Link' : crime === 'Burglary' ? 'Forced Entry (Lock Snap)' : crime === 'Chain Snatching' ? 'Speeding Bike Pillion Snatch' : 'Direct Approach',
    weaponUsed: crime === 'Robbery' ? 'Sharp Object / Threat' : 'None Reported',
    targetType: crime === 'Cybercrime' ? 'Digital Banking / UPI Account' : crime === 'Chain Snatching' ? 'Pedestrian / Gold Jewelry' : fir.subType,
    timeWindow,
    escapeMethod: ['Chain Snatching', 'Vehicle Theft'].includes(crime) ? 'Two-Wheeler' : 'On Foot / Unspecified',
  };
}

export function getMoProfiles(params: URLSearchParams) {
  const district = params.get('district');
  const crimeType = params.get('crimeType');
  let firs = getFirs();
  if (district) firs = firs.filter((fir) => fir.district === district);
  if (crimeType) firs = firs.filter((fir) => fir.crimeType === crimeType);
  const profiles = firs.slice(0, 30).map((fir) => ({
    firId: fir.id,
    firNumber: fir.firNumber,
    district: fir.district,
    crimeType: fir.crimeType,
    subType: fir.subType,
    moAttributes: moAttributes(fir),
    similarCasesCount: firs.filter((candidate) => candidate.id !== fir.id && candidate.crimeType === fir.crimeType && candidate.subType === fir.subType).length,
  }));
  return { profiles };
}

export function getAnomalies(params: URLSearchParams) {
  const selectedDistrict = params.get('district');
  const selectedSeverity = params.get('severity');
  const recentCutoff = new Date(REFERENCE_DATE.getTime() - 90 * DAY).toISOString().slice(0, 10);
  const priorCutoff = new Date(REFERENCE_DATE.getTime() - 180 * DAY).toISOString().slice(0, 10);
  const anomalies = DISTRICTS.flatMap((district) => CRIME_TYPES.flatMap((crimeType) => {
    const group = getFirs().filter((fir) => fir.district === district.id && fir.crimeType === crimeType);
    const observedCount = group.filter((fir) => fir.dateOfIncident >= recentCutoff).length;
    const expectedCount = Math.max(group.filter((fir) => fir.dateOfIncident >= priorCutoff && fir.dateOfIncident < recentCutoff).length, 1);
    const percentChange = Math.round(((observedCount - expectedCount) / expectedCount) * 100);
    if (observedCount < 3 || percentChange < 40) return [];
    const severity = percentChange >= 150 ? 'CRITICAL' : percentChange >= 100 ? 'HIGH' : percentChange >= 65 ? 'MEDIUM' : 'LOW';
    const nightCount = group.filter((fir) => { const hour = Number(fir.timeOfIncident.split(':')[0]); return hour >= 22 || hour < 4; }).length;
    return [{
      id: `ANOM-${district.id}-${crimeType.replace(/\W/g, '').toLowerCase()}`,
      district: district.id,
      districtName: district.name,
      crimeType,
      expectedCount,
      observedCount,
      percentChange,
      severity,
      anomalyType: percentChange >= 100 ? 'VOLUME_SPIKE' : 'GEOGRAPHIC_CLUSTER',
      explanation: `${crimeType} reports are ${percentChange}% above the previous 90-day synthetic baseline in ${district.name}.`,
      confidence: Math.min(98, 72 + Math.round(percentChange / 8)),
      detectedAt: REFERENCE_DATE.toISOString(),
      indicators: [`${observedCount} recent vs ${expectedCount} baseline incidents`, `${nightCount} night-time records`, 'Synthetic demonstration signal'],
    }];
  })).filter((item) => (!selectedDistrict || item.district === selectedDistrict) && (!selectedSeverity || item.severity === selectedSeverity));
  return { anomalies: anomalies.sort((a, b) => b.percentChange - a.percentChange) };
}

export function getRiskAssessments(params: URLSearchParams) {
  const selectedDistrict = params.get('district');
  const selectedCrime = params.get('crimeType');
  const cutoff = new Date(REFERENCE_DATE.getTime() - 30 * DAY).toISOString().slice(0, 10);
  const assessments = DISTRICTS.filter((district) => !selectedDistrict || district.id === selectedDistrict).map((district) => {
    const firs = getFirs().filter((fir) => fir.district === district.id && (!selectedCrime || fir.crimeType === selectedCrime));
    const recent = firs.filter((fir) => fir.dateOfIncident >= cutoff);
    const night = recent.filter((fir) => { const hour = Number(fir.timeOfIncident.split(':')[0]); return hour >= 22 || hour < 4; });
    const stationCounts = recent.reduce<Record<string, number>>((counts, fir) => ({ ...counts, [fir.policeStation]: (counts[fir.policeStation] ?? 0) + 1 }), {});
    const factors = [
      { name: 'Recent Incident Volume', contribution: Math.min(25, Math.round(recent.length * 0.8)), description: `${recent.length} incidents in the last 30 days` },
      { name: 'Late-Night Concentration', contribution: Math.min(20, Math.round((night.length / Math.max(recent.length, 1)) * 20)), description: `${Math.round((night.length / Math.max(recent.length, 1)) * 100)}% recorded from 22:00–04:00` },
      { name: 'Station Hotspot Density', contribution: Math.min(15, Math.max(0, ...Object.values(stationCounts)) * 3), description: 'Concentration at the leading police-station cluster' },
      { name: 'Repeat MO Signal', contribution: Math.min(18, Math.round(firs.length / 8)), description: 'Recurring subtype and method signatures' },
    ];
    const riskScore = Math.min(98, 20 + factors.reduce((sum, factor) => sum + factor.contribution, 0));
    const riskLevel = riskScore >= 75 ? 'CRITICAL' : riskScore >= 60 ? 'HIGH' : riskScore >= 40 ? 'MODERATE' : 'LOW';
    return { district: district.id, districtName: district.name, crimeType: selectedCrime ?? undefined, riskScore, riskLevel, factors, summary: `${district.name} scores ${riskScore}/100, led by ${factors[0].name.toLowerCase()} and ${factors[1].name.toLowerCase()}.` };
  });
  return { assessments: assessments.sort((a, b) => b.riskScore - a.riskScore) };
}

const socioeconomic = {
  bengaluru_urban: [12500000, 4381, 90.9, 4.8, 87.7, 182.4, 'Rapid urbanization and density show a statistical association with property and cybercrime volume.'],
  mysuru: [3000000, 476, 41.5, 5.2, 72.8, 110.2, 'Tourism cycles show a statistical association with localized theft clusters.'],
  dakshina_kannada: [2080000, 430, 47.7, 4.1, 88.6, 125.6, 'Coastal transit hubs show a statistical association with financial and narcotics cases.'],
  tumakuru: [2670000, 253, 22.4, 6.1, 75.1, 94.8, 'Highway corridors show a localized association with vehicle theft and burglary.'],
  belagavi: [4770000, 356, 25.3, 5.8, 73.5, 105.3, 'Border proximity shows an association with multi-jurisdiction property offences.'],
  kalaburagi: [2560000, 233, 32.6, 7.2, 65.1, 118.9, 'Seasonal socioeconomic indicators show an association with dispute and assault frequency.'],
} as const;

export function getSocioeconomic(params: URLSearchParams) {
  const districtId = params.get('district');
  const data = DISTRICTS.filter((district) => !districtId || district.id === districtId).map((district) => {
    const [population, populationDensity, urbanizationRate, unemploymentRate, literacyRate, crimeRatePer100k, statisticalCorrelation] = socioeconomic[district.id as keyof typeof socioeconomic] ?? socioeconomic.bengaluru_urban;
    return { district: district.id, districtName: district.name, population, populationDensity, urbanizationRate, unemploymentRate, literacyRate, crimeRatePer100k, statisticalCorrelation };
  });
  return { data };
}

const WORKSPACE_KEY = 'scrb_investigation_workspaces';
const defaultWorkspace = {
  id: 'INV-001', title: 'Bengaluru Chain Snatching Taskforce', description: 'Cross-jurisdiction synthetic investigation connecting recurring two-wheeler snatching patterns.', status: 'active', assignedTo: 'Insp. R. Kumar', district: 'Bengaluru Urban', createdAt: '2026-07-20T10:00:00Z',
  firs: getFirs().slice(0, 2), persons: getPersons().slice(0, 2), findings: [{ id: 'FND-001', title: 'Spatial clustering', content: 'Recent incidents form a concentrated late-evening cluster.', confidence: 0.92 }],
};

function readWorkspaces() {
  try { return JSON.parse(localStorage.getItem(WORKSPACE_KEY) ?? '') as typeof defaultWorkspace[]; } catch { return [defaultWorkspace]; }
}

export function getWorkspaces() { return { workspaces: readWorkspaces() }; }

export function createWorkspace(body: Record<string, unknown>) {
  const workspaces = readWorkspaces();
  const created = {
    id: `INV-${String(workspaces.length + 1).padStart(3, '0')}`,
    title: String(body.title ?? 'Untitled Investigation'), description: String(body.description ?? ''), status: 'active', assignedTo: String(body.assignedTo ?? 'Investigator'), district: String(body.district ?? 'Bengaluru Urban'), createdAt: new Date().toISOString(),
    firs: getFirs().filter((fir) => (body.firIds as string[] | undefined)?.includes(fir.id)), persons: getPersons().filter((person) => (body.personIds as string[] | undefined)?.includes(person.id)), findings: [{ id: `FND-${Date.now()}`, title: 'Workspace initialized', content: 'Cases and persons linked for analyst review.', confidence: 0.85 }],
  };
  localStorage.setItem(WORKSPACE_KEY, JSON.stringify([created, ...workspaces]));
  return { workspace: created };
}

export function generateReport(body: Record<string, unknown>) {
  const districtId = String(body.district ?? 'bengaluru_urban');
  const crimeType = String(body.crimeType ?? 'Chain Snatching');
  const district = DISTRICTS.find((item) => item.id === districtId) ?? DISTRICTS[0];
  const relevant = getFirs().filter((fir) => fir.district === district.id && fir.crimeType === crimeType);
  const recent = relevant.filter((fir) => fir.dateOfIncident >= '2026-04-25');
  const cited = relevant.slice(0, 5).map((fir) => fir.id);
  return {
    title: `INTELLIGENCE BRIEF: ${crimeType.toUpperCase()} — ${district.name.toUpperCase()}`,
    generatedAt: new Date().toISOString(), district: district.name, crimeType,
    sections: {
      executiveSummary: `Automated analysis identified ${recent.length} recent synthetic ${crimeType.toLowerCase()} records in ${district.name}.`,
      crimeStatistics: `${relevant.length} total synthetic records were evaluated against the fixed demonstration reference date.`,
      emergingTrends: 'Temporal analysis highlights the highest-frequency reporting windows and recent directional change.',
      hotspots: `Geospatial density is concentrated around selected synthetic police-station coordinates near ${district.lat}, ${district.lng}.`,
      anomalies: 'Control-limit analysis compares the latest 90-day period with the preceding synthetic baseline.',
      relatedCases: 'Multi-signal matching combines category, subtype, location, timing, and shared anonymized entities.',
      networkFindings: `${new Set(relevant.flatMap((fir) => fir.personIds)).size} anonymized persons of interest appear across the selected record set.`,
      moPatterns: `${getMoProfiles(new URLSearchParams({ district: districtId, crimeType })).profiles[0]?.moAttributes.entryMethod ?? 'No dominant method'} is the leading generated MO signature.`,
      riskAssessment: `The explainable score is derived from incident volume, night-time concentration, hotspot density, and repeat MO signals.`,
      evidenceSources: `Synthetic evidence records: ${cited.join(', ') || 'No matching records'}.`,
      recommendedFocus: '1. Validate the signal with authorized source systems.\n2. Review linked cases and anonymized entities.\n3. Apply human judgment before operational action.',
    },
  };
}
