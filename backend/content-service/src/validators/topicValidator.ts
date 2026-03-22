import { body } from "express-validator";

export const createTopicValidator = [
  body("title").trim().notEmpty().withMessage("Topic title is required")
    .isLength({ min: 2, max: 100 }).withMessage("Title must be 2–100 characters"),
  body("slug").trim().notEmpty().withMessage("Slug is required")
    .isSlug().withMessage("Slug must be a valid slug"),
  body("sheetId").trim().notEmpty().withMessage("Sheet ID is required")
    .isUUID().withMessage("Sheet ID must be a valid UUID"),
  body("description").optional().isString().trim(),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];

export const updateTopicValidator = [
  body("title").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Title must be 2–100 characters"),
  body("slug").optional().trim().isSlug().withMessage("Slug must be a valid slug"),
  body("description").optional().isString().trim(),
  body("order").optional().isInt({ min: 0 }).withMessage("Order must be a non-negative integer"),
];
