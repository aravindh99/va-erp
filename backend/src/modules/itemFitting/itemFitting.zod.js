import { z } from "zod";

export const createItemFittingSchema = z.object({
  itemId: z.string().uuid("Invalid item ID format"),
  vehicleId: z.string().uuid("Invalid vehicle ID format"),
  dailyEntryId: z.string().uuid("Invalid daily entry ID format"),
  startingRPM: z.number().int().nonnegative("Starting RPM must be non-negative").optional(),
  closingRPM: z.number().int().nonnegative("Closing RPM must be non-negative").optional(),
  status: z.enum(["fitted", "removed"]).optional(),
  removedDate: z.string().date("Invalid date format").optional(),
  removedDailyEntryId: z.string().uuid("Invalid daily entry ID format").optional(),
});

export const updateItemFittingSchema = createItemFittingSchema.partial();

export const deleteItemFittingSchema = z.object({});
