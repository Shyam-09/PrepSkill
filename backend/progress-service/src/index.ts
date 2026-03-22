import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "@prepskill/common";
import prisma from "./config/prisma";
import { connectRabbitMQ }  from "./config/rabbitmq";
import { registerConsumers } from "./events/consumers";
import progressRoutes from "./routes/progressRoutes";
import redis from "./config/redis";

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000", "http://prepskill.com"],
  credentials: true,
}));
app.use(express.json());

app.get("/api/progress/health", (_req, res) =>
  res.json({ status: "ok", service: "progress-service", timestamp: new Date().toISOString() })
);

app.use("/api/progress", progressRoutes);
app.use(errorHandler);

const start = async () => {
  await redis.connect();
  await prisma.$connect();
  console.log("[ProgressService] PostgreSQL connected");
  await connectRabbitMQ();
  await registerConsumers();
  const PORT = process.env.PORT || 5003;
  app.listen(PORT, () => console.log(`[ProgressService] running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

export default app;
