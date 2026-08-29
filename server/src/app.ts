import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/api.routes.js";

import { apiTimingMiddleware } from "./middleware/timing.middleware.js";

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());
app.use(apiTimingMiddleware);

app.get("/", (_req, res) => {
  res.json({ name: "SCRB-Sanket Express API Server", status: "ok", health: "/health" });
});

app.use(routes);

// Central error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Global Error:", err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({
    success: false,
    error: {
      code: err.code || "INTERNAL_ERROR",
      message,
    },
  });
});
