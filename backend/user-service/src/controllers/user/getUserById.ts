import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../../config/prisma";
import { getCache, setCache } from "../../utils/cache"; 

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  const cacheKey = `user:${userId}`;


  const cached = await getCache<any>(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached,
      fromCache: true,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });

  if (!user) throw new NotFoundError("User not found");


  await setCache(cacheKey, user, 120);

  res.status(200).json({
    success: true,
    data: user,
    fromCache: false,
  });
});