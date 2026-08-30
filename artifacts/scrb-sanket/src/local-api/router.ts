// Local API router — answers every "/api/*" call the frontend makes, in
// the browser, with no server behind it. This is what lets the app run on
// Firebase's free Spark plan: just Hosting + Auth, no Cloud Functions.
//
// It's wired in via `setLocalHandler()` (see main.tsx) which intercepts
// requests inside the shared `@workspace/api-client-react` package before
// they'd otherwise hit the network — so every page/hook in this app is
// completely unchanged; they still think they're calling a server.
//
// Each handler below mirrors the logic that used to live in
// `firebase/functions/src/routes/*.ts` line for line — only the transport
// changed, not the behavior.

import type { LocalHandler, LocalHandlerResult } from "@workspace/api-client-react";
import { getFirs, getPersons, DISTRICTS, CRIME_TYPES } from "./synthetic-firs";
import { processQueryWithAI } from "./chat-engine";
import { sessionStore } from "./session-store";
import { profileForEmail } from "./demo-profiles";
import {
  createWorkspace,
  generateReport,
  getAnomalies,
  getCorrelations,
  getMoProfiles,
  getRiskAssessments,
  getSocioeconomic,
  getWorkspaces,
  searchIntelligence,
} from "./advanced-intelligence";

function json(status: number, data: unknown) {
  return { status, data };
}

function currentUser() {
  const token = localStorage.getItem("scrb_auth_token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? "")) as {
      userId?: string;
      email?: string;
    };
    if (!payload.email) return null;

    const profile = profileForEmail(payload.email);
    if (!profile) return null;

    return { uid: payload.userId ?? payload.email, email: payload.email, ...profile };
  } catch {
    return null;
  }
}

function fixedNow() {
  // Matches the synthetic dataset's reference "today" so trends/hotspots
  // line up with the generated data.
  return new Date("2026-07-24");
}

// ── /auth/me ─────────────────────────────────────────────────────────────
function handleAuthMe() {
  const u = currentUser();
  if (!u) return json(401, { error: "Unauthorized" });
  return json(200, {
    id: u.uid,
    name: u.name,
    role: u.role,
    district: u.district,
    badgeNumber: u.badgeNumber,
  });
}

// ── /chat ────────────────────────────────────────────────────────────────
async function handleChat(body: unknown) {
  const { message, language = "english", sessionId } = (body ?? {}) as Record<string, unknown>;

  if (!message || typeof message !== "string") {
    return json(400, { error: "message is required" });
  }

  const sid = (sessionId as string) || crypto.randomUUID();

  const history = sessionStore.getHistory(sid).map((m) => ({ role: m.role, content: m.content }));

  const userMsg = {
    id: crypto.randomUUID(),
    sessionId: sid,
    role: "user" as const,
    content: message,
    language: language as string,
    timestamp: new Date().toISOString(),
  };
  sessionStore.addMessage(userMsg);

  const result = await processQueryWithAI(message, history);

  let chartData: unknown = null;
  const byMonth: Record<string, number> = {};
  result.firs.forEach((f) => {
    const m = f.dateOfIncident.substring(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  });
  const monthEntries = Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8);

  if (monthEntries.length >= 2) {
    const analysisType = result.intent.analysisType;

    if (analysisType === "breakdown" || analysisType === "compare") {
      const byDistrict: Record<string, number> = {};
      result.firs.forEach((f) => {
        const name = DISTRICTS.find((d) => d.id === f.district)?.name ?? f.district;
        byDistrict[name] = (byDistrict[name] || 0) + 1;
      });
      const sorted = Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 6);
      chartData = {
        type: "bar" as const,
        title: "Cases by District",
        labels: sorted.map(([d]) => d),
        datasets: [{ label: "Cases", data: sorted.map(([, c]) => c) }],
      };
    } else if (analysisType === "trend") {
      chartData = {
        type: "line" as const,
        title: `Monthly Trend: ${result.intent.crimeType ?? "All Crimes"}`,
        labels: monthEntries.map(([m]) => m),
        datasets: [{ label: "Cases", data: monthEntries.map(([, c]) => c) }],
      };
    } else {
      chartData = {
        type: "bar" as const,
        title: "Monthly Distribution",
        labels: monthEntries.map(([m]) => m),
        datasets: [{ label: "Cases", data: monthEntries.map(([, c]) => c) }],
      };
    }
  }

  const mapData = result.firs.slice(0, 30).map((f) => {
    const district = DISTRICTS.find((d) => d.id === f.district);
    return {
      lat: f.latitude,
      lng: f.longitude,
      intensity: 0.6 + Math.random() * 0.4,
      district: district?.name ?? f.district,
      crimeType: f.crimeType,
      count: 1,
      label: f.firNumber,
    };
  });

  const responseId = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const assistantMsg = {
    id: responseId,
    sessionId: sid,
    role: "assistant" as const,
    content: result.answer,
    language: language as string,
    timestamp,
    reasoning: result.reasoning,
    sources: result.sources,
  };
  sessionStore.addMessage(assistantMsg);

  const user = currentUser();
  sessionStore.addAuditEntry({
    id: crypto.randomUUID(),
    userId: user?.uid ?? "anonymous",
    userName: user?.name ?? "Anonymous",
    role: user?.role ?? "unknown",
    query: message,
    timestamp,
    resultsCount: result.firs.length,
    ipAddress: "local",
  });

  return json(200, {
    id: responseId,
    role: "assistant",
    content: result.answer,
    reasoning: result.reasoning,
    sources: result.sources,
    timestamp,
    chartData,
    mapData,
    firIds: result.firs.map((f) => f.id),
  });
}

