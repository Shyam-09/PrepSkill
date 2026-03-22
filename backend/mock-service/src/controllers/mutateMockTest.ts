import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../config/prisma";
import { deleteCachePattern } from "../utils/cache";

export const createMockTest = asyncHandler(async (req: Request, res: Response) => {
  const { questions = [], ...rest } = req.body;
  const totalMarks = (questions as any[]).reduce((sum: number, q: any) => sum + (q.marks ?? 1), 0);

  const test = await prisma.mockTest.create({
    data: {
      ...rest,
      totalMarks,
      questions: { create: questions.map((q: any, i: number) => ({ ...q, order: i })) },
    },
    include: { questions: true },
  });

  await deleteCachePattern("mock-tests:*");
  res.status(201).json({ success: true, data: test });
});

export const updateMockTest = asyncHandler(async (req: Request, res: Response) => {
  const { questions, ...rest } = req.body;
  const test = await prisma.mockTest.update({
    where: { id: req.params.id as string },
    data: rest,
  }).catch(() => { throw new NotFoundError("Mock test not found"); });

  await deleteCachePattern("mock-tests:*");
  res.json({ success: true, data: test });
});

export const deleteMockTest = asyncHandler(async (req: Request, res: Response) => {
  await prisma.mockTest.delete({ where: { id: req.params.id as string } })
    .catch(() => { throw new NotFoundError("Mock test not found"); });
  await deleteCachePattern("mock-tests:*");
  res.json({ success: true, message: "Mock test deleted" });
});
