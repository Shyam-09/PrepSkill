import { subscribeEvent } from "../config/rabbitmq";
import prisma from "../config/prisma";
import { deleteCache } from "../utils/cache";

export const registerInterviewConsumer = async (): Promise<void> => {
  await subscribeEvent(
    "interview.events", "interview.posted",
    "analytics.interview.posted",
    async ({ userId }) => {
      await prisma.platformStats.upsert({
        where:  { id: "singleton" },
        create: { id: "singleton", totalInterviewPosts: 1 },
        update: { totalInterviewPosts: { increment: 1 } },
      });

      await prisma.userAnalytics.upsert({
        where:  { userId },
        create: { userId, interviewPosts: 1 },
        update: { interviewPosts: { increment: 1 } },
      });

      await deleteCache("analytics:dashboard", `analytics:user:${userId}`);
    }
  );
};
