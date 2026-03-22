import { Request, Response } from "express";
import { asyncHandler, BadRequestError, NotFoundError } from "@prepskill/common";
import prisma from "../../config/prisma";
import { deleteCache, deleteCachePattern } from "../../utils/cache";
import { publishEvent } from "../../config/rabbitmq";

export const createSheet = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.sheet.findFirst({ where: { slug: req.body.slug, isDeleted: false } });
  if (existing) throw new BadRequestError("Slug already in use");

  const sheet = await prisma.sheet.create({ data: { ...req.body, isDeleted: false } });
  await deleteCachePattern("sheets:*");

  await publishEvent("content.events", "sheet.created", {
    sheetId: sheet.id,
    title:   sheet.title,
  });

  res.status(201).json({ success: true, data: sheet });
});

export const updateSheet = asyncHandler(async (req: Request, res: Response) => {
  const { isDeleted, ...data } = req.body;
  const sheet = await prisma.sheet.update({ where: { id: req.params.id as string }, data })
    .catch(() => { throw new NotFoundError("Sheet not found"); });
  await deleteCachePattern("sheets:*");
  await deleteCache(`sheet:${req.params.id}`);
  res.json({ success: true, data: sheet });
});

export const deleteSheet = asyncHandler(async (req: Request, res: Response) => {
  const   sheet = await prisma.sheet.findFirst({ where: { id: req.params.id as string, isDeleted: false } });
  if (!sheet) throw new NotFoundError("Sheet not found");

  await prisma.sheet.update({
    where: { id: req.params.id as string },
    data: { isDeleted: true }
  })
    .catch(() => { throw new NotFoundError("Sheet not found"); });
  await deleteCachePattern("sheets:*");
  await deleteCache(`sheet:${req.params.id}`);
  res.json({ success: true, message: "Sheet deleted" });
});
