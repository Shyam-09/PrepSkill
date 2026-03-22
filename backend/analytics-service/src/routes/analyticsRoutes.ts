import { Router } from "express";
import { protect } from "@prepskill/common";
import { getDashboard }                           from "../controllers/getDashboard";
import { getUserAnalytics }                       from "../controllers/getUserAnalytics";
import { getActivityHeatmap }                     from "../controllers/getActivityHeatmap";
import { getOverallLeaderboard, getSheetLeaderboard } from "../controllers/getLeaderboard";

const router = Router();
const auth = protect(process.env.JWT_SECRET!);

router.get("/dashboard",                  getDashboard);
router.get("/leaderboard",                getOverallLeaderboard);
router.get("/leaderboard/sheet/:sheetId", getSheetLeaderboard);
router.get("/users/:userId",              auth, getUserAnalytics);
router.get("/users/:userId/heatmap",      auth, getActivityHeatmap);

export default router;
