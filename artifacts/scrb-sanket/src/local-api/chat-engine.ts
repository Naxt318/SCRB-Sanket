// Rule-based NL query engine for SCRB Sanket.
// Parses natural language questions and queries the synthetic dataset.
// No external AI API required — deterministic and auditable by design.

import { getFirs, getPersons, DISTRICTS, CRIME_TYPES } from "./synthetic-firs";
import type { SyntheticFir } from "./synthetic-firs";

export interface QueryIntent {
  crimeType?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
  timeRange?: string;  // "last 3 months", "this year" etc.
  analysisType: "count" | "breakdown" | "hotspot" | "trend" | "network" | "list" | "compare";
  breakdown?: "district" | "type" | "time" | "station";
}

interface ChatEngineResult {
  answer: string;
  firs: SyntheticFir[];
  intent: QueryIntent;
  reasoning: string[];
  sources: string[];
}

// ──────────────────────────────────────────────
// NL Parsing helpers
// ──────────────────────────────────────────────

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
}

function detectCrimeType(text: string): string | undefined {
  const n = normalize(text);
  const aliases: Record<string, string> = {
    "chain snatch": "Chain Snatching",
    "snatching": "Chain Snatching",
    "snatch": "Chain Snatching",
    "chain": "Chain Snatching",
    "theft": "Theft",
    "steal": "Theft",
    "pickpocket": "Theft",
    "shoplifting": "Theft",
    "cyber": "Cybercrime",
    "online fraud": "Cybercrime",
    "phishing": "Cybercrime",
    "ransomware": "Cybercrime",
    "narco": "Narcotics",
    "drug": "Narcotics",
    "ganja": "Narcotics",
    "assault": "Assault",
    "fight": "Assault",
    "attack": "Assault",
    "burglary": "Burglary",
    "break in": "Burglary",
    "vehicle theft": "Vehicle Theft",
    "bike theft": "Vehicle Theft",
    "car theft": "Vehicle Theft",
    "two wheeler": "Vehicle Theft",
    "fraud": "Fraud",
    "scam": "Fraud",
    "robbery": "Robbery",
    "domestic": "Domestic Violence",
    "dowry": "Domestic Violence",
  };
  for (const [key, val] of Object.entries(aliases)) {
    if (n.includes(key)) return val;
  }
  return undefined;
}

function detectDistrict(text: string): string | undefined {
  const n = normalize(text);
  const districtMap: Record<string, string> = {
    "bengaluru": "bengaluru_urban",
    "bangalore": "bengaluru_urban",
    "blr": "bengaluru_urban",
    "mysuru": "mysuru",
    "mysore": "mysuru",
    "mangaluru": "dakshina_kannada",
    "mangalore": "dakshina_kannada",
    "dakshina kannada": "dakshina_kannada",
    "dk": "dakshina_kannada",
    "tumakuru": "tumakuru",
    "tumkur": "tumakuru",
    "belagavi": "belagavi",
    "belgaum": "belagavi",
    "hubli": "belagavi",
    "dharwad": "belagavi",
    "kalaburagi": "kalaburagi",
    "gulbarga": "kalaburagi",
    "bidar": "kalaburagi",
    "raichur": "kalaburagi",
  };
  for (const [key, val] of Object.entries(districtMap)) {
    if (n.includes(key)) return val;
  }
  return undefined;
}

function detectTimeRange(text: string): { startDate?: string; endDate?: string; label: string } {
  const n = normalize(text);
  const now = new Date("2026-07-24");

  if (n.includes("last 3 month") || n.includes("past 3 month") || n.includes("3 months")) {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 3);
    return { startDate: start.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0], label: "last 3 months" };
  }
  if (n.includes("last 6 month") || n.includes("past 6 month") || n.includes("6 months")) {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 6);
    return { startDate: start.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0], label: "last 6 months" };
  }
  if (n.includes("last month") || n.includes("past month")) {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return { startDate: start.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0], label: "last month" };
  }
  if (n.includes("this year") || n.includes("2026")) {
    return { startDate: "2026-01-01", endDate: now.toISOString().split("T")[0], label: "2026 (year to date)" };
  }
  if (n.includes("last year") || n.includes("2025")) {
    return { startDate: "2025-01-01", endDate: "2025-12-31", label: "2025" };
  }
  if (n.includes("this month")) {
    return { startDate: `${now.toISOString().substring(0, 7)}-01`, endDate: now.toISOString().split("T")[0], label: "this month" };
  }
  if (n.includes("this week")) {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { startDate: start.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0], label: "this week" };
  }
  // Default: last 12 months
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - 1);
  return { startDate: start.toISOString().split("T")[0], endDate: now.toISOString().split("T")[0], label: "last 12 months" };
}

