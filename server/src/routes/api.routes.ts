import { Router } from "express";
import asyncHandler from "express-async-handler";
import { requireAuth } from "../middleware/auth.js";
import {
  handleHealthz,
  handleLogin,
  handleLogout,
  handleAuthMe,
  handleGetFirs,
  handleFirSummary,
  handleHotspots,
  handleTrends,
  handleByDistrict,
  handleByType,
  handleEarlyWarnings,
  handleNetwork,
  handleAuditLog,
  handleChat,
  handleChatHistory,
  handleClearChatHistory,
  handleMetaDistricts,
  handleMetaCrimeTypes,
  handleGetCorrelations,
  handleGetIntelligenceNetwork,
  handleGetMOIntelligence,
  handleGetAnomalies,
  handleGetAlerts,
  handleGetRiskScoring,
  handleIntelligenceSearch,
  handleGetWorkspaces,
  handleCreateWorkspace,
  handleGroundedAIChat,
  handleGenerateReport,
  handleGetSocioeconomic,
} from "../controllers/api.controller.js";

import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = Router();
const cache = cacheMiddleware(45000); // 45s TTL cache

// Unprotected metadata, auth & health routes
router.get("/health", asyncHandler(handleHealthz));
router.get("/api/healthz", asyncHandler(handleHealthz));
router.post("/api/auth/login", asyncHandler(handleLogin));
router.post("/api/auth/logout", asyncHandler(handleLogout));
router.get("/api/meta/districts", cache, asyncHandler(handleMetaDistricts));
router.get("/api/meta/crime-types", cache, asyncHandler(handleMetaCrimeTypes));

// Protected baseline Phase 2 routes
router.get("/api/auth/me", requireAuth, asyncHandler(handleAuthMe));
router.get("/api/firs", requireAuth, asyncHandler(handleGetFirs));
router.get("/api/firs/summary", requireAuth, cache, asyncHandler(handleFirSummary));
router.get("/api/firs/hotspots", requireAuth, cache, asyncHandler(handleHotspots));
router.get("/api/firs/trends", requireAuth, cache, asyncHandler(handleTrends));
router.get("/api/firs/by-district", requireAuth, cache, asyncHandler(handleByDistrict));
router.get("/api/firs/by-type", requireAuth, cache, asyncHandler(handleByType));
router.get("/api/firs/early-warnings", requireAuth, cache, asyncHandler(handleEarlyWarnings));
router.get("/api/network", requireAuth, cache, asyncHandler(handleNetwork));
router.get("/api/audit/log", requireAuth, asyncHandler(handleAuditLog));
router.post("/api/chat", requireAuth, asyncHandler(handleChat));
router.get("/api/chat/history", requireAuth, asyncHandler(handleChatHistory));
router.delete("/api/chat/history", requireAuth, asyncHandler(handleClearChatHistory));

// Protected Phase 3 Advanced Intelligence routes
router.get("/api/intelligence/correlations", requireAuth, cache, asyncHandler(handleGetCorrelations));
router.get("/api/intelligence/network", requireAuth, cache, asyncHandler(handleGetIntelligenceNetwork));
router.get("/api/intelligence/mo", requireAuth, cache, asyncHandler(handleGetMOIntelligence));
router.get("/api/intelligence/anomalies", requireAuth, cache, asyncHandler(handleGetAnomalies));
router.get("/api/intelligence/alerts", requireAuth, cache, asyncHandler(handleGetAlerts));
router.get("/api/intelligence/risk", requireAuth, cache, asyncHandler(handleGetRiskScoring));
router.post("/api/intelligence/search", requireAuth, asyncHandler(handleIntelligenceSearch));
router.get("/api/intelligence/workspace", requireAuth, asyncHandler(handleGetWorkspaces));
router.post("/api/intelligence/workspace", requireAuth, asyncHandler(handleCreateWorkspace));
router.post("/api/intelligence/grounded-chat", requireAuth, asyncHandler(handleGroundedAIChat));
router.post("/api/intelligence/report", requireAuth, asyncHandler(handleGenerateReport));
router.get("/api/intelligence/socioeconomic", requireAuth, cache, asyncHandler(handleGetSocioeconomic));

export default router;
