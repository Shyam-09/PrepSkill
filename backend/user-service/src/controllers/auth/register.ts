import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { asyncHandler, BadRequestError } from "@prepskill/common";
import prisma from "../../config/prisma";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new BadRequestError("Email already registered");

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    data: user,
  });
});
