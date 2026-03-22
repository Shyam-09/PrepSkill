import { Request, Response } from "express";
import { asyncHandler, NotFoundError, BadRequestError } from "@prepskill/common";
import prisma from "../config/prisma";
import redis from "../config/redis";
import { publishEvent } from "../config/rabbitmq";

export const submitAttempt = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { answers, timeTakenSeconds } = req.body;

  const attempt = await prisma.mockAttempt.findUnique({ where: { id: req.params.id as string } });
  if (!attempt)                        throw new NotFoundError("Attempt not found");
  if (attempt.userId !== userId)       throw new BadRequestError("Not your attempt");
  if (attempt.status === "completed")  throw new BadRequestError("Already submitted");

  const test = await prisma.mockTest.findUnique({
    where: { id: attempt.testId },
    include: { questions: true },
  });
  if (!test) throw new NotFoundError("Test not found");

  // Grade answers
  let score = 0;
  const gradedAnswers = (answers as { questionId: string; selectedOption: number }[]).map((a) => {
    const q = test.questions.find((q) => q.id === a.questionId);
    if (!q) return { questionId: a.questionId, selectedOption: -1, isCorrect: false, marksAwarded: 0 };
    const isCorrect   = a.selectedOption === q.correctAnswer;
    const marksAwarded = isCorrect ? q.marks : 0;
    score += marksAwarded;
    return { questionId: a.questionId, selectedOption: a.selectedOption, isCorrect, marksAwarded };
  });

  const percentage = test.totalMarks > 0
    ? Math.round((score / test.totalMarks) * 10000) / 100
    : 0;

  const updated = await prisma.mockAttempt.update({
    where: { id: attempt.id },
    data: {
      score, percentage, timeTakenSeconds: timeTakenSeconds ?? 0,
      status: "completed", completedAt: new Date(),
      answers: { create: gradedAnswers },
    },
    include: { answers: true },
  });

  await prisma.mockTest.update({
    where: { id: test.id },
    data:  { totalAttempts: { increment: 1 } },
  });

  // Redis leaderboard sorted set
  const lbKey = `leaderboard:mock:${test.id}`;
  await redis.zadd(lbKey, score, userId);
  const rankRaw = await redis.zrevrank(lbKey, userId);
  const rank    = rankRaw !== null ? rankRaw + 1 : null;

  if (rank !== null) {
    await prisma.mockAttempt.update({ where: { id: attempt.id }, data: { rank } });
  }

  await publishEvent("mock.events", "mock.completed", {
    userId, testId: test.id,
    score, totalMarks: test.totalMarks, percentage, timeTakenSeconds,
    completedAt: new Date().toISOString(),
  });

  res.json({ success: true, data: { ...updated, rank } });
});
