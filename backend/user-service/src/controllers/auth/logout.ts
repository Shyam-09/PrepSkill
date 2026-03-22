import { Request, Response } from "express";
import { asyncHandler } from "@prepskill/common";
import redis from "../../config/redis";

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const token  = req.headers.authorization?.split(" ")[1];

  if (token) await redis.set(`blacklist:${token}`, "1", "EX", 15 * 60);
  await redis.del(`refresh:${userId}`);

  res.status(200).json({ success: true, message: "Logged out successfully" });
});
