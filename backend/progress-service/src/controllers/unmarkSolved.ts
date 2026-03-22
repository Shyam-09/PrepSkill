import { Request, Response } from "express";
import { asyncHandler, BadRequestError, NotFoundError } from "@prepskill/common";
import prisma from "../config/prisma";
import { deleteCache } from "../utils/cache";

export const unmarkSolved = asyncHandler(async (req: Request, res: Response) => {
  const userId    = (req as any).user.userId;
  const { problemId } = req.params;

  const updated = await prisma.$transaction(async (tx) => {
    const progress = await tx.userProgress.findUnique({ where: { userId } });
    if (!progress) throw new NotFoundError("Progress not found");

    const solved = await tx.solvedProblem.findUnique({
      where: { progressId_problemId: { progressId: progress.id, problemId: problemId as string } },
    });
    if (!solved) throw new BadRequestError("Problem was not marked as solved");

    await tx.solvedProblem.delete({ where: { id: solved.id } });

    const diffField = solved.difficulty === "easy" ? "easySolved" : solved.difficulty === "medium" ? "mediumSolved" : "hardSolved";
    await tx.userProgress.update({
      where: { id: progress.id },
      data:  { totalSolved: { decrement: 1 }, [diffField]: { decrement: 1 } },
    });

    // Upsert sheet progress atomically
    const existingSheetProgress = await tx.sheetProgress.findUnique({
      where: { progressId_sheetId: { progressId: progress.id, sheetId: solved.sheetId } },
    });

    if (existingSheetProgress) {
      const solvedCount = Math.max(0, existingSheetProgress.solvedCount - 1);
      const completionPercentage =
        existingSheetProgress.totalProblems > 0
          ? Math.round((solvedCount / existingSheetProgress.totalProblems) * 100)
          : 0;

      await tx.sheetProgress.update({
        where: { progressId_sheetId: { progressId: progress.id, sheetId: solved.sheetId } },
        data:  { solvedCount, completionPercentage, lastActivityAt: new Date() },
      });
    }

    const result = await tx.userProgress.findUnique({
      where: { id: progress.id },
      include: { solvedProblems: true, sheetProgress: true },
    });

    return { result, sheetId: solved.sheetId };
  });

  await deleteCache(`progress:${userId}`, `stats:${userId}`, `progress:${userId}:sheet:${updated.sheetId}`);

  res.json({ success: true, message: "Problem unmarked", data: updated.result });
});
