import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../config/prisma";
import { getCache, setCache } from "../utils/cache";

const TTL = 600;

export const getInterviews = asyncHandler(async (req: Request, res: Response) => {
  const { company, outcome, yoe, role, page = "1", limit = "10" } = req.query;
  const pageNum  = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);

  const where: any = { isApproved: true };
  if (company) where.companySlug = (company as string).toLowerCase().replace(/\s+/g, "-");
  if (outcome) where.outcome     = outcome;
  if (yoe)     where.yoe         = yoe;
  if (role)    where.role        = { contains: role as string, mode: "insensitive" };

  const key = `interviews:${JSON.stringify(where)}:${page}:${limit}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, ...(cached as object), fromCache: true });

  const [posts, total] = await prisma.$transaction([
    prisma.interviewExperience.findMany({
      where,
      include: { rounds: true },
      orderBy: [{ upvoteCount: "desc" }, { createdAt: "desc" }],
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.interviewExperience.count({ where }),
  ]);

  // Mask userId for anonymous posts
  const sanitized = posts.map((p) => ({ ...p, userId: p.isAnonymous ? null : p.userId }));
  const result = { data: sanitized, total, page: pageNum, pages: Math.ceil(total / limitNum) };
  await setCache(key, result, TTL);
  res.json({ success: true, ...result });
});

export const getInterviewById = asyncHandler(async (req: Request, res: Response) => {
  const post = await prisma.interviewExperience.findUnique({
    where: { id: req.params.id as string },
    include: { rounds: true },
  });
  if (!post || !post.isApproved) throw new NotFoundError("Post not found");
  const data = { ...post, userId: post.isAnonymous ? null : post.userId };
  res.json({ success: true, data });
});

export const getCompanies = asyncHandler(async (_req: Request, res: Response) => {
  const key = "interviews:companies";
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const companies = await prisma.interviewExperience.findMany({
    where: { isApproved: true },
    select: { company: true },
    distinct: ["company"],
    orderBy: { company: "asc" },
  });

  const list = companies.map((c) => c.company);
  await setCache(key, list, TTL);
  res.json({ success: true, data: list });
});

export const getMyInterviews = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const posts  = await prisma.interviewExperience.findMany({
    where: { userId },
    include: { rounds: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: posts });
});
