import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../config/prisma";
import { deleteCachePattern } from "../utils/cache";

export const upvoteInterview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;
  const postId = req.params.id as string;

  const post = await prisma.interviewExperience.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError("Post not found");

  // Check if already upvoted
  const existing = await prisma.interviewUpvote.findUnique({
    where: { userId_experienceId: { userId, experienceId: postId } },
  });

  if (existing) {
    // Toggle off
    await prisma.$transaction([
      prisma.interviewUpvote.delete({ where: { id: existing.id } }),
      prisma.interviewExperience.update({
        where: { id: postId },
        data:  { upvoteCount: { decrement: 1 } },
      }),
    ]);
    await deleteCachePattern("interviews:*");
    return res.json({ success: true, upvoted: false, upvoteCount: post.upvoteCount - 1 });
  }

  // Toggle on
  await prisma.$transaction([
    prisma.interviewUpvote.create({ data: { userId, experienceId: postId } }),
    prisma.interviewExperience.update({
      where: { id: postId },
      data:  { upvoteCount: { increment: 1 } },
    }),
  ]);

  await deleteCachePattern("interviews:*");
  res.json({ success: true, upvoted: true, upvoteCount: post.upvoteCount + 1 });
});