function detectAnalysisType(text: string): QueryIntent["analysisType"] {
  const n = normalize(text);
  if (n.includes("break") || n.includes("split") || n.includes("by district") || n.includes("by area") || n.includes("by time") || n.includes("distribution")) return "breakdown";
  if (n.includes("hotspot") || n.includes("where") || n.includes("area") || n.includes("location") || n.includes("map")) return "hotspot";
  if (n.includes("trend") || n.includes("rising") || n.includes("increasing") || n.includes("over time") || n.includes("month")) return "trend";
  if (n.includes("network") || n.includes("linked") || n.includes("connect") || n.includes("gang") || n.includes("person")) return "network";
  if (n.includes("compare") || n.includes("versus") || n.includes("vs")) return "compare";
  if (n.includes("list") || n.includes("show me") || n.includes("display") || n.includes("cases")) return "list";
  return "count";
}

// ──────────────────────────────────────────────
// Filter FIRs
// ──────────────────────────────────────────────

function filterFirs(firs: SyntheticFir[], intent: QueryIntent): SyntheticFir[] {
  return firs.filter(f => {
    if (intent.crimeType && f.crimeType !== intent.crimeType) return false;
    if (intent.district && f.district !== intent.district) return false;
    if (intent.startDate && f.dateOfIncident < intent.startDate) return false;
    if (intent.endDate && f.dateOfIncident > intent.endDate) return false;
    return true;
  });
}

// ──────────────────────────────────────────────
// Response generation
// ──────────────────────────────────────────────

function districtName(id: string): string {
  return DISTRICTS.find(d => d.id === id)?.name ?? id;
}

function buildCountResponse(filtered: SyntheticFir[], intent: QueryIntent, timeLabel: string): string {
  const total = filtered.length;
  const crimeDesc = intent.crimeType ? `**${intent.crimeType}**` : "all crime types";
  const districtDesc = intent.district ? ` in **${districtName(intent.district)}** district` : " across Karnataka";
  const open = filtered.filter(f => f.status === "under_investigation" || f.status === "registered").length;
  const closed = filtered.filter(f => f.status === "closed" || f.status === "chargesheeted").length;

  // Group by month for mini trend
  const byMonth: Record<string, number> = {};
  filtered.forEach(f => {
    const m = f.dateOfIncident.substring(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  });
  const monthEntries = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
  const recentMonths = monthEntries.slice(-3).map(([m, c]) => `${m}: ${c} cases`).join(", ");

  return `**${total} cases** of ${crimeDesc} recorded${districtDesc} in the **${timeLabel}**.

- Open/Active: **${open}** cases (${Math.round(open / Math.max(total, 1) * 100)}%)
- Closed/Chargesheeted: **${closed}** cases
- Recent trend (last 3 months): ${recentMonths || "insufficient data"}

*Note: All data is synthetic and for demonstration only. Human investigators should verify all patterns before action.*`;
}

function buildBreakdownResponse(filtered: SyntheticFir[], intent: QueryIntent, timeLabel: string): string {
  const byDistrict: Record<string, number> = {};
  const byType: Record<string, number> = {};
  filtered.forEach(f => {
    byDistrict[f.district] = (byDistrict[f.district] || 0) + 1;
    byType[f.crimeType] = (byType[f.crimeType] || 0) + 1;
  });

  const topDistricts = Object.entries(byDistrict)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d, c]) => `  - **${districtName(d)}**: ${c} cases`)
    .join("\n");

  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t, c]) => `  - **${t}**: ${c} cases`)
    .join("\n");

  return `**Breakdown of ${filtered.length} cases** during **${timeLabel}**:

**By District:**
${topDistricts || "  No data"}

**By Crime Type:**
${topTypes || "  No data"}

*Note: Synthetic data only. Human investigators validate all findings.*`;
}

function buildHotspotResponse(filtered: SyntheticFir[], intent: QueryIntent, timeLabel: string): string {
  const byDistrict: Record<string, number> = {};
  filtered.forEach(f => {
    byDistrict[f.district] = (byDistrict[f.district] || 0) + 1;
  });
  const sorted = Object.entries(byDistrict).sort((a, b) => b[1] - a[1]);
  const topDistrict = sorted[0];

  return `**Crime hotspot analysis** for ${timeLabel}:

Highest concentration: **${topDistrict ? districtName(topDistrict[0]) : "N/A"}** with **${topDistrict?.[1] ?? 0} cases**.

Top hotspots:
${sorted.slice(0, 5).map(([d, c], i) => `  ${i + 1}. ${districtName(d)}: **${c} cases**`).join("\n")}

The interactive map below shows geographic density. Clusters indicate areas with high crime concentration requiring increased police presence.

*Note: All coordinates are approximate synthetic data. Human investigators must validate any deployment decisions.*`;
}

