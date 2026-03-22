import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../config/prisma";
import { getCache, setCache } from "../utils/cache";

const TTL = 1800;

export const getMockTests = asyncHandler(async (req: Request, res: Response) => {
  const { category, difficulty } = req.query;
  const key = `mock-tests:${category ?? "all"}:${difficulty ?? "all"}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const where: any = {};
  if (category)   where.category   = category;
  if (difficulty) where.difficulty = difficulty;

  // Omit correctAnswer and explanation from questions
  const tests = await prisma.mockTest.findMany({
    where,
    include: {
      questions: {
        select: { id: true, question: true, options: true, difficulty: true, marks: true, order: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  await setCache(key, tests, TTL);
  res.json({ success: true, data: tests });
});

export const getMockTestById = asyncHandler(async (req: Request, res: Response) => {
  const test = await prisma.mockTest.findUnique({
    where: { id: req.params.id as string },
    include: {
      questions: {
        select: { id: true, question: true, options: true, difficulty: true, marks: true, order: true },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!test) throw new NotFoundError("Mock test not found");
  res.json({ success: true, data: test });
});
