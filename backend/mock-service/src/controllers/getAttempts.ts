import { Request, Response } from "express";
import { asyncHandler, NotFoundError, BadRequestError } from "@prepskill/common";
import prisma from "../config/prisma";
import { getCache, setCache } from "../utils/cache";
import redis from "../config/redis";

export const getMyAttempts = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const attempts = await prisma.mockAttempt.findMany({
    where: { userId, status: "completed" },
    include: { test: { select: { id: true, title: true, category: true, difficulty: true, totalMarks: true, duration: true } } },
    orderBy: { completedAt: "desc" },
  });
  res.json({ success: true, data: attempts });
});

export const getAttemptById = asyncHandler(async (req: Request, res: Response) => {
  const userId  = (req as any).user.userId;
  const attempt = await prisma.mockAttempt.findUnique({
    where: { id: req.params.id as string },
    include: {
      test:    { include: { questions: true } },
      answers: true,
    },
  });
  if (!attempt) throw new NotFoundError("Attempt not found");
  if (attempt.userId !== userId) throw new BadRequestError("Not your attempt");
  res.json({ success: true, data: attempt });
});

export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { testId } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) ?? "20", 10), 100);

  const key = `leaderboard:mock:${testId}:top${limit}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const top = await prisma.mockAttempt.findMany({
    where: { testId: testId as string, status: "completed" },
    select: { userId: true, score: true, percentage: true, timeTakenSeconds: true, completedAt: true, rank: true },
    orderBy: [{ score: "desc" }, { timeTakenSeconds: "asc" }],
    take: limit,
  });

  await setCache(key, top, 300);
  res.json({ success: true, data: top });
});
