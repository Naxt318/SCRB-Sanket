import { Router, type IRouter } from "express";
import { getFirs, getPersons, DISTRICTS, CRIME_TYPES } from "../data/synthetic-firs.js";

const router: IRouter = Router();

// ── GET /firs ──────────────────────────────────────────────────────────────
router.get("/firs", async (req, res): Promise<void> => {
  const { district, crimeType, startDate, endDate, limit = "50", offset = "0" } = req.query as Record<string, string>;

  let firs = getFirs();
  if (district) firs = firs.filter((f) => f.district === district);
  if (crimeType) firs = firs.filter((f) => f.crimeType === crimeType);
  if (startDate) firs = firs.filter((f) => f.dateOfIncident >= startDate);
  if (endDate) firs = firs.filter((f) => f.dateOfIncident <= endDate);

  const total = firs.length;
  const off = parseInt(offset, 10);
  const lim = parseInt(limit, 10);
  const page = firs.slice(off, off + lim);

  res.json({ data: page, total, limit: lim, offset: off });
});

// ── GET /firs/summary ─────────────────────────────────────────────────────
router.get("/firs/summary", async (_req, res): Promise<void> => {
  const firs = getFirs();

  const byType: Record<string, number> = {};
  const byDistrict: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  firs.forEach((f) => {
    byType[f.crimeType] = (byType[f.crimeType] || 0) + 1;
    byDistrict[f.district] = (byDistrict[f.district] || 0) + 1;
    byStatus[f.status] = (byStatus[f.status] || 0) + 1;
  });

  const topCrimeType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  const topDistrictId = Object.entries(byDistrict).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  const topDistrict = DISTRICTS.find((d) => d.id === topDistrictId)?.name ?? topDistrictId;

  const now = new Date("2026-07-24");
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const recentCount = firs.filter((f) => f.dateOfIncident >= thirtyDaysAgo).length;

  const openCases = firs.filter((f) => f.status === "registered" || f.status === "under_investigation").length;
  const closedCases = firs.filter((f) => f.status === "closed" || f.status === "chargesheeted").length;

  res.json({
    totalFirs: firs.length,
    openCases,
    closedCases,
    topCrimeType,
    topDistrict,
    recentCount,
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
  });
});

// ── GET /firs/hotspots ────────────────────────────────────────────────────
router.get("/firs/hotspots", async (req, res): Promise<void> => {
  const { crimeType, startDate, endDate } = req.query as Record<string, string>;

  let firs = getFirs();
  if (crimeType) firs = firs.filter((f) => f.crimeType === crimeType);
  if (startDate) firs = firs.filter((f) => f.dateOfIncident >= startDate);
  if (endDate) firs = firs.filter((f) => f.dateOfIncident <= endDate);

  // Group by district and compute intensity
  const byDistrict: Record<string, { count: number; lat: number; lng: number; district: string }> = {};
  firs.forEach((f) => {
    if (!byDistrict[f.district]) {
      const d = DISTRICTS.find((d) => d.id === f.district);
      byDistrict[f.district] = {
        count: 0,
        lat: d?.lat ?? 12.97,
        lng: d?.lng ?? 77.59,
        district: d?.name ?? f.district,
      };
    }
    byDistrict[f.district].count++;
  });

  const maxCount = Math.max(...Object.values(byDistrict).map((v) => v.count), 1);

  const hotspots = Object.entries(byDistrict).map(([_, v]) => ({
    lat: v.lat,
    lng: v.lng,
    intensity: Math.min(v.count / maxCount, 1),
    district: v.district,
    crimeType: crimeType ?? "All",
    count: v.count,
    label: v.district,
  }));

  res.json(hotspots);
});

// ── GET /firs/trends ──────────────────────────────────────────────────────
router.get("/firs/trends", async (req, res): Promise<void> => {
  const { crimeType, district, months = "12" } = req.query as Record<string, string>;
  const monthsNum = Math.min(parseInt(months, 10) || 12, 24);

  let firs = getFirs();
  if (crimeType) firs = firs.filter((f) => f.crimeType === crimeType);
  if (district) firs = firs.filter((f) => f.district === district);

  // Build monthly series going back N months
  const now = new Date("2026-07-24");
  const series: Array<{ month: string; count: number; isForecast: boolean }> = [];

  for (let i = monthsNum - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = firs.filter((f) => f.dateOfIncident.startsWith(monthStr)).length;
    series.push({ month: monthStr, count, isForecast: false });
  }

  // Simple moving average forecast for next 3 months
  const lastN = series.slice(-4).map((s) => s.count);
  const avg = lastN.reduce((a, b) => a + b, 0) / lastN.length;
  const trend = (series[series.length - 1].count - series[series.length - 4]?.count) / 3;

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
  const earlyWarning = trendDirection === "rising" && Math.abs(percentChange) > 20;

  res.json({ series, forecast, earlyWarning, trendDirection, percentChange });
});

// ── GET /firs/by-district ─────────────────────────────────────────────────
router.get("/firs/by-district", async (_req, res): Promise<void> => {
  const firs = getFirs();
  const map: Record<string, Record<string, number>> = {};

  firs.forEach((f) => {
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
      count: firs.filter((f) => f.district === d.id).length,
      breakdown,
    };
  });

  res.json(result);
});

// ── GET /firs/by-type ─────────────────────────────────────────────────────
router.get("/firs/by-type", async (_req, res): Promise<void> => {
  const firs = getFirs();
  const now = new Date("2026-07-24");
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().split("T")[0];

  const byType: Record<string, number> = {};
  const recent: Record<string, number> = {};
  const prior: Record<string, number> = {};

  firs.forEach((f) => {
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
});

// ── GET /firs/early-warnings ──────────────────────────────────────────────
router.get("/firs/early-warnings", async (_req, res): Promise<void> => {
  const firs = getFirs();
  const now = new Date("2026-07-24");
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().split("T")[0];

  const warnings: any[] = [];

  for (const district of DISTRICTS) {
    for (const crimeType of CRIME_TYPES) {
      const recentCases = firs.filter(
        (f) => f.district === district.id && f.crimeType === crimeType && f.dateOfIncident >= thirtyDaysAgo
      );
      const priorCases = firs.filter(
        (f) =>
          f.district === district.id &&
          f.crimeType === crimeType &&
          f.dateOfIncident >= sixtyDaysAgo &&
          f.dateOfIncident < thirtyDaysAgo
      );

      const recentCount = recentCases.length;
      const previousCount = priorCases.length;

      if (recentCount < 3) continue; // Too few to be meaningful

      const percentIncrease =
        previousCount > 0 ? Math.round(((recentCount - previousCount) / previousCount) * 100) : 100;

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
});

export default router;
