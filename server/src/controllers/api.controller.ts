import { Response } from "express";
import { prisma } from "../db.js";
import { AuthenticatedRequest, JWT_SECRET } from "../middleware/auth.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getFirs as getSyntheticFirs, getPersons as getSyntheticPersons, SyntheticFir, SyntheticPerson } from "./synthetic-firs.js";
import { getCaseCorrelations } from "../services/correlation.service.js";
import { getIntelligenceNetwork } from "../services/network.service.js";
import { getModusOperandiIntelligence } from "../services/mo.service.js";
import { getAnomalies } from "../services/anomaly.service.js";
import { getRiskScoring } from "../services/risk.service.js";
import { searchIntelligence } from "../services/search.service.js";
import { processAIQuery, processGroundedAIQuery } from "../services/ai.service.js";
import { getInvestigations, createInvestigation } from "../services/workspace.service.js";
import { generateIntelligenceReport } from "../services/report.service.js";
import { getSocioeconomicContext } from "../services/socioeconomic.service.js";

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

function districtName(id: string): string {
  return DISTRICTS.find((d) => d.id === id)?.name ?? id;
}

function fixedNow(): Date {
  return new Date("2026-07-24");
}

const chatSessions = new Map<string, any[]>();
const memoryAuditLogs: any[] = [];

export async function handleHealthz(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err: any) {
    res.json({ status: "ok", db: "in_memory_fallback", note: "PostgreSQL offline, running in-memory engine" });
  }
}

const DEMO_USERS_MAP: Record<string, { id: string; name: string; role: "investigator" | "supervisor" | "admin"; district: string; badgeNumber: string }> = {
  "investigator@scrb.demo": {
    id: "usr-investigator",
    name: "Insp. R. Kumar",
    role: "investigator",
    district: "Bengaluru Urban",
    badgeNumber: "KA-BU-1042",
  },
  "supervisor@scrb.demo": {
    id: "usr-supervisor",
    name: "DSP M. Nair",
    role: "supervisor",
    district: "Bengaluru Urban",
    badgeNumber: "KA-BU-0321",
  },
  "admin@scrb.demo": {
    id: "usr-admin",
    name: "SP J. Reddy",
    role: "admin",
    district: "SCRB HQ",
    badgeNumber: "KA-SCRB-001",
  },
};

export async function handleLogin(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { email, password } = req.body || {};
  if (!email || !password || typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  let user: any = null;

  try {
    user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
  } catch (err) {
    // Database connection fallback for local demo
  }

  if (user) {
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        district: user.district,
        badgeNumber: user.badgeNumber,
      },
    });
    return;
  }

  // Fallback demo user check if DB is unseeded or unreachable
  const demoProfile = DEMO_USERS_MAP[cleanEmail];
  if (demoProfile && password === "scrb2024") {
    const token = jwt.sign({ userId: demoProfile.id, email: cleanEmail }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: demoProfile.id,
        name: demoProfile.name,
        email: cleanEmail,
        role: demoProfile.role,
        district: demoProfile.district,
        badgeNumber: demoProfile.badgeNumber,
      },
    });
    return;
  }

  res.status(401).json({ error: "Invalid email or password" });
}

export async function handleLogout(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({ success: true });
}

export async function handleAuthMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    id: req.user.uid,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    district: req.user.district,
    badgeNumber: req.user.badgeNumber,
  });
}

