import { z } from "zod";

export const createCompressorSchema = z.object({
  compressorName: z.string().min(1).max(255),
  compressorType: z.string().min(1).max(255),
  status: z.enum(["active", "inactive"]).optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().date("Invalid date format").optional(),
  compressorRPM: z.number().min(0, "Compressor RPM must be non-negative").optional(),
  nextServiceRPM: z.number().min(0, "Next service RPM must be non-negative").optional(),
});

export const updateCompressorSchema = createCompressorSchema.partial();

export const deleteCompressorSchema = z.object({});
