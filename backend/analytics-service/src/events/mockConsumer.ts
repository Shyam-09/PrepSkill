import { subscribeEvent } from "../config/rabbitmq";
import prisma from "../config/prisma";
import { deleteCache } from "../utils/cache";

export const registerMockConsumer = async (): Promise<void> => {
  await subscribeEvent(
    "mock.events", "mock.completed",
    "analytics.mock.completed",
    async ({ userId, percentage }) => {
      await prisma.platformStats.upsert({
        where:  { id: "singleton" },
        create: { id: "singleton", totalMockAttempts: 1 },
        update: { totalMockAttempts: { increment: 1 } },
      });

      const existing = await prisma.userAnalytics.findUnique({ where: { userId } });
      if (existing) {
        const newCount = existing.mockAttempts + 1;
        const newAvg   = Math.round(
          ((existing.averageMockScore * existing.mockAttempts + percentage) / newCount) * 100
        ) / 100;
        await prisma.userAnalytics.update({
          where: { userId },
          data:  { mockAttempts: newCount, averageMockScore: newAvg },
        });
      } else {
        await prisma.userAnalytics.create({
          data: { userId, mockAttempts: 1, averageMockScore: percentage },
        });
      }

      await deleteCache("analytics:dashboard", `analytics:user:${userId}`);
    }
  );
};
