import { Request, Response } from "express";
import { asyncHandler, NotFoundError } from "@prepskill/common";
import prisma from "../../config/prisma";
import { getCache, setCache } from "../../utils/cache";

const TTL = 1800;

export const getTopicsBySheet = asyncHandler(async (req: Request, res: Response) => {
  const { sheetId } = req.params;
  const key = `topics:sheet:${sheetId}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const topics = await prisma.topic.findMany({
    where: { sheetId: sheetId as string, isDeleted: false },
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });

  await setCache(key, topics, TTL);
  res.json({ success: true, data: topics });
});

export const getTopicById = asyncHandler(async (req: Request, res: Response) => {
  const key = `topic:${req.params.id}`;
  const cached = await getCache(key);
  if (cached) return res.json({ success: true, data: cached, fromCache: true });

  const topic = await prisma.topic.findFirst({
    where: { id: req.params.id as string, isDeleted: false },
    include: { sheet: { select: { id: true, title: true, slug: true } } },
  });
  if (!topic) throw new NotFoundError("Topic not found");

  await setCache(key, topic, TTL);
  res.json({ success: true, data: topic });
});
