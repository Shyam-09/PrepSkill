import prisma from "../config/prisma";

export const upsertSheetProgress = async (
  progressId: string,
  sheetId: string,
  increment: boolean
): Promise<void> => {
  const existing = await prisma.sheetProgress.findUnique({
    where: { progressId_sheetId: { progressId, sheetId } },
  });

  if (existing) {
    const solvedCount = increment
      ? existing.solvedCount + 1
      : Math.max(0, existing.solvedCount - 1);
    const completionPercentage =
      existing.totalProblems > 0
        ? Math.round((solvedCount / existing.totalProblems) * 100)
        : 0;

    await prisma.sheetProgress.update({
      where: { progressId_sheetId: { progressId, sheetId } },
      data:  { solvedCount, completionPercentage, lastActivityAt: new Date() },
    });
  } else if (increment) {
    await prisma.sheetProgress.create({
      data: { progressId, sheetId, solvedCount: 1, lastActivityAt: new Date() },
    });
  }
};
