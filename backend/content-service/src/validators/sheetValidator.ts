import { body } from "express-validator";

export const createSheetValidator = [
  body("title").trim().notEmpty().withMessage("Sheet title is required")
    .isLength({ min: 2, max: 100 }).withMessage("Title must be 2–100 characters"),
  body("slug").trim().notEmpty().withMessage("Slug is required")
    .isSlug().withMessage("Slug must be a valid slug"),
  body("categoryId").trim().notEmpty().withMessage("Category ID is required")
    .isUUID().withMessage("Category ID must be a valid UUID"),
  body("description").optional().isString().trim(),
  body("difficulty").optional().isIn(["beginner", "intermediate", "advanced"]).withMessage("Invalid difficulty level"),
  body("isPremium").optional().isBoolean().withMessage("isPremium must be a boolean"),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
  body("totalProblems").optional().isInt({ min: 0 }).withMessage("Total problems must be a non-negative integer"),
];

export const updateSheetValidator = [
  body("title").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Title must be 2–100 characters"),
  body("slug").optional().trim().isSlug().withMessage("Slug must be a valid slug"),
  body("categoryId").optional().isUUID().withMessage("Category ID must be a valid UUID"),
  body("description").optional().isString().trim(),
  body("difficulty").optional().isIn(["beginner", "intermediate", "advanced"]).withMessage("Invalid difficulty level"),
  body("isPremium").optional().isBoolean().withMessage("isPremium must be a boolean"),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
  body("totalProblems").optional().isInt({ min: 0 }).withMessage("Total problems must be a non-negative integer"),
];
