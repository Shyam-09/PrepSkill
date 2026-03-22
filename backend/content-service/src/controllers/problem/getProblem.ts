import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../../config/prisma";
import { getCache, setCache } from "../../utils/cache";

const TTL = 1800;

export const getProblems = asyncHandler(async (req: Request, res: Response) => {
  const { topicId, sheetId, difficulty, tags, page = "1", limit = "20" } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const where: any = { isDeleted: false };
  if (topicId)    where.topicId    = topicId;
  if (sheetId)    where.sheetId    = sheetId;
  if (difficulty) where.difficulty = difficulty;
  if (tags) {
    const tagList = (tags as string).split(",").map((t) => t.trim());
    where.tags = { hasSome: tagList };
  }

  const key = `problems:${JSON.stringify(where)}:${page}:${limit}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, ...(cached as object), fromCache: true });

  const [problems, total] = await prisma.$transaction([
    prisma.problem.findMany({
      where,
      include: {
        topic: { select: { id: true, title: true, slug: true } },
        sheet: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { order: "asc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.problem.count({ where }),
  ]);

  const result = { data: problems, total, page: pageNum, pages: Math.ceil(total / limitNum) };
  await setCache(key, result, TTL);
  res.json({ success: true, ...result });
});

export const getProblemById = asyncHandler(async (req: Request, res: Response) => {
  const key = `problem:${req.params.id}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const problem = await prisma.problem.findFirst({
    where: { id: req.params.id as string, isDeleted: false },
    include: {
      topic: { select: { id: true, title: true, slug: true } },
      sheet: { select: { id: true, title: true, slug: true } },
    },
  });
  if (!problem) throw new NotFoundError("Problem not found");

  await setCache(key, problem, TTL);
  res.json({ success: true, data: problem });
});
