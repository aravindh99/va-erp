import { z } from "zod";

export const createPoItemSchema = z.object({
  poId: z.string().uuid("Invalid PO ID format"),
  itemId: z.string().uuid("Invalid item ID format"),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().positive("Rate must be positive"),
  total: z.number().positive("Total must be positive"),
});

export const updatePoItemSchema = createPoItemSchema.partial();

export const deletePoItemSchema = z.object({});
