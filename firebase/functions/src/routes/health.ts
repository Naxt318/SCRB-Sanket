import { Router, type IRouter } from "express";
import { z } from "zod";

const router: IRouter = Router();

const HealthCheckResponse = z.object({
  status: z.string(),
});

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
