import { z } from "zod";

export const createBrandSchema = z.object({
  brandName: z.string().min(1).max(255),
  brandStatus: z.enum(["active", "inactive"]),
});

export const updateBrandSchema = createBrandSchema.partial();

export const deleteBrandSchema = z.object({});