function buildTrendResponse(filtered: SyntheticFir[], intent: QueryIntent, timeLabel: string): string {
  const byMonth: Record<string, number> = {};
  filtered.forEach(f => {
    const m = f.dateOfIncident.substring(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  });
  const sorted = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));

  if (sorted.length < 2) {
    return `Insufficient data to determine trend for the selected filters in ${timeLabel}.`;
  }

  const recent = sorted.slice(-3).reduce((s, [, c]) => s + c, 0);
  const earlier = sorted.slice(-6, -3).reduce((s, [, c]) => s + c, 0);
  const pctChange = earlier > 0 ? Math.round(((recent - earlier) / earlier) * 100) : 0;
  const direction = pctChange > 10 ? "⬆ RISING" : pctChange < -10 ? "⬇ FALLING" : "→ STABLE";

  const crimeDesc = intent.crimeType || "All crimes";
  const districtDesc = intent.district ? ` in ${districtName(intent.district)}` : "";

  return `**Trend analysis: ${crimeDesc}${districtDesc}** (${timeLabel})

**Direction: ${direction}** — ${Math.abs(pctChange)}% ${pctChange >= 0 ? "increase" : "decrease"} vs. prior period

Monthly breakdown:
${sorted.slice(-6).map(([m, c]) => `  - ${m}: **${c} cases**`).join("\n")}

${Math.abs(pctChange) > 20 ? "⚠️ **Early Warning:** This trend exceeds the 20% change threshold. Recommend supervisory review." : "Trend is within normal variance."}

*AI flags this pattern; human investigators determine appropriate response.*`;
}

// ──────────────────────────────────────────────
// Real AI layer (Google Gemini — free tier)
// ──────────────────────────────────────────────
// Falls back to the deterministic templates above if no API key is set,
// or if the call fails for any reason (offline, rate-limited, etc.) —
// the app always stays functional either way.

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = "gemini-2.0-flash";

function summarizeForAI(filtered: SyntheticFir[], intent: QueryIntent, timeLabel: string): string {
  const byDistrict: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  filtered.forEach((f) => {
    byDistrict[f.district] = (byDistrict[f.district] || 0) + 1;
    byType[f.crimeType] = (byType[f.crimeType] || 0) + 1;
    const m = f.dateOfIncident.substring(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  });

  const topDistricts = Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const monthly = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);

  return [
    `Total matching cases: ${filtered.length}`,
    `Time range: ${timeLabel}`,
    intent.crimeType ? `Crime type filter: ${intent.crimeType}` : `Crime type filter: none (all types)`,
    intent.district ? `District filter: ${districtName(intent.district)}` : `District filter: none (all districts)`,
    `By district: ${topDistricts.map(([d, c]) => `${districtName(d)}=${c}`).join(", ") || "none"}`,
    `By crime type: ${topTypes.map(([t, c]) => `${t}=${c}`).join(", ") || "none"}`,
    `Monthly counts: ${monthly.map(([m, c]) => `${m}=${c}`).join(", ") || "none"}`,
  ].join("\n");
}

