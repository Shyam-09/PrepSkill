import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../../config/prisma";
import { deleteCache, deleteCachePattern } from "../../utils/cache";
import { publishEvent } from "../../config/rabbitmq";

export const createProblem = asyncHandler(async (req: Request, res: Response) => {
  const result = await prisma.$transaction(async (tx) => {
    const problem = await tx.problem.create({
      data: { ...req.body, isDeleted: false },
    });

    await tx.sheet.update({
      where: { id: problem.sheetId },
      data: { totalProblems: { increment: 1 } },
    });

    return problem;
  });

  await deleteCachePattern("problems:*");

  await publishEvent("content.events", "problem.created", {
    problemId: result.id,
    sheetId: result.sheetId,
    topicId: result.topicId,
    title: result.title,
    difficulty: result.difficulty,
  });

  res.status(201).json({ success: true, data: result });
});

export const updateProblem = asyncHandler(async (req: Request, res: Response) => {
  const { isDeleted, ...data } = req.body;

  const problem = await prisma.problem
    .update({
      where: { id: req.params.id as string },
      data,
    })
    .catch(() => {
      throw new NotFoundError("Problem not found");
    });

  await deleteCachePattern("problems:*");
  await deleteCache(`problem:${req.params.id}`);

  res.json({ success: true, data: problem });
});

export const deleteProblem = asyncHandler(async (req: Request, res: Response) => {
  const result = await prisma.$transaction(async (tx) => {
    const problem = await tx.problem.findFirst({
      where: { id: req.params.id as string, isDeleted: false },
    });

    if (!problem) throw new NotFoundError("Problem not found");

    // SOFT DELETE ONLY (recommended)
    await tx.problem.update({
      where: { id: problem.id },
      data: { isDeleted: true },
    });

    await tx.sheet.update({
      where: { id: problem.sheetId },
      data: { totalProblems: { decrement: 1 } },
    });

    return problem;
  });

  await deleteCachePattern("problems:*");
  await deleteCache(`problem:${req.params.id}`);

  await publishEvent("content.events", "problem.deleted", {
    problemId: result.id,
    sheetId: result.sheetId,
  });

  res.json({ success: true, message: "Problem deleted" });
});