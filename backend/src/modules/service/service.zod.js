import { z } from "zod";

export const createServiceSchema = z.object({
  serviceRPM: z.number().int().positive("Service RPM must be positive"),
  nextServiceRPM: z.number().int().min(0, "Next service RPM must be non-negative").optional(),
  serviceDate: z.string().date("Invalid date format").optional(),
  serviceType: z.enum(["vehicle", "compressor", "item"]),
  vehicleId: z.string().uuid("Invalid vehicle ID format").optional(),
  compressorId: z.string().uuid("Invalid compressor ID format").optional(),
  itemInstanceId: z.string().uuid("Invalid item instance ID format").optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const deleteServiceSchema = z.object({});