export async function handleGetFirs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const district = (req.query.district as string) || undefined;
  const crimeType = (req.query.crimeType as string) || undefined;
  const startDate = (req.query.startDate as string) || undefined;
  const endDate = (req.query.endDate as string) || undefined;
  const limit = parseInt((req.query.limit as string) || "50", 10);
  const offset = parseInt((req.query.offset as string) || "0", 10);

  try {
    const where: any = {};
    if (district) where.district = district;
    if (crimeType) where.crimeType = crimeType;
    if (startDate || endDate) {
      where.dateOfIncident = {};
      if (startDate) where.dateOfIncident.gte = startDate;
      if (endDate) where.dateOfIncident.lte = endDate;
    }

    const [total, firs] = await Promise.all([
      prisma.fir.count({ where }),
      prisma.fir.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          persons: true,
        },
        orderBy: { dateOfIncident: "desc" },
      }),
    ]);

    const mappedData = firs.map((f: any) => ({
      id: f.id,
      firNumber: f.firNumber,
      district: f.district,
      policeStation: f.policeStation,
      crimeType: f.crimeType,
      subType: f.subType,
      dateOfIncident: f.dateOfIncident,
      timeOfIncident: f.timeOfIncident,
      status: f.status,
      latitude: f.latitude,
      longitude: f.longitude,
      personIds: f.persons.map((p: any) => p.personId),
      description: f.description,
      isSynthetic: f.isSynthetic,
    }));

    res.json({ data: mappedData, total, limit, offset });
  } catch {
    // Memory fallback
    let all = getSyntheticFirs();
    if (district) all = all.filter((f: SyntheticFir) => f.district === district);
    if (crimeType) all = all.filter((f: SyntheticFir) => f.crimeType === crimeType);
    if (startDate) all = all.filter((f: SyntheticFir) => f.dateOfIncident >= startDate);
    if (endDate) all = all.filter((f: SyntheticFir) => f.dateOfIncident <= endDate);

    const total = all.length;
    const page = all.slice(offset, offset + limit);
    res.json({ data: page, total, limit, offset });
  }
}

export async function handleFirSummary(_req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const totalFirs = await prisma.fir.count();
    const openCases = await prisma.fir.count({
      where: { status: { in: ["registered", "under_investigation"] } },
    });
    const closedCases = await prisma.fir.count({
      where: { status: { in: ["closed", "chargesheeted"] } },
    });

    const typeGroup = await prisma.fir.groupBy({
      by: ["crimeType"],
      _count: { crimeType: true },
      orderBy: { _count: { crimeType: "desc" } },
      take: 1,
    });
    const topCrimeType = typeGroup[0]?.crimeType ?? "";

    const districtGroup = await prisma.fir.groupBy({
      by: ["district"],
      _count: { district: true },
      orderBy: { _count: { district: "desc" } },
      take: 1,
    });
    const topDistrictId = districtGroup[0]?.district ?? "";
    const topDistrict = districtName(topDistrictId);

    const now = fixedNow();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
    const recentCount = await prisma.fir.count({
      where: { dateOfIncident: { gte: thirtyDaysAgo } },
    });

    const statusGroup = await prisma.fir.groupBy({
      by: ["status"],
      _count: { status: true },
    });
    const byStatus = statusGroup.map((s: any) => ({ status: s.status, count: s._count.status }));

    res.json({
      totalFirs,
      openCases,
      closedCases,
      topCrimeType,
      topDistrict,
      recentCount,
      byStatus,
    });
  } catch {
    // Memory fallback
    const firs = getSyntheticFirs();
    const totalFirs = firs.length;
    const openCases = firs.filter((f: SyntheticFir) => f.status === "registered" || f.status === "under_investigation").length;
    const closedCases = firs.filter((f: SyntheticFir) => f.status === "closed" || f.status === "chargesheeted").length;

    const typeCounts: Record<string, number> = {};
    const districtCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};

    const now = fixedNow();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
    let recentCount = 0;

    firs.forEach((f: SyntheticFir) => {
      typeCounts[f.crimeType] = (typeCounts[f.crimeType] || 0) + 1;
      districtCounts[f.district] = (districtCounts[f.district] || 0) + 1;
      statusCounts[f.status] = (statusCounts[f.status] || 0) + 1;
      if (f.dateOfIncident >= thirtyDaysAgo) recentCount++;
    });

    const topCrimeType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const topDistrictId = Object.entries(districtCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

    const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

    res.json({
      totalFirs,
      openCases,
      closedCases,
      topCrimeType,
      topDistrict: districtName(topDistrictId),
      recentCount,
      byStatus,
    });
  }
}

