import { subscribeEvent } from "../config/rabbitmq";
import prisma from "../config/prisma";
import { deleteCache } from "../utils/cache";

export const registerContentConsumers = async (): Promise<void> => {
  await subscribeEvent(
    "content.events", "problem.created",
    "analytics.problem.created",
    async () => {
      await prisma.platformStats.upsert({
        where:  { id: "singleton" },
        create: { id: "singleton", totalProblems: 1 },
        update: { totalProblems: { increment: 1 } },
      });
      await deleteCache("analytics:dashboard");
    }
  );

  await subscribeEvent(
    "content.events", "sheet.created",
    "analytics.sheet.created",
    async () => {
      await prisma.platformStats.upsert({
        where:  { id: "singleton" },
        create: { id: "singleton", totalSheets: 1 },
        update: { totalSheets: { increment: 1 } },
      });
      await deleteCache("analytics:dashboard");
    }
  );
};
