import { Request, Response } from "express";
import { asyncHandler } from "@prepskill/common";
import prisma from "../config/prisma";
import { getCache, setCache } from "../utils/cache";

export const getUserAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const key = `analytics:user:${userId}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const analytics = await prisma.userAnalytics.findUnique({
    where: { userId: userId as string },
    include: { activityByDay: { orderBy: { date: "asc" }, take: 365 } },
  });

  const data = analytics ?? {
    userId, totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
    currentStreak: 0, longestStreak: 0, mockAttempts: 0, averageMockScore: 0,
    interviewPosts: 0, activityByDay: [],
  };

  await setCache(key, data, 120);
  res.json({ success: true, data });
});
