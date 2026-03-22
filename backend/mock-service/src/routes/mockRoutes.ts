import { Router } from "express";
import { protect } from "@prepskill/common";
import { getMockTests, getMockTestById }           from "../controllers/getMockTest";
import { createMockTest, updateMockTest, deleteMockTest } from "../controllers/mutateMockTest";
import { startAttempt }                            from "../controllers/startAttempt";
import { submitAttempt }                           from "../controllers/submitAttempt";
import { getMyAttempts, getAttemptById, getLeaderboard } from "../controllers/getAttempts";

const router = Router();
const auth = protect(process.env.JWT_SECRET!);

// Tests
router.get("/tests",      getMockTests);
router.get("/tests/:id",  getMockTestById);
router.post("/tests",       auth, createMockTest);
router.put("/tests/:id",    auth, updateMockTest);
router.delete("/tests/:id", auth, deleteMockTest);

// Leaderboard
router.get("/leaderboard/:testId", getLeaderboard);

// Attempts
router.post("/attempts/start",      auth, startAttempt);
router.post("/attempts/:id/submit", auth, submitAttempt);
router.get("/attempts/me",          auth, getMyAttempts);
router.get("/attempts/:id",         auth, getAttemptById);

export default router;
