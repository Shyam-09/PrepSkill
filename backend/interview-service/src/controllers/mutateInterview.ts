import { Request, Response } from "express";
import { asyncHandler, NotFoundError, BadRequestError } from "@prepskill/common";
import prisma from "../config/prisma";
import { deleteCachePattern, deleteCache } from "../utils/cache";
import { publishEvent } from "../config/rabbitmq";

export const createInterview = asyncHandler(async (req: Request, res: Response) => {
  const userId     = (req as any).user.userId;
  const { rounds = [], ...rest } = req.body;
  const companySlug = rest.company.toLowerCase().replace(/\s+/g, "-");

  const post = await prisma.interviewExperience.create({
    data: {
      ...rest,
      userId,
      companySlug,
      rounds: { create: rounds },
    },
    include: { rounds: true },
  });

  await deleteCachePattern("interviews:*");
  await deleteCache("interviews:companies");

  await publishEvent("interview.events", "interview.posted", {
    postId: post.id, userId, company: post.company, outcome: post.outcome,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json({ success: true, data: post });
});

export const updateInterview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const post   = await prisma.interviewExperience.findUnique({ where: { id: req.params.id as string } });
  if (!post)               throw new NotFoundError("Post not found");
  if (post.userId !== userId) throw new BadRequestError("Not authorized to edit this post");

  const { rounds, ...rest } = req.body;
  const updated = await prisma.interviewExperience.update({
    where: { id: req.params.id as string },
    data: rest,
    include: { rounds: true },
  });

  await deleteCachePattern("interviews:*");
  res.json({ success: true, data: updated });
});

export const deleteInterview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const post   = await prisma.interviewExperience.findUnique({ where: { id: req.params.id as string } });
  if (!post)               throw new NotFoundError("Post not found");
  if (post.userId !== userId) throw new BadRequestError("Not authorized");

  await prisma.interviewExperience.delete({ where: { id: req.params.id as string } });
  await deleteCachePattern("interviews:*");
  res.json({ success: true, message: "Post deleted" });
});
