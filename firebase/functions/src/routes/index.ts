import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import chatRouter from "./chat.js";
import firsRouter from "./firs.js";
import networkRouter from "./network.js";
import auditRouter from "./audit.js";
import metaRouter from "./meta.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(chatRouter);
router.use(firsRouter);
router.use(networkRouter);
router.use(auditRouter);
router.use(metaRouter);

export default router;
