import { z } from "zod";

export const createItemSchema = z.object({
  itemName: z.string().min(1),
  partNumber: z.string().min(1),
  groupName: z.string().min(1),
  units: z.enum(["kg", "ltr", "mtr", "nos", "set", "unit"]),
  purchaseRate: z.number().min(0),
  gst: z.number().min(0),
  canBeFitted: z.boolean().optional(),
});

export const updateItemSchema = createItemSchema.partial();

export const deleteItemSchema = z.object({});
