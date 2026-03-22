import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { errorHandler } from "@prepskill/common";
import prisma from "./config/prisma";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import redis from "./config/redis";

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? ["http://localhost:3000", "http://prepskill.com"],
  credentials: true,
}));
app.use(express.json());

app.get("/api/users/health", (_req, res) =>
  res.json({ status: "ok", service: "user-service", timestamp: new Date().toISOString() })
);

app.use("/api/auth",  authRoutes);
app.use("/api/users", userRoutes);
app.use(errorHandler);

const start = async () => {
  await redis.connect();
  await prisma.$connect();
  console.log("[UserService] PostgreSQL connected");
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`[UserService] running on port ${PORT}`));
};

export default app;

if (require.main === module) {
  start();
}
