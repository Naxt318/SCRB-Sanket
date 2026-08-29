import { Request, Response, NextFunction } from "express";

export function apiTimingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.originalUrl.startsWith("/api/")) {
      console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`);
    }
  });

  next();
}
