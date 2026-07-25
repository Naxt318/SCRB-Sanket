import { Router, type IRouter } from "express";
import { randomUUID } from "crypto";
import { processQuery } from "../lib/chat-engine.js";
import { sessionStore } from "../lib/session-store.js";
import { optionalAuth } from "../lib/auth-middleware.js";
import { getFirs, DISTRICTS } from "../data/synthetic-firs.js";

const router: IRouter = Router();

router.post("/chat", optionalAuth, async (req, res): Promise<void> => {
  const { message, language = "english", sessionId } = req.body ?? {};

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  const sid = sessionId || randomUUID();

  // Get session history for context
  const history = sessionStore.getHistory(sid).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Save user message
  const userMsg = {
    id: randomUUID(),
    sessionId: sid,
    role: "user" as const,
    content: message,
    language,
    timestamp: new Date().toISOString(),
  };
  sessionStore.addMessage(userMsg);

  // Process the query
  const result = processQuery(message, history);

  // Build chart data from filtered results
  let chartData = null;
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
      // District breakdown bar chart
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

  // Build map data
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

  const responseId = randomUUID();
  const timestamp = new Date().toISOString();

  // Save assistant response
  const assistantMsg = {
    id: responseId,
    sessionId: sid,
    role: "assistant" as const,
    content: result.answer,
    language,
    timestamp,
    reasoning: result.reasoning,
    sources: result.sources,
  };
  sessionStore.addMessage(assistantMsg);

  // Audit log entry
  const user = req.authedUser;
  sessionStore.addAuditEntry({
    id: randomUUID(),
    userId: user?.uid ?? "anonymous",
    userName: user?.name ?? "Anonymous",
    role: user?.role ?? "unknown",
    query: message,
    timestamp,
    resultsCount: result.firs.length,
    ipAddress: req.ip ?? "unknown",
  });

  req.log.info(
    { resultsCount: result.firs.length, analysisType: result.intent.analysisType },
    "Chat query processed"
  );

  res.json({
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
});

router.get("/chat/history", async (req, res): Promise<void> => {
  const sessionId = (req.query.sessionId as string) ?? "";
  const history = sessionStore.getHistory(sessionId);
  res.json(history);
});

router.delete("/chat/history", async (req, res): Promise<void> => {
  const sessionId = (req.query.sessionId as string) ?? "";
  sessionStore.clearHistory(sessionId);
  res.json({ success: true });
});

export default router;
