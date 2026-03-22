import { Request, Response } from "express";
import { asyncHandler } from "@prepskill/common";
import prisma from "../config/prisma";
import redis from "../config/redis";
import { getCache, setCache } from "../utils/cache";

export const getOverallLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) ?? "20", 10), 100);
  const key = `analytics:leaderboard:overall:${limit}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const top = await prisma.userAnalytics.findMany({
    select: { userId: true, totalSolved: true, currentStreak: true, longestStreak: true, mockAttempts: true, averageMockScore: true },
    orderBy: [{ totalSolved: "desc" }, { currentStreak: "desc" }],
    take: limit,
  });

  await setCache(key, top, 300);
  res.json({ success: true, data: top });
});

export const getSheetLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId } = req.params;
  const limit = Math.min(parseInt((req.query.limit as string) ?? "20", 10), 100);

  const raw = await redis.zrevrange(`analytics:sheet:${sheetId}:solvers`, 0, limit - 1, "WITHSCORES");

  const leaderboard: { rank: number; userId: string; solvedCount: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    leaderboard.push({ rank: i / 2 + 1, userId: raw[i]!, solvedCount: Number(raw[i + 1]) });
  }

  res.json({ success: true, data: leaderboard });
});