export async function handleHotspots(req: AuthenticatedRequest, res: Response): Promise<void> {
  const crimeType = (req.query.crimeType as string) || undefined;
  const startDate = (req.query.startDate as string) || undefined;
  const endDate = (req.query.endDate as string) || undefined;

  try {
    const where: any = {};
    if (crimeType) where.crimeType = crimeType;
    if (startDate || endDate) {
      where.dateOfIncident = {};
      if (startDate) where.dateOfIncident.gte = startDate;
      if (endDate) where.dateOfIncident.lte = endDate;
    }

    const grouped = await prisma.fir.groupBy({
      by: ["district"],
      where,
      _count: { district: true },
    });

    const maxCount = Math.max(...grouped.map((g: any) => g._count.district), 1);

    const hotspots = grouped.map((g: any) => {
      const d = DISTRICTS.find((dist) => dist.id === g.district);
      return {
        lat: d?.lat ?? 12.97,
        lng: d?.lng ?? 77.59,
        intensity: Math.min(g._count.district / maxCount, 1),
        district: d?.name ?? g.district,
        crimeType: crimeType ?? "All",
        count: g._count.district,
        label: d?.name ?? g.district,
      };
    });

    res.json(hotspots);
  } catch {
    // Memory fallback
    let firs = getSyntheticFirs();
    if (crimeType) firs = firs.filter((f: SyntheticFir) => f.crimeType === crimeType);
    if (startDate) firs = firs.filter((f: SyntheticFir) => f.dateOfIncident >= startDate);
    if (endDate) firs = firs.filter((f: SyntheticFir) => f.dateOfIncident <= endDate);

    const map: Record<string, number> = {};
    firs.forEach((f: SyntheticFir) => {
      map[f.district] = (map[f.district] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(map), 1);
    const hotspots = Object.entries(map).map(([distId, count]) => {
      const d = DISTRICTS.find((dist) => dist.id === distId);
      return {
        lat: d?.lat ?? 12.97,
        lng: d?.lng ?? 77.59,
        intensity: Math.min(count / maxCount, 1),
        district: d?.name ?? distId,
        crimeType: crimeType ?? "All",
        count,
        label: d?.name ?? distId,
      };
    });

    res.json(hotspots);
  }
}

export async function handleTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
  const crimeType = (req.query.crimeType as string) || undefined;
  const district = (req.query.district as string) || undefined;
  const monthsNum = Math.min(parseInt((req.query.months as string) || "12", 10) || 12, 24);

  let allFirs: Array<{ dateOfIncident: string }> = [];

  try {
    const where: any = {};
    if (crimeType) where.crimeType = crimeType;
    if (district) where.district = district;

    allFirs = await prisma.fir.findMany({
      where,
      select: { dateOfIncident: true },
    });
  } catch {
    // Memory fallback
    let firs = getSyntheticFirs();
    if (crimeType) firs = firs.filter((f: SyntheticFir) => f.crimeType === crimeType);
    if (district) firs = firs.filter((f: SyntheticFir) => f.district === district);
    allFirs = firs.map((f: SyntheticFir) => ({ dateOfIncident: f.dateOfIncident }));
  }

  const now = fixedNow();
  const series: Array<{ month: string; count: number; isForecast: boolean }> = [];

  for (let i = monthsNum - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = allFirs.filter((f: { dateOfIncident: string }) => f.dateOfIncident.startsWith(monthStr)).length;
    series.push({ month: monthStr, count, isForecast: false });
  }

  const lastN = series.slice(-4).map((s) => s.count);
  const avg = lastN.reduce((a, b) => a + b, 0) / (lastN.length || 1);
  const trend = (series[series.length - 1].count - (series[series.length - 4]?.count || 0)) / 3;

  const forecast: Array<{ month: string; count: number; isForecast: boolean }> = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    forecast.push({
      month: monthStr,
      count: Math.max(0, Math.round(avg + trend * i)),
      isForecast: true,
    });
  }

  const recent3 = series.slice(-3).reduce((s, m) => s + m.count, 0);
  const prior3 = series.slice(-6, -3).reduce((s, m) => s + m.count, 0);
  const percentChange = prior3 > 0 ? Math.round(((recent3 - prior3) / prior3) * 100) : 0;
  const trendDirection: "rising" | "falling" | "stable" =
    percentChange > 10 ? "rising" : percentChange < -10 ? "falling" : "stable";

  res.json({
    series,
    forecast,
    earlyWarning: trendDirection === "rising" && Math.abs(percentChange) > 20,
    trendDirection,
    percentChange,
  });
}

