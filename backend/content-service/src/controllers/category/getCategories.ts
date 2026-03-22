import { Request, Response } from "express";
import { asyncHandler } from "@prepskill/common";
import prisma from "../../config/prisma";
import { getCache, setCache } from "../../utils/cache";
import { NotFoundError } from "@prepskill/common";

const TTL = 3600;

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const key = "categories:all";
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const categories = await prisma.category.findMany({ where: { isDeleted: false }, orderBy: [{ order: "asc" }, { name: "asc" }] });
  await setCache(key, categories, TTL);
  res.json({ success: true, data: categories });
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  
  const key = `category:${req.params.id}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const category = await prisma.category.findFirst({ where: { id: req.params.id as string, isDeleted: false } });
  if (!category) throw new NotFoundError("Category not found");

  await setCache(key, category, TTL);
  res.json({ success: true, data: category });
});
