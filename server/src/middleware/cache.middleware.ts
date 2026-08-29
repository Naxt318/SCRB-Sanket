import { Request, Response, NextFunction } from "express";

interface CacheEntry {
  body: any;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 45000; // 45 seconds TTL

export function clearAnalyticalCache(): void {
  memoryCache.clear();
}

export function cacheMiddleware(ttlMs: number = DEFAULT_TTL_MS) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== "GET") {
      next();
      return;
    }

    const key = `${req.path}?${new URLSearchParams(req.query as any).toString()}`;
    const cached = memoryCache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < ttlMs) {
      res.setHeader("X-Cache", "HIT");
      res.json(cached.body);
      return;
    }

    // Intercept json response
    const originalJson = res.json.bind(res);
    res.json = (body: any): Response => {
      if (res.statusCode === 200) {
        memoryCache.set(key, { body, timestamp: Date.now() });
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
}
