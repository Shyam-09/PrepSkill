import { Router } from "express";
import { protect } from "@prepskill/common";
import { getInterviews, getInterviewById, getCompanies, getMyInterviews } from "../controllers/getInterview";
import { createInterview, updateInterview, deleteInterview }              from "../controllers/mutateInterview";
import { upvoteInterview }                                                from "../controllers/upvoteInterview";

const router = Router();
const auth = protect(process.env.JWT_SECRET!);

router.get("/",          getInterviews);
router.get("/companies", getCompanies);
router.get("/me",        auth, getMyInterviews);
router.get("/:id",       getInterviewById);
router.post("/",         auth, createInterview);
router.put("/:id",       auth, updateInterview);
router.delete("/:id",    auth, deleteInterview);
router.post("/:id/upvote", auth, upvoteInterview);

export default router;