function handleChatHistory(params: URLSearchParams) {
  const sessionId = params.get("sessionId") ?? "";
  return json(200, sessionStore.getHistory(sessionId));
}

function handleClearChatHistory(params: URLSearchParams) {
  const sessionId = params.get("sessionId") ?? "";
  sessionStore.clearHistory(sessionId);
  return json(200, { success: true });
}

// ── /firs ────────────────────────────────────────────────────────────────
function handleGetFirs(params: URLSearchParams) {
  const district = params.get("district") ?? undefined;
  const crimeType = params.get("crimeType") ?? undefined;
  const startDate = params.get("startDate") ?? undefined;
  const endDate = params.get("endDate") ?? undefined;
  const limit = parseInt(params.get("limit") ?? "50", 10);
  const offset = parseInt(params.get("offset") ?? "0", 10);

  let firs = getFirs();
  if (district) firs = firs.filter((f) => f.district === district);
  if (crimeType) firs = firs.filter((f) => f.crimeType === crimeType);
  if (startDate) firs = firs.filter((f) => f.dateOfIncident >= startDate);
  if (endDate) firs = firs.filter((f) => f.dateOfIncident <= endDate);

  const total = firs.length;
  const page = firs.slice(offset, offset + limit);

  return json(200, { data: page, total, limit, offset });
}

function handleFirSummary() {
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

  const now = fixedNow();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const recentCount = firs.filter((f) => f.dateOfIncident >= thirtyDaysAgo).length;

  const openCases = firs.filter((f) => f.status === "registered" || f.status === "under_investigation").length;
  const closedCases = firs.filter((f) => f.status === "closed" || f.status === "chargesheeted").length;

  return json(200, {
    totalFirs: firs.length,
    openCases,
    closedCases,
    topCrimeType,
    topDistrict,
    recentCount,
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
  });
}

function handleHotspots(params: URLSearchParams) {
  const crimeType = params.get("crimeType") ?? undefined;
  const startDate = params.get("startDate") ?? undefined;
  const endDate = params.get("endDate") ?? undefined;

  let firs = getFirs();
  if (crimeType) firs = firs.filter((f) => f.crimeType === crimeType);
  if (startDate) firs = firs.filter((f) => f.dateOfIncident >= startDate);
  if (endDate) firs = firs.filter((f) => f.dateOfIncident <= endDate);

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

  return json(200, hotspots);
}

