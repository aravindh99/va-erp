import { z } from "zod";

export const createItemInstanceSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  instanceNumber: z.string().min(1, "Instance number is required"),
  status: z.enum(["in_stock", "fitted", "removed"]).optional(),
  currentMeter: z.number().min(0, "Current meter must be non-negative").optional(),
  currentRPM: z.number().min(0, "Current RPM must be non-negative").optional(),
  nextServiceRPM: z.number().min(0, "Next service RPM must be non-negative").optional(),
  lastServiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD").optional(),
  nextServiceDue: z.number().min(0, "Next service due must be non-negative").optional(),
  fittedToVehicleId: z.string().uuid("Invalid vehicle ID format").optional(),
  fittedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD").optional(),
  removedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD").optional(),
  notes: z.string().optional(),
});

export const updateItemInstanceSchema = createItemInstanceSchema.partial();

export const deleteItemInstanceSchema = z.object({});
