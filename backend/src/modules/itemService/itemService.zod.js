import { z } from "zod";

export const createItemServiceSchema = z.object({
  itemId: z.string().uuid("Invalid item ID format"),
  vehicleId: z.string().uuid("Invalid vehicle ID format").optional(),
  serviceRPM: z.number().int().positive("Service RPM must be positive"),
  serviceDate: z.string().date("Invalid date format"),
  notes: z.string().optional(),
  dailyEntryId: z.string().uuid("Invalid daily entry ID format").optional(),
});

export const updateItemServiceSchema = createItemServiceSchema.partial();

export const deleteItemServiceSchema = z.object({});