export async function handleByDistrict(_req: AuthenticatedRequest, res: Response): Promise<void> {
  let firs: Array<{ district: string; crimeType: string }> = [];

  try {
    firs = await prisma.fir.findMany({
      select: { district: true, crimeType: true },
    });
  } catch {
    firs = getSyntheticFirs().map((f: SyntheticFir) => ({ district: f.district, crimeType: f.crimeType }));
  }

  const map: Record<string, Record<string, number>> = {};
  firs.forEach((f: { district: string; crimeType: string }) => {
    if (!map[f.district]) map[f.district] = {};
    map[f.district][f.crimeType] = (map[f.district][f.crimeType] || 0) + 1;
  });

  const result = DISTRICTS.map((d) => {
    const breakdown = Object.entries(map[d.id] ?? {}).map(([crimeType, count]) => ({
      crimeType,
      count,
      trend: "stable",
    }));
    return {
      district: d.name,
      count: firs.filter((f: { district: string; crimeType: string }) => f.district === d.id).length,
      breakdown,
    };
  });

  res.json(result);
}

export async function handleByType(_req: AuthenticatedRequest, res: Response): Promise<void> {
  let firs: Array<{ crimeType: string; dateOfIncident: string }> = [];

  try {
    firs = await prisma.fir.findMany({
      select: { crimeType: true, dateOfIncident: true },
    });
  } catch {
    firs = getSyntheticFirs().map((f: SyntheticFir) => ({ crimeType: f.crimeType, dateOfIncident: f.dateOfIncident }));
  }

  const now = fixedNow();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().split("T")[0];

  const byType: Record<string, number> = {};
  const recent: Record<string, number> = {};
  const prior: Record<string, number> = {};

  firs.forEach((f: { crimeType: string; dateOfIncident: string }) => {
    byType[f.crimeType] = (byType[f.crimeType] || 0) + 1;
    if (f.dateOfIncident >= thirtyDaysAgo) recent[f.crimeType] = (recent[f.crimeType] || 0) + 1;
    else if (f.dateOfIncident >= sixtyDaysAgo) prior[f.crimeType] = (prior[f.crimeType] || 0) + 1;
  });

  const result = CRIME_TYPES.map((crimeType) => {
    const r = recent[crimeType] ?? 0;
    const p = prior[crimeType] ?? 0;
    const trend = r > p * 1.15 ? "rising" : r < p * 0.85 ? "falling" : "stable";
    return { crimeType, count: byType[crimeType] ?? 0, trend };
  }).sort((a, b) => b.count - a.count);

  res.json(result);
}

