import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../config/prisma";

export const startAttempt = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { testId } = req.body;

  const test = await prisma.mockTest.findUnique({ where: { id: testId } });
  if (!test) throw new NotFoundError("Mock test not found");

  // Resume existing in-progress attempt
  const existing = await prisma.mockAttempt.findFirst({
    where: { userId, testId, status: "in_progress" },
  });
  if (existing) return res.json({ success: true, data: existing, resumed: true });

  const attempt = await prisma.mockAttempt.create({
    data: { userId, testId, totalMarks: test.totalMarks },
  });

  res.status(201).json({ success: true, data: attempt });
});
