import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "@prepskill/common";
import prisma from "./config/prisma";
import { connectRabbitMQ } from "./config/rabbitmq";
import interviewRoutes from "./routes/interviewRoutes";
import redis from "./config/redis";

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000", "http://prepskill.com"],
  credentials: true,
}));
app.use(express.json());

app.get("/api/interviews/health", (_req, res) =>
  res.json({ status: "ok", service: "interview-service", timestamp: new Date().toISOString() })
);

app.use("/api/interviews", interviewRoutes);
app.use(errorHandler);

const start = async () => {
  await redis.connect();
  await prisma.$connect();
  console.log("[InterviewService] PostgreSQL connected");
  await connectRabbitMQ();
  const PORT = process.env.PORT || 5005;
  app.listen(PORT, () => console.log(`[InterviewService] running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

export default app;
