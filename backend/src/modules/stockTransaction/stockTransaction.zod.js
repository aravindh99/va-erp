import { z } from "zod";

export const createStockTransactionSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().positive(),
  rate: z.number().nonnegative().optional(),
  reference: z.string().optional(),
  referenceId: z.string().uuid().optional(),
});

export const updateStockTransactionSchema = createStockTransactionSchema.partial();
export const deleteStockTransactionSchema = z.object({});


