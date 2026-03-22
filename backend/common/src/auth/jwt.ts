import jwt from "jsonwebtoken";

export const generateAccessToken = (userId: string): string =>
  jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "15m" });

export const generateRefreshToken = (userId: string): string =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" });
