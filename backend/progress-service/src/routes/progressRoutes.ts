import { Router } from "express";
import { protect } from "@prepskill/common";
import { getUserProgress, getUserStats, getSheetProgress } from "../controllers/getProgress";
import { markSolved }   from "../controllers/markSolved";
import { unmarkSolved } from "../controllers/unmarkSolved";

const router = Router();
const auth = protect(process.env.JWT_SECRET!);

router.get("/:userId",                  getUserProgress);
router.get("/:userId/stats",            getUserStats);
router.get("/:userId/sheet/:sheetId",   getSheetProgress);
router.post("/solve",                   auth, markSolved);
router.delete("/solve/:problemId",      auth, unmarkSolved);

export default router;
