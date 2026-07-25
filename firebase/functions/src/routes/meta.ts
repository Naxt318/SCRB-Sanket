import { Router, type IRouter } from "express";
import { DISTRICTS, CRIME_TYPES } from "../data/synthetic-firs.js";

const router: IRouter = Router();

router.get("/meta/districts", async (_req, res): Promise<void> => {
  res.json(DISTRICTS);
});

router.get("/meta/crime-types", async (_req, res): Promise<void> => {
  res.json(CRIME_TYPES);
});

export default router;
