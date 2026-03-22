import { Request, Response } from "express";
import { asyncHandler } from "@prepskill/common";
import prisma from "../config/prisma";
import { getCache, setCache } from "../utils/cache";

const TTL = 300;

export const getUserProgress = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const key = `progress:${userId}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  let progress = await prisma.userProgress.findUnique({
    where: { userId: userId as string },
    include: { solvedProblems: true, sheetProgress: true },
  });

  if (!progress) {
    progress = await prisma.userProgress.create({
      data: { userId: userId as string },
      include: { solvedProblems: true, sheetProgress: true },
    });
  }

  await setCache(key, progress, TTL);
  res.json({ success: true, data: progress });
});

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const key = `stats:${userId}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const progress = await prisma.userProgress.findUnique({
    where: { userId: userId as string },
    select: {
      totalSolved: true, easySolved: true, mediumSolved: true, hardSolved: true,
      currentStreak: true, longestStreak: true, lastActiveDate: true,
      sheetProgress: true,
    },
  });

  const data = progress ?? {
    totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
    currentStreak: 0, longestStreak: 0, lastActiveDate: null, sheetProgress: [],
  };

  await setCache(key, data, TTL);
  res.json({ success: true, data });
});

export const getSheetProgress = asyncHandler(async (req: Request, res: Response) => {
  const { userId, sheetId } = req.params;
  const key = `progress:${userId}:sheet:${sheetId}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const progress = await prisma.userProgress.findUnique({ where: { userId: userId as string } });
  if (!progress) return res.json({ success: true, data: { solvedCount: 0, completionPercentage: 0 } });

  const [sheetProg, solvedInSheet] = await prisma.$transaction([
    prisma.sheetProgress.findUnique({
      where: { progressId_sheetId: { progressId: progress.id, sheetId: sheetId as string } },
    }),
    prisma.solvedProblem.findMany({
      where: { progressId: progress.id, sheetId: sheetId as string },
    }),
  ]);

  const result = { sheetId, ...sheetProg, solvedProblems: solvedInSheet };
  await setCache(key, result, TTL);
  res.json({ success: true, data: result });
});
