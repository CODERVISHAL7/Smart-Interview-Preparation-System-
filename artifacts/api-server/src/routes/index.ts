import { Router, type IRouter } from "express";
import healthRouter from "./health";
import interviewRouter from "./interview";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(interviewRouter);
router.use(chatRouter);

export default router;