function handleTrends(params: URLSearchParams) {
  const crimeType = params.get("crimeType") ?? undefined;
  const district = params.get("district") ?? undefined;
  const monthsNum = Math.min(parseInt(params.get("months") ?? "12", 10) || 12, 24);

  let firs = getFirs();
  if (crimeType) firs = firs.filter((f) => f.crimeType === crimeType);
  if (district) firs = firs.filter((f) => f.district === district);

  const now = fixedNow();
  const series: Array<{ month: string; count: number; isForecast: boolean }> = [];

  for (let i = monthsNum - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const count = firs.filter((f) => f.dateOfIncident.startsWith(monthStr)).length;
    series.push({ month: monthStr, count, isForecast: false });
  }

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

  return json(200, { series, forecast, earlyWarning: trendDirection === "rising" && Math.abs(percentChange) > 20, trendDirection, percentChange });
}

function handleByDistrict() {
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

  return json(200, result);
}

function handleByType() {
  const firs = getFirs();
  const now = fixedNow();
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

  return json(200, result);
}

function handleEarlyWarnings() {
  const firs = getFirs();
  const now = fixedNow();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString().split("T")[0];

  const warnings: any[] = [];

  for (const district of DISTRICTS) {
    for (const crimeType of CRIME_TYPES) {
      const recentCases = firs.filter(
        (f) => f.district === district.id && f.crimeType === crimeType && f.dateOfIncident >= thirtyDaysAgo,
      );
      const priorCases = firs.filter(
        (f) =>
          f.district === district.id &&
          f.crimeType === crimeType &&
          f.dateOfIncident >= sixtyDaysAgo &&
          f.dateOfIncident < thirtyDaysAgo,
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
  return json(200, warnings.slice(0, 8));
}

// ── /network ─────────────────────────────────────────────────────────────
function handleNetwork(params: URLSearchParams) {
  const personId = params.get("personId") ?? undefined;
  const crimeType = params.get("crimeType") ?? undefined;
  const district = params.get("district") ?? undefined;

  const allFirs = getFirs();
  const allPersons = getPersons();

  let filteredFirs = allFirs.filter((f) => f.personIds.length > 0);
  if (crimeType) filteredFirs = filteredFirs.filter((f) => f.crimeType === crimeType);
  if (district) filteredFirs = filteredFirs.filter((f) => f.district === district);

  const relevantPersonIds: Set<string> = new Set();
  if (personId) {
    relevantPersonIds.add(personId);
    const relatedFirs = filteredFirs.filter((f) => f.personIds.includes(personId));
    relatedFirs.forEach((f) => f.personIds.forEach((p) => relevantPersonIds.add(p)));
  } else {
    filteredFirs.forEach((f) => f.personIds.forEach((p) => relevantPersonIds.add(p)));
  }

  const personIdList = Array.from(relevantPersonIds).slice(0, 40);

  const nodes = personIdList.map((pid) => {
    const person = allPersons.find((p) => p.id === pid);
    const personFirs = filteredFirs.filter((f) => f.personIds.includes(pid));
    const districtName = DISTRICTS.find((d) => d.id === person?.district)?.name ?? person?.district ?? "Unknown";
    return {
      id: pid,
      label: person?.alias ?? pid,
      type: "person" as const,
      caseCount: personFirs.length,
      district: districtName,
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

  filteredFirs.forEach((fir) => {
    const firPersons = fir.personIds.filter((pid) => personIdList.includes(pid));
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
    n.crimeTypes.forEach((ct) => {
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

  return json(200, { nodes, edges });
}

// ── /audit ───────────────────────────────────────────────────────────────
function handleAuditLog(params: URLSearchParams) {
  const u = currentUser();
  if (!u) return json(401, { error: "Unauthorized" });
  if (u.role !== "supervisor" && u.role !== "admin") {
    return json(403, { error: "Access restricted to Supervisor and Admin roles" });
  }
  const limit = parseInt(params.get("limit") ?? "50", 10);
  return json(200, sessionStore.getAuditLog(limit));
}

// ── dispatch table ───────────────────────────────────────────────────────
type Route = { method: string; pattern: RegExp; handle: (params: URLSearchParams, body: unknown) => LocalHandlerResult | Promise<LocalHandlerResult> };

const routes: Route[] = [
  { method: "GET", pattern: /^\/api\/healthz$/, handle: () => json(200, { status: "ok" }) },
  { method: "GET", pattern: /^\/api\/auth\/me$/, handle: () => handleAuthMe() },
  { method: "POST", pattern: /^\/api\/chat$/, handle: (_p, body) => handleChat(body) },
  { method: "GET", pattern: /^\/api\/chat\/history$/, handle: (p) => handleChatHistory(p) },
  { method: "DELETE", pattern: /^\/api\/chat\/history$/, handle: (p) => handleClearChatHistory(p) },
  { method: "GET", pattern: /^\/api\/firs$/, handle: (p) => handleGetFirs(p) },
  { method: "GET", pattern: /^\/api\/firs\/summary$/, handle: () => handleFirSummary() },
  { method: "GET", pattern: /^\/api\/firs\/hotspots$/, handle: (p) => handleHotspots(p) },
  { method: "GET", pattern: /^\/api\/firs\/trends$/, handle: (p) => handleTrends(p) },
  { method: "GET", pattern: /^\/api\/firs\/by-district$/, handle: () => handleByDistrict() },
  { method: "GET", pattern: /^\/api\/firs\/by-type$/, handle: () => handleByType() },
  { method: "GET", pattern: /^\/api\/firs\/early-warnings$/, handle: () => handleEarlyWarnings() },
  { method: "GET", pattern: /^\/api\/network$/, handle: (p) => handleNetwork(p) },
  { method: "GET", pattern: /^\/api\/audit\/log$/, handle: (p) => handleAuditLog(p) },
  { method: "GET", pattern: /^\/api\/meta\/districts$/, handle: () => json(200, DISTRICTS) },
  { method: "GET", pattern: /^\/api\/meta\/crime-types$/, handle: () => json(200, CRIME_TYPES) },
  { method: "POST", pattern: /^\/api\/intelligence\/search$/, handle: (_p, body) => {
    const query = String((body as Record<string, unknown> | undefined)?.query ?? "").trim();
    return query ? json(200, searchIntelligence(query)) : json(400, { error: "query is required" });
  } },
  { method: "GET", pattern: /^\/api\/intelligence\/correlations$/, handle: (p) => json(200, getCorrelations(p)) },
  { method: "GET", pattern: /^\/api\/intelligence\/mo$/, handle: (p) => json(200, getMoProfiles(p)) },
  { method: "GET", pattern: /^\/api\/intelligence\/anomalies$/, handle: (p) => json(200, getAnomalies(p)) },
  { method: "GET", pattern: /^\/api\/intelligence\/alerts$/, handle: (p) => json(200, { alerts: getAnomalies(p).anomalies }) },
  { method: "GET", pattern: /^\/api\/intelligence\/risk$/, handle: (p) => json(200, getRiskAssessments(p)) },
  { method: "GET", pattern: /^\/api\/intelligence\/workspace$/, handle: () => json(200, getWorkspaces()) },
  { method: "POST", pattern: /^\/api\/intelligence\/workspace$/, handle: (_p, body) => json(201, createWorkspace((body ?? {}) as Record<string, unknown>)) },
  { method: "POST", pattern: /^\/api\/intelligence\/report$/, handle: (_p, body) => json(200, generateReport((body ?? {}) as Record<string, unknown>)) },
  { method: "GET", pattern: /^\/api\/intelligence\/socioeconomic$/, handle: (p) => json(200, getSocioeconomic(p)) },
];

export const localApiHandler: LocalHandler = (url, init) => {
  const [path, queryString] = url.split("?");
  const params = new URLSearchParams(queryString ?? "");
  const method = (init.method ?? "GET").toUpperCase();

  const route = routes.find((r) => r.method === method && r.pattern.test(path));
  if (!route) return null; // not one of ours — let it fall through

  let body: unknown = undefined;
  if (typeof init.body === "string" && init.body.length > 0) {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = undefined;
    }
  }

  return route.handle(params, body);
};
