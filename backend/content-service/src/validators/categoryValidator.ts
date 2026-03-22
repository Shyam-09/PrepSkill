import { body } from "express-validator";

export const createCategoryValidator = [
  body("name").trim().notEmpty().withMessage("Category name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),
  body("slug").trim().notEmpty().withMessage("Slug is required")
    .isSlug().withMessage("Slug must be a valid slug"),
  body("description").optional().isString().trim(),
  body("icon").optional().isString().trim(),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];

export const updateCategoryValidator = [
  body("name").optional().trim().isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),
  body("slug").optional().trim().isSlug().withMessage("Slug must be a valid slug"),
  body("description").optional().isString().trim(),
  body("icon").optional().isString().trim(),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];
