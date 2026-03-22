import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "./asyncHandler";
import { AppError } from "../errors/AppError";
import redis from "../config/redis";

export const protect = (secret: string) =>
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Not authorized, no token", 401);
    }

    const token = authHeader.split(" ")[1]!;

    const blacklisted = await redis.get(`blacklist:${token}`);

    if (blacklisted) throw new AppError("Token has been revoked", 401);

    const decoded = jwt.verify(token, secret);

    (req as any).user = decoded;
    
    next();
  });
