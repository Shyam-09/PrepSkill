import { body } from "express-validator";

export const createProblemValidator = [
  body("title").trim().notEmpty().withMessage("Problem title is required")
    .isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters"),
  body("slug").trim().notEmpty().withMessage("Slug is required")
    .isSlug().withMessage("Slug must be a valid slug"),
  body("difficulty").isIn(["easy", "medium", "hard"]).withMessage("Difficulty must be easy, medium, or hard"),
  body("topicId").trim().notEmpty().withMessage("Topic ID is required")
    .isUUID().withMessage("Topic ID must be a valid UUID"),
  body("sheetId").trim().notEmpty().withMessage("Sheet ID is required")
    .isUUID().withMessage("Sheet ID must be a valid UUID"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("leetcodeUrl").optional().isURL().withMessage("Invalid LeetCode URL"),
  body("articleUrl").optional().isURL().withMessage("Invalid article URL"),
  body("videoUrl").optional().isURL().withMessage("Invalid video URL"),
  body("isPremium").optional().isBoolean().withMessage("isPremium must be a boolean"),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];

export const updateProblemValidator = [
  body("title").optional().trim().isLength({ min: 2, max: 200 }).withMessage("Title must be 2–200 characters"),
  body("slug").optional().trim().isSlug().withMessage("Slug must be a valid slug"),
  body("difficulty").optional().isIn(["easy", "medium", "hard"]).withMessage("Difficulty must be easy, medium, or hard"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("leetcodeUrl").optional().isURL().withMessage("Invalid LeetCode URL"),
  body("articleUrl").optional().isURL().withMessage("Invalid article URL"),
  body("videoUrl").optional().isURL().withMessage("Invalid video URL"),
  body("isPremium").optional().isBoolean().withMessage("isPremium must be a boolean"),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];
