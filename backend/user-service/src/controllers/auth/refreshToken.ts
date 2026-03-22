import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler, UnauthorizedError, generateAccessToken } from "@prepskill/common";
import redis from "../../config/redis";

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new UnauthorizedError("Refresh token is required");

  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const stored = await redis.get(`refresh:${decoded.userId}`);
  if (!stored || stored !== refreshToken) throw new UnauthorizedError("Refresh token revoked");

  const accessToken = generateAccessToken(decoded.userId);
  res.status(200).json({ success: true, data: { accessToken } });
});
