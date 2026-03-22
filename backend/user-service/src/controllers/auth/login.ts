import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler, UnauthorizedError, generateAccessToken, generateRefreshToken } from "@prepskill/common";
import prisma from "../../config/prisma";
import redis from "../../config/redis";

const REFRESH_TTL = 7 * 24 * 60 * 60;

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new UnauthorizedError("Invalid email or password");

  const accessToken  = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await redis.set(`refresh:${user.id}`, refreshToken, "EX", REFRESH_TTL);

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    },
  });
});
