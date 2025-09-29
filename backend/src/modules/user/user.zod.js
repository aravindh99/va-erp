import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(3).max(20),
  role: z.enum(["admin", "editor", "viewer"]),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  password: z.string().min(3).max(20).optional(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
});

export const deleteUserSchema = z.object({});
