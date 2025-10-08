import { z } from "zod";

export const createItemSchema = z.object({
  itemName: z.string().min(1).optional(),
  partNumber: z.string().min(1).optional(),
  groupName: z.string().min(1).optional(),
  units: z.enum(["kg", "ltr", "mtr", "nos", "set", "unit"]),
  purchaseRate: z.number().min(0).optional(),
  gst: z.number().min(0).optional(),
  canBeFitted: z.boolean().optional(),
  stock: z.number().min(0).optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const deleteItemSchema = z.object({});
