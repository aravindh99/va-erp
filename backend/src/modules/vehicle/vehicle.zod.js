import { z } from "zod";

export const createVehicleSchema = z.object({
  vehicleType: z.string().min(1).max(255),
  vehicleNumber: z.string().min(1).max(255).transform(val => val.toUpperCase()),
  status: z.enum(["active", "inactive"]).optional(),
  brandId: z.string().uuid("Invalid brand ID format"),
  siteId: z.string().uuid("Invalid site ID format"),
  vehicleRPM: z.number().int().min(0, "Starting RPM must be non-negative").optional(),
  vehicleServiceSchedule: z.array(z.number().int().positive()).optional(),
  compressorId: z.string().uuid("Invalid compressor ID format").optional(),
  compressorRPM: z.number().int().min(0, "Compressor RPM must be non-negative").optional(),
  compressorServiceSchedule: z.array(z.number().int().positive()).optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const deleteVehicleSchema = z.object({});