async function generateAiAnswer(
  message: string,
  filtered: SyntheticFir[],
  intent: QueryIntent,
  timeLabel: string,
  sessionHistory: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const dataSummary = summarizeForAI(filtered, intent, timeLabel);
  const historyText = sessionHistory
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Investigator" : "Assistant"}: ${m.content}`)
    .join("\n");

  const prompt = `You are SANKET, an AI crime-intelligence assistant for the Karnataka State Crime Records Bureau (SCRB). You are speaking to a police investigator, supervisor, or admin using a command-center dashboard.

IMPORTANT RULES:
- All data below is 100% SYNTHETIC (fake, generated for a demo). Never imply it is real.
- Be concise, professional, and factual — like a crime analyst briefing an officer.
- Use the data summary below to ground your answer. Do not invent numbers not present in it.
- Use markdown (bold for key numbers) where helpful.
- End with a short note that this is synthetic data and human investigators must verify findings before action.
- Answer in ${intent ? "English" : "English"}.

${historyText ? `Recent conversation:\n${historyText}\n` : ""}
Data summary for the current query:
${dataSummary}

Investigator's question: "${message}"

Give a direct, helpful answer grounded in the data summary above.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────

export function processQuery(
  message: string,
  sessionHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): ChatEngineResult {
  const reasoning: string[] = [];
  const sources: string[] = [];

  reasoning.push("Parsing natural language query for crime type, district, and time range...");

  const crimeType = detectCrimeType(message);
  const district = detectDistrict(message);
  const { startDate, endDate, label: timeLabel } = detectTimeRange(message);
  const analysisType = detectAnalysisType(message);

  // Check session history for context (follow-up questions)
  let effectiveCrimeType = crimeType;
  let effectiveDistrict = district;
  if (!crimeType || !district) {
    // Extract context from prior messages
    for (let i = sessionHistory.length - 1; i >= 0; i--) {
      const msg = sessionHistory[i];
      if (msg.role === "user") {
        if (!effectiveCrimeType) effectiveCrimeType = detectCrimeType(msg.content);
        if (!effectiveDistrict) effectiveDistrict = detectDistrict(msg.content);
      }
      if (effectiveCrimeType && effectiveDistrict) break;
    }
  }

  if (effectiveCrimeType) reasoning.push(`Crime type identified: ${effectiveCrimeType}`);
  else reasoning.push("No specific crime type detected — querying all types");

  if (effectiveDistrict) reasoning.push(`District identified: ${districtName(effectiveDistrict)}`);
  else reasoning.push("No specific district detected — querying all districts");

  reasoning.push(`Time range: ${timeLabel} (${startDate} to ${endDate})`);
  reasoning.push(`Analysis type: ${analysisType}`);

  const intent: QueryIntent = {
    crimeType: effectiveCrimeType,
    district: effectiveDistrict,
    startDate,
    endDate,
    timeRange: timeLabel,
    analysisType,
  };

  const allFirs = getFirs();
  const filtered = filterFirs(allFirs, intent);

  reasoning.push(`Queried synthetic dataset of ${allFirs.length} FIR records`);
  reasoning.push(`Filtered to ${filtered.length} matching records`);

  sources.push(`Synthetic FIR Dataset (${allFirs.length} records)`);
  if (effectiveCrimeType) sources.push(`Crime category: ${effectiveCrimeType}`);
  if (effectiveDistrict) sources.push(`District filter: ${districtName(effectiveDistrict)}`);
  sources.push(`Date range: ${startDate ?? "all time"} → ${endDate ?? "present"}`);
  sources.push("Analysis engine: Rule-based NL query (deterministic)");

  let answer: string;
  switch (analysisType) {
    case "breakdown":
    case "compare":
      answer = buildBreakdownResponse(filtered, intent, timeLabel);
      break;
    case "hotspot":
      answer = buildHotspotResponse(filtered, intent, timeLabel);
      break;
    case "trend":
      answer = buildTrendResponse(filtered, intent, timeLabel);
      break;
    case "network":
      answer = `**Criminal network analysis** for ${effectiveCrimeType ?? "all crimes"}${effectiveDistrict ? ` in ${districtName(effectiveDistrict)}` : ""}:

${filtered.filter(f => f.personIds.length > 0).length} cases have linked persons of interest. Use the **Network** tab to explore connections visually.

*Note: All person IDs are anonymized synthetic identifiers. Human investigators determine investigative actions.*`;
      break;
    case "list":
      const sample = filtered.slice(0, 8);
      answer = `**${filtered.length} cases** found${effectiveCrimeType ? ` of ${effectiveCrimeType}` : ""}${effectiveDistrict ? ` in ${districtName(effectiveDistrict)}` : ""} (${timeLabel}). Showing ${sample.length} recent records:\n\n${sample.map(f => `- **${f.firNumber}** | ${f.district} | ${f.crimeType} | ${f.dateOfIncident} | Status: ${f.status}`).join("\n")}\n\n*Synthetic data only.*`;
      break;
    default:
      answer = buildCountResponse(filtered, intent, timeLabel);
  }

  // Generate chart data if applicable
  const byMonth: Record<string, number> = {};
  filtered.forEach(f => {
    const m = f.dateOfIncident.substring(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  });

  return { answer, firs: filtered.slice(0, 50), intent, reasoning, sources };
}

// Async version used by the chat route — tries real AI (Gemini) first,
// falls back to the deterministic answer above if unavailable/unconfigured.
export async function processQueryWithAI(
  message: string,
  sessionHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<ChatEngineResult & { aiPowered: boolean }> {
  const ruleBasedResult = processQuery(message, sessionHistory);

  const aiAnswer = await generateAiAnswer(
    message,
    ruleBasedResult.firs,
    ruleBasedResult.intent,
    ruleBasedResult.intent.timeRange ?? "the selected period",
    sessionHistory
  );

  if (aiAnswer) {
    return {
      ...ruleBasedResult,
      answer: aiAnswer,
      reasoning: [...ruleBasedResult.reasoning, "Generated natural-language answer via Gemini AI, grounded in the filtered dataset above."],
      sources: [...ruleBasedResult.sources, "AI model: Google Gemini (gemini-2.0-flash)"],
      aiPowered: true,
    };
  }

  return { ...ruleBasedResult, aiPowered: false };
}
