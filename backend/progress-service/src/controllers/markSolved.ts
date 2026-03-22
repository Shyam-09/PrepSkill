import { Request, Response } from "express";
import { asyncHandler } from "@prepskill/common";
import prisma from "../config/prisma";
import { deleteCache } from "../utils/cache";
import { computeStreak } from "../helpers/streakHelper";
import { publishEvent } from "../config/rabbitmq";

export const markSolved = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const { problemId, sheetId, topicId, difficulty, notes } = req.body;

  const updated = await prisma.$transaction(async (tx) => {
    // Upsert progress record
    let progress = await tx.userProgress.upsert({
      where:  { userId },
      create: { userId },
      update: {},
      include: { solvedProblems: true },
    });

    const existing = progress.solvedProblems.find((p) => p.problemId === problemId);
    const isRevision = !!existing;

    if (isRevision) {
      await tx.solvedProblem.update({
        where: { id: existing!.id },
        data:  { isRevision: true, solvedAt: new Date(), notes: notes ?? existing!.notes },
      });
    } else {
      await tx.solvedProblem.create({
        data: { progressId: progress.id, problemId, sheetId, topicId, difficulty, notes, isRevision: false },
      });

      const diffField = difficulty === "easy" ? "easySolved" : difficulty === "medium" ? "mediumSolved" : "hardSolved";
      await tx.userProgress.update({
        where: { id: progress.id },
        data:  { totalSolved: { increment: 1 }, [diffField]: { increment: 1 } },
      });

      // Upsert sheet progress atomically
      const existingSheetProgress = await tx.sheetProgress.findUnique({
        where: { progressId_sheetId: { progressId: progress.id, sheetId } },
      });

      if (existingSheetProgress) {
        const solvedCount = existingSheetProgress.solvedCount + 1;
        const completionPercentage =
          existingSheetProgress.totalProblems > 0
            ? Math.round((solvedCount / existingSheetProgress.totalProblems) * 100)
            : 0;

        await tx.sheetProgress.update({
          where: { progressId_sheetId: { progressId: progress.id, sheetId } },
          data:  { solvedCount, completionPercentage, lastActivityAt: new Date() },
        });
      } else {
        // Fetch sheet to get totalProblems
        const sheet = await tx.sheet.findUnique({ where: { id: sheetId } });
        await tx.sheetProgress.create({
          data: {
            progressId: progress.id,
            sheetId,
            solvedCount: 1,
            totalProblems: sheet?.totalProblems ?? 0,
            completionPercentage: 0,
            lastActivityAt: new Date(),
          },
        });
      }
    }

    // Recompute streak from all solved dates
    const allSolved = await tx.solvedProblem.findMany({
      where:  { progressId: progress.id },
      select: { solvedAt: true },
      orderBy: { solvedAt: "asc" },
    });

    const { current, longest } = computeStreak(allSolved);

    const finalUpdated = await tx.userProgress.update({
      where: { id: progress.id },
      data:  { currentStreak: current, longestStreak: longest, lastActiveDate: new Date() },
      include: { solvedProblems: true, sheetProgress: true },
    });

    return { updated: finalUpdated, isRevision, current, totalSolved: finalUpdated.totalSolved };
  });

  await deleteCache(`progress:${userId}`, `progress:${userId}:sheet:${sheetId}`, `stats:${userId}`);

  await publishEvent("progress.events", "problem.solved", {
    userId, problemId, sheetId, topicId, difficulty, isRevision: updated.isRevision,
    currentStreak: updated.current,
    totalSolved: updated.totalSolved,
    solvedAt: new Date().toISOString(),
  });

  res.status(200).json({ success: true, data: updated.updated });
});