export async function handleEarlyWarnings(_req: AuthenticatedRequest, res: Response): Promise<void> {
  let firs: Array<{ district: string; crimeType: string; dateOfIncident: string }> = [];

  try {
    firs = await prisma.fir.findMany({
      select: { district: true, crimeType: true, dateOfIncident: true },
    });
  } catch {
    firs = getSyntheticFirs().map((f: SyntheticFir) => ({ district: f.district, crimeType: f.crimeType, dateOfIncident: f.dateOfIncident }));
  }

  const now = fixedNow();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().split("T")[0];

  const warnings: any[] = [];

  for (const district of DISTRICTS) {
    for (const crimeType of CRIME_TYPES) {
      const recentCases = firs.filter(
        (f: { district: string; crimeType: string; dateOfIncident: string }) =>
          f.district === district.id && f.crimeType === crimeType && f.dateOfIncident >= thirtyDaysAgo
      );
      const priorCases = firs.filter(
        (f: { district: string; crimeType: string; dateOfIncident: string }) =>
          f.district === district.id &&
          f.crimeType === crimeType &&
          f.dateOfIncident >= sixtyDaysAgo &&
          f.dateOfIncident < thirtyDaysAgo
      );

      const recentCount = recentCases.length;
      const previousCount = priorCases.length;

      if (recentCount < 3) continue;

      const percentIncrease = previousCount > 0 ? Math.round(((recentCount - previousCount) / previousCount) * 100) : 100;

      if (percentIncrease < 20) continue;

      const severity: "low" | "medium" | "high" | "critical" =
        percentIncrease > 100 ? "critical" : percentIncrease > 60 ? "high" : percentIncrease > 30 ? "medium" : "low";

      warnings.push({
        district: district.name,
        crimeType,
        percentIncrease,
        recentCount,
        previousCount,
        message: `${crimeType} in ${district.name} up ${percentIncrease}% compared to prior 30-day period. AI flags for human review.`,
        severity,
      });
    }
  }

  warnings.sort((a, b) => b.percentIncrease - a.percentIncrease);
  res.json(warnings.slice(0, 8));
}

export async function handleNetwork(req: AuthenticatedRequest, res: Response): Promise<void> {
  const personId = (req.query.personId as string) || undefined;
  const crimeType = (req.query.crimeType as string) || undefined;
  const district = (req.query.district as string) || undefined;

  let allFirs: any[] = [];
  let allPersons: any[] = [];

  try {
    allFirs = await prisma.fir.findMany({
      include: { persons: true },
    });
    allPersons = await prisma.person.findMany();
  } catch {
    allFirs = getSyntheticFirs().map((f: SyntheticFir) => ({
      ...f,
      persons: f.personIds.map((pid: string) => ({ personId: pid })),
    }));
    allPersons = getSyntheticPersons();
  }

  let filteredFirs = allFirs.filter((f: any) => f.persons.length > 0);
  if (crimeType) filteredFirs = filteredFirs.filter((f: any) => f.crimeType === crimeType);
  if (district) filteredFirs = filteredFirs.filter((f: any) => f.district === district);

  const relevantPersonIds: Set<string> = new Set();
  if (personId) {
    relevantPersonIds.add(personId);
    const relatedFirs = filteredFirs.filter((f: any) => f.persons.some((p: any) => p.personId === personId));
    relatedFirs.forEach((f: any) => f.persons.forEach((p: any) => relevantPersonIds.add(p.personId)));
  } else {
    filteredFirs.forEach((f: any) => f.persons.forEach((p: any) => relevantPersonIds.add(p.personId)));
  }

  const personIdList = Array.from(relevantPersonIds).slice(0, 40);

  const nodes = personIdList.map((pid) => {
    const person = allPersons.find((p: any) => p.id === pid);
    const personFirs = filteredFirs.filter((f: any) => f.persons.some((p: any) => p.personId === pid));
    const districtNameStr = DISTRICTS.find((d) => d.id === person?.district)?.name ?? person?.district ?? "Unknown";
    return {
      id: pid,
      label: person?.alias ?? pid,
      type: "person" as const,
      caseCount: personFirs.length,
      district: districtNameStr,
      crimeTypes: person?.crimeTypes ?? [],
      group: person?.group ?? 0,
    };
  });

  const edges: Array<{
    source: string;
    target: string;
    relationship: "co_accused" | "same_mo" | "shared_location" | "linked_case";
    caseId?: string;
  }> = [];

  const seenEdges = new Set<string>();

  filteredFirs.forEach((fir: any) => {
    const firPersons = fir.persons.map((p: any) => p.personId).filter((pid: string) => personIdList.includes(pid));
    for (let i = 0; i < firPersons.length; i++) {
      for (let j = i + 1; j < firPersons.length; j++) {
        const key = [firPersons[i], firPersons[j]].sort().join("--");
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({ source: firPersons[i], target: firPersons[j], relationship: "co_accused", caseId: fir.id });
        }
      }
    }
  });

  const personsByType: Record<string, string[]> = {};
  nodes.forEach((n) => {
    n.crimeTypes.forEach((ct: string) => {
      if (!personsByType[ct]) personsByType[ct] = [];
      personsByType[ct].push(n.id);
    });
  });

  Object.values(personsByType).forEach((pids) => {
    for (let i = 0; i < Math.min(pids.length, 5); i++) {
      for (let j = i + 1; j < Math.min(pids.length, 5); j++) {
        const key = [pids[i], pids[j]].sort().join("--mo--");
        if (!seenEdges.has(key)) {
          seenEdges.add(key);
          edges.push({ source: pids[i], target: pids[j], relationship: "same_mo" });
        }
      }
    }
  });

  res.json({ nodes, edges });
}

