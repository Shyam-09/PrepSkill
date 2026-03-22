import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../../config/prisma";
import { deleteCache } from "../../utils/cache";

export const createTopic = asyncHandler(async (req: Request, res: Response) => {
  const topic = await prisma.topic.create({ data: { ...req.body, isDeleted: false } });
  await deleteCache(`topics:sheet:${topic.sheetId}`);
  res.status(201).json({ success: true, data: topic });
});

export const updateTopic = asyncHandler(async (req: Request, res: Response) => {
  const { isDeleted, ...data } = req.body;
  const topic = await prisma.topic.update({ where: { id: req.params.id as string }, data })
    .catch(() => { throw new NotFoundError("Topic not found"); });
  await deleteCache(`topics:sheet:${topic.sheetId}`, `topic:${req.params.id}`);
  res.json({ success: true, data: topic });
});

export const deleteTopic = asyncHandler(async (req: Request, res: Response) => {
  const topic = await prisma.topic.findFirst({ where: { id: req.params.id as string, isDeleted: false } });
  if (!topic) throw new NotFoundError("Topic not found");
  await prisma.topic.update({
    where: { id: req.params.id as string },
    data: { isDeleted: true }
  })
    .catch(() => { throw new NotFoundError("Topic not found"); });

  await deleteCache(`topics:sheet:${topic.sheetId}`, `topic:${req.params.id}`);
  res.json({ success: true, message: "Topic deleted" });
});
