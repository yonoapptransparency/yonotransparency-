import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import powRouter from "./pow.js";
import linkCheckRouter from "./linkCheck.js";
import securePayloadRouter from "./securePayload.js";
import publicChatRouter from "./publicChat.js";
import reportMissingRouter from "./reportMissing.js";
import adminRouter from "./admin.js";
import githubSyncRouter from "./githubSync.js";
import utilitiesRouter from "./utilities.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(powRouter);
router.use(linkCheckRouter);
router.use(securePayloadRouter);
router.use(publicChatRouter);
router.use(reportMissingRouter);
router.use(adminRouter);
router.use(githubSyncRouter);
router.use(utilitiesRouter);

export default router;