export async function handleAuditLog(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user || (req.user.role !== "supervisor" && req.user.role !== "admin")) {
    res.status(403).json({ error: "Access restricted to Supervisor and Admin roles" });
    return;
  }
  const limit = parseInt((req.query.limit as string) || "50", 10);
  try {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  } catch {
    res.json(memoryAuditLogs.slice(0, limit));
  }
}

export async function handleChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { message, language = "english", sessionId } = req.body || {};
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const sid = (sessionId as string) || crypto.randomUUID();
  const history = chatSessions.get(sid) || [];

  history.push({
    id: crypto.randomUUID(),
    sessionId: sid,
    role: "user",
    content: message,
    language,
    timestamp: new Date().toISOString(),
  });

  let firs: any[] = [];
  try {
    firs = await prisma.fir.findMany({
      include: { persons: true },
      orderBy: { dateOfIncident: "desc" },
      take: 50,
    });
  } catch {
    firs = getSyntheticFirs().slice(0, 50);
  }

  const responseId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const priorMessages = history.map((entry: any) => ({ role: entry.role, content: entry.content }));
  const intelligence = await processAIQuery(message, req.user?.uid, priorMessages);
  const answer = intelligence.answer;

  const assistantMsg = {
    id: responseId,
    sessionId: sid,
    role: "assistant",
    content: answer,
    language,
    timestamp,
    reasoning: intelligence.reasoning,
    sources: intelligence.sources,
    aiPowered: intelligence.aiPowered,
  };

  history.push(assistantMsg);
  chatSessions.set(sid, history);

  const logEntry = {
    id: crypto.randomUUID(),
    userId: req.user?.uid || "anonymous",
    userName: req.user?.name || "Anonymous",
    role: req.user?.role || "unknown",
    query: message,
    timestamp,
    resultsCount: firs.length,
    ipAddress: req.ip || "127.0.0.1",
    createdAt: new Date().toISOString(),
  };

  try {
    await prisma.auditLog.create({ data: logEntry });
  } catch {
    memoryAuditLogs.unshift(logEntry);
  }

  const mapData = firs.slice(0, 30).map((f: any) => {
    const d = DISTRICTS.find((dist) => dist.id === f.district);
    return {
      lat: f.latitude,
      lng: f.longitude,
      intensity: 0.8,
      district: d?.name ?? f.district,
      crimeType: f.crimeType,
      count: 1,
      label: f.firNumber,
    };
  });

  res.json({
    id: responseId,
    role: "assistant",
    content: answer,
    reasoning: assistantMsg.reasoning,
    sources: assistantMsg.sources,
    timestamp,
    chartData: null,
    mapData,
    firIds: firs.map((f: any) => f.id),
    aiPowered: intelligence.aiPowered,
  });
}

export async function handleChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const sessionId = (req.query.sessionId as string) || "";
  res.json(chatSessions.get(sessionId) || []);
}

