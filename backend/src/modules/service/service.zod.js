import { z } from "zod";

export const createServiceSchema = z.object({
  serviceRPM: z.number().int().positive("Service RPM must be positive"),
  serviceDate: z.string().date("Invalid date format").optional(),
  serviceType: z.enum(["vehicle", "compressor"]),
  vehicleId: z.string().uuid("Invalid vehicle ID format"),
  compressorId: z.string().uuid("Invalid compressor ID format").optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const deleteServiceSchema = z.object({});
