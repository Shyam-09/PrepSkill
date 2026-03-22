import { Router } from "express";
import { protect } from "@prepskill/common";
import { getCategories, getCategoryById }          from "../controllers/category/getCategories";
import { createCategory, updateCategory, deleteCategory } from "../controllers/category/mutateCategory";
import { getSheets, getSheetById }                 from "../controllers/sheet/getSheet";
import { createSheet, updateSheet, deleteSheet }   from "../controllers/sheet/mutateSheet";
import { getTopicsBySheet, getTopicById }           from "../controllers/topic/getTopic";
import { createTopic, updateTopic, deleteTopic }   from "../controllers/topic/mutateTopic";
import { getProblems, getProblemById }             from "../controllers/problem/getProblem";
import { createProblem, updateProblem, deleteProblem } from "../controllers/problem/mutateProblem";
import { createCategoryValidator, updateCategoryValidator } from "../validators/categoryValidator";
import { createSheetValidator, updateSheetValidator } from "../validators/sheetValidator";
import { createTopicValidator, updateTopicValidator } from "../validators/topicValidator";
import { createProblemValidator, updateProblemValidator } from "../validators/problemValidator";
import { validateRequest as validate} from "../middlewares/validateRequest";

const router = Router();
const auth = protect(process.env.JWT_SECRET!);

// Health check
router.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "content-service", timestamp: new Date().toISOString() })
);

// Categories
router.get("/categories",     getCategories);
router.get("/categories/:id", getCategoryById);
router.post("/categories",        auth, createCategoryValidator, validate, createCategory);
router.put("/categories/:id",     auth, updateCategoryValidator, validate, updateCategory);
router.delete("/categories/:id",  auth, deleteCategory);

// Sheets
router.get("/sheets",     getSheets);
router.get("/sheets/:id", getSheetById);
router.post("/sheets",       auth, createSheetValidator, validate, createSheet);
router.put("/sheets/:id",    auth, updateSheetValidator, validate, updateSheet);
router.delete("/sheets/:id", auth, deleteSheet);

// Topics
router.get("/topics/sheet/:sheetId", getTopicsBySheet);
router.get("/topics/:id",            getTopicById);
router.post("/topics",       auth, createTopicValidator, validate, createTopic);
router.put("/topics/:id",    auth, updateTopicValidator, validate, updateTopic);
router.delete("/topics/:id", auth, deleteTopic);

// Problems
router.get("/problems",     getProblems);
router.get("/problems/:id", getProblemById);
router.post("/problems",       auth, createProblemValidator, validate, createProblem);
router.put("/problems/:id",    auth, updateProblemValidator, validate, updateProblem);
router.delete("/problems/:id", auth, deleteProblem);

export default router;