export async function handleClearChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const sessionId = (req.query.sessionId as string) || "";
  chatSessions.delete(sessionId);
  res.json({ success: true });
}

export async function handleMetaDistricts(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(DISTRICTS);
}

export async function handleMetaCrimeTypes(_req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json(CRIME_TYPES);
}

// ── PHASE 3 INTELLIGENCE HANDLERS ──────────────────────────────────────────

export async function handleGetCorrelations(req: AuthenticatedRequest, res: Response): Promise<void> {
  const firId = (req.query.firId as string) || undefined;
  const district = (req.query.district as string) || undefined;
  const crimeType = (req.query.crimeType as string) || undefined;
  const limit = parseInt((req.query.limit as string) || "20", 10);
  const minScore = parseInt((req.query.minScore as string) || "30", 10);

  const correlations = await getCaseCorrelations({ firId, district, crimeType, limit, minScore });
  res.json({ correlations });
}

export async function handleGetIntelligenceNetwork(req: AuthenticatedRequest, res: Response): Promise<void> {
  const entityType = (req.query.entityType as string) || undefined;
  const district = (req.query.district as string) || undefined;
  const crimeType = (req.query.crimeType as string) || undefined;
  const personId = (req.query.personId as string) || undefined;
  const hops = parseInt((req.query.hops as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "50", 10);

  const result = await getIntelligenceNetwork({ entityType, district, crimeType, personId, hops, limit });
  res.json(result);
}

export async function handleGetMOIntelligence(req: AuthenticatedRequest, res: Response): Promise<void> {
  const district = (req.query.district as string) || undefined;
  const crimeType = (req.query.crimeType as string) || undefined;
  const firId = (req.query.firId as string) || undefined;
  const limit = parseInt((req.query.limit as string) || "30", 10);

  const profiles = await getModusOperandiIntelligence({ district, crimeType, firId, limit });
  res.json({ profiles });
}

export async function handleGetAnomalies(req: AuthenticatedRequest, res: Response): Promise<void> {
  const district = (req.query.district as string) || undefined;
  const crimeType = (req.query.crimeType as string) || undefined;
  const severity = (req.query.severity as string) || undefined;

  const anomalies = await getAnomalies({ district, crimeType, severity });
  res.json({ anomalies });
}

export async function handleGetAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const anomalies = await getAnomalies();
  res.json({ alerts: anomalies });
}

export async function handleGetRiskScoring(req: AuthenticatedRequest, res: Response): Promise<void> {
  const district = (req.query.district as string) || undefined;
  const crimeType = (req.query.crimeType as string) || undefined;

  const assessments = await getRiskScoring({ district, crimeType });
  res.json({ assessments });
}

export async function handleIntelligenceSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { query } = req.body || {};
  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "query is required" });
    return;
  }

  const result = await searchIntelligence(query);
  res.json(result);
}

export async function handleGetWorkspaces(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const list = await getInvestigations();
  res.json({ workspaces: list });
}

export async function handleCreateWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { title, description, assignedTo, district, firIds, personIds } = req.body || {};
  if (!title || !description) {
    res.status(400).json({ error: "title and description are required" });
    return;
  }

  const created = await createInvestigation({
    title,
    description,
    assignedTo: assignedTo || req.user?.name || "Investigator",
    district: district || req.user?.district || "Bengaluru Urban",
    firIds,
    personIds,
  });

  res.status(201).json(created);
}

export async function handleGroundedAIChat(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { message } = req.body || {};
  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const result = await processGroundedAIQuery(message, req.user?.uid);
  res.json(result);
}

export async function handleGenerateReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { district, crimeType, dateRange } = req.body || {};
  const report = await generateIntelligenceReport({ district, crimeType, dateRange });
  res.json(report);
}

export async function handleGetSocioeconomic(req: AuthenticatedRequest, res: Response): Promise<void> {
  const district = (req.query.district as string) || undefined;
  const data = await getSocioeconomicContext(district);
  res.json({ data });
}
