import { subscribeEvent } from "../config/rabbitmq";
import prisma from "../config/prisma";

export const registerConsumers = async (): Promise<void> => {
  // When a new problem is created, bump totalProblems in all matching SheetProgress rows
  await subscribeEvent(
    "content.events",
    "problem.created",
    "progress.problem.created",
    async ({ sheetId }) => {
      await prisma.sheetProgress.updateMany({
        where: { sheetId },
        data:  { totalProblems: { increment: 1 } },
      });
    }
  );

  console.log("[ProgressService] RabbitMQ consumers registered");
};
