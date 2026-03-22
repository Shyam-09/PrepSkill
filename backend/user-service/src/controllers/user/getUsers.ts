import { Request, Response } from "express";
import { asyncHandler } from "@prepskill/common";
import prisma from "../../config/prisma";
import { getCache, setCache } from "../../utils/cache"; 

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = "1", limit = "20", search = "" } = req.query;

  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip     = (pageNum - 1) * limitNum;

  const cacheKey = `users:page:${pageNum}:limit:${limitNum}:search:${search}`;

  const cached = await getCache<any>(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      ...cached,
      fromCache: true,
    });
  }

  const where = search
    ? {
        OR: [
          { name:  { contains: search as string, mode: "insensitive" as const } },
          { email: { contains: search as string, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  const response = {
    data: users,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
  };


  await setCache(cacheKey, response, 60);

  res.status(200).json({
    success: true,
    ...response,
    fromCache: false,
  });
});