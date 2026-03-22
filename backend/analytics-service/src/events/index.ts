import { registerContentConsumers }     from "./contentConsumers";
import { registerProblemSolvedConsumer } from "./problemSolvedConsumer";
import { registerMockConsumer }          from "./mockConsumer";
import { registerInterviewConsumer }     from "./interviewConsumer";

export const registerAllConsumers = async (): Promise<void> => {
  await registerContentConsumers();
  await registerProblemSolvedConsumer();
  await registerMockConsumer();
  await registerInterviewConsumer();
  console.log("[AnalyticsService] All consumers registered");
};
