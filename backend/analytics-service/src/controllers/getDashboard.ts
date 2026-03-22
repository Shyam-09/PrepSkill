import { Request, Response } from "express";
import { asyncHandler } from "@prepskill/common";
import prisma from "../config/prisma";
import { getCache, setCache } from "../utils/cache";

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const key = "analytics:dashboard";
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const stats = await prisma.platformStats.findUnique({ where: { id: "singleton" } });
  const data = stats ?? {
    totalUsers: 0, totalProblems: 0, totalSheets: 0,
    totalSolves: 0, totalMockAttempts: 0, totalInterviewPosts: 0,
  };

  await setCache(key, data, 120);
  res.json({ success: true, data });
});
