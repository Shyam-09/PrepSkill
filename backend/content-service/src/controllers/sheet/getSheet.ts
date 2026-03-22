import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../../config/prisma";
import { getCache, setCache } from "../../utils/cache";

const TTL = 1800;

export const getSheets = asyncHandler(async (req: Request, res: Response) => {
  const { categoryId, difficulty } = req.query;
  const key = `sheets:${categoryId ?? "all"}:${difficulty ?? "all"}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const where: any = { isDeleted: false };
  if (categoryId)  where.categoryId = categoryId;
  if (difficulty)  where.difficulty = difficulty;

  const sheets = await prisma.sheet.findMany({
    where,
    include: { category: { select: { id: true, name: true, slug: true, icon: true } } },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });

  await setCache(key, sheets, TTL);
  res.json({ success: true, data: sheets });
});

export const getSheetById = asyncHandler(async (req: Request, res: Response) => {
  const key = `sheet:${req.params.id}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const sheet = await prisma.sheet.findFirst({
    where: { id: req.params.id as string, isDeleted: false },
    include: { category: { select: { id: true, name: true, slug: true, icon: true } } },
  });
  if (!sheet) throw new NotFoundError("Sheet not found");

  await setCache(key, sheet, TTL);
  res.json({ success: true, data: sheet });
});
