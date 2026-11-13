import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studyRouter from "./study";
import judgeDemoRouter from "./judge-demo";
import exampleRouter from "./example";

const router: IRouter = Router();

router.use(healthRouter);
router.use(judgeDemoRouter);
router.use("/example", exampleRouter);
router.use(studyRouter);

export default router;
