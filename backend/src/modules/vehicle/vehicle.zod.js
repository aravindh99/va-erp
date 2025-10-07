import { z } from "zod";

export const createVehicleSchema = z.object({
  vehicleType: z.string().min(1).max(255),
  vehicleNumber: z.string().min(1).max(255).transform(val => val.toUpperCase()),
  status: z.enum(["active", "inactive"]).optional(),
  brandId: z.string().uuid("Invalid brand ID format"),
  vehicleRPM: z.number().min(0, "Starting RPM must be non-negative").optional(),
  nextServiceRPM: z.number().min(0, "Next service RPM must be non-negative").optional(),
  compressorId: z.string().uuid("Invalid compressor ID format").optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const deleteVehicleSchema = z.object({});
