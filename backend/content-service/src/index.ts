import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "@prepskill/common";
import prisma           from "./config/prisma";
import { connectRabbitMQ } from "./config/rabbitmq";
import contentRoutes   from "./routes/contentRoutes";
import redis from "./config/redis";

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000", "http://prepskill.com"],
  credentials: true,
}));
app.use(express.json());

app.use("/api/content", contentRoutes);
app.use(errorHandler);

const start = async () => {
  await redis.connect();
  await prisma.$connect();
  console.log("[ContentService] PostgreSQL connected");
  await connectRabbitMQ();
  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => console.log(`[ContentService] running on port ${PORT}`));
};

if (require.main === module) {
  start();
}

export default app;
