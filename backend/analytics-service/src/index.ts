import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "@prepskill/common";
import prisma from "./config/prisma";
import { connectRabbitMQ }    from "./config/rabbitmq";
import { registerAllConsumers } from "./events";
import analyticsRoutes from "./routes/analyticsRoutes";
import redis from "./config/redis";

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000", "http://prepskill.com"],
  credentials: true,
}));
app.use(express.json());

app.get("/api/analytics/health", (_req, res) =>
  res.json({ status: "ok", service: "analytics-service", timestamp: new Date().toISOString() })
);

app.use("/api/analytics", analyticsRoutes);
app.use(errorHandler);

const start = async () => {
  await redis.connect();
  await prisma.$connect();
  console.log("[AnalyticsService] PostgreSQL connected");
  await connectRabbitMQ();
  await registerAllConsumers();
  const PORT = process.env.PORT || 5006;
  app.listen(PORT, () => console.log(`[AnalyticsService] running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

export default app;
