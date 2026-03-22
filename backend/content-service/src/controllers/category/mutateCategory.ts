import { Request, Response } from "express";
import { asyncHandler, BadRequestError, NotFoundError } from "@prepskill/common";
import prisma from "../../config/prisma";
import { deleteCache } from "../../utils/cache";

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const existing = await prisma.category.findFirst({ where: { slug: req.body.slug, isDeleted: false } });
  if (existing) throw new BadRequestError("Slug already in use");

  const category = await prisma.category.create({ data: { ...req.body, isDeleted: false } });
  await deleteCache("categories:all");
  res.status(201).json({ success: true, data: category });
});



export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { isDeleted, ...data } = req.body;
  const category = await prisma.category.update({
    where: { id: req.params.id as string },
    data,
  }).catch(() => { throw new NotFoundError("Category not found"); });

  await deleteCache("categories:all", `category:${req.params.id}`);
  res.json({ success: true, data: category });
});




export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await prisma.category.findFirst({ where: { id: req.params.id as string, isDeleted: false } });
  if (!category) throw new NotFoundError("Category not found");

  await prisma.category.update({
    where: { id: req.params.id as string },
    data: { isDeleted: true }
  })
    .catch(() => { throw new NotFoundError("Category not found"); });

  await deleteCache("categories:all", `category:${req.params.id}`);
  res.json({ success: true, message: "Category deleted" });
});
