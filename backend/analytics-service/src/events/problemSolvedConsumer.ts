import { subscribeEvent } from "../config/rabbitmq";
import prisma from "../config/prisma";
import redis from "../config/redis";
import { deleteCache } from "../utils/cache";

export const registerProblemSolvedConsumer = async (): Promise<void> => {
  await subscribeEvent(
    "progress.events", "problem.solved",
    "analytics.problem.solved",
    async ({ userId, difficulty, sheetId, currentStreak, isRevision }) => {
      if (isRevision) return;

      await prisma.platformStats.upsert({
        where:  { id: "singleton" },
        create: { id: "singleton", totalSolves: 1 },
        update: { totalSolves: { increment: 1 } },
      });

      const diffField = difficulty === "easy" ? "easySolved" : difficulty === "medium" ? "mediumSolved" : "hardSolved";
      const today = new Date().toISOString().split("T")[0]!;

      // Upsert UserAnalytics
      const existing = await prisma.userAnalytics.findUnique({ where: { userId } });
      if (existing) {
        await prisma.userAnalytics.update({
          where: { userId },
          data: { totalSolved: { increment: 1 }, [diffField]: { increment: 1 }, currentStreak },
        });

        // Upsert today activity row
        await prisma.activityByDay.upsert({
          where:  { userAnalyticsId_date: { userAnalyticsId: existing.id, date: today } },
          create: { userAnalyticsId: existing.id, date: today, solves: 1 },
          update: { solves: { increment: 1 } },
        });
      } else {
        const created = await prisma.userAnalytics.create({
          data: { userId, totalSolved: 1, [diffField]: 1, currentStreak },
        });
        await prisma.activityByDay.create({
          data: { userAnalyticsId: created.id, date: today, solves: 1 },
        });
      }

      await redis.zincrby(`analytics:sheet:${sheetId}:solvers`, 1, userId);
      await deleteCache("analytics:dashboard", `analytics:user:${userId}`);
    }
  );
};
