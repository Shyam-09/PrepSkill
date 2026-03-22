import { Request, Response } from "express";
import { asyncHandler } from "@prepskill/common";
import prisma from "../config/prisma";

export const getActivityHeatmap = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const analytics = await prisma.userAnalytics.findUnique({
    where: { userId: userId as string },
    include: { activityByDay: { select: { date: true, solves: true }, orderBy: { date: "asc" } } },
  });

  const heatmap = analytics?.activityByDay.map(({ date, solves }) => ({ date, count: solves })) ?? [];
  res.json({ success: true, data: heatmap });
});
