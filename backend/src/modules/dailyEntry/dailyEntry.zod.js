import { z } from "zod";

const dateYYYYMMDD = z
  .string()
  .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "Invalid date format, expected YYYY-MM-DD" });

export const createDailyEntrySchema = z.object({
  refNo: z.string().min(1, "Reference number is required"),
  date: dateYYYYMMDD,
  // Vehicle RPM - opening and closing
  vehicleOpeningRPM: z.number().int().nonnegative("Vehicle opening RPM must be non-negative").optional(),
  vehicleClosingRPM: z.number().int().nonnegative("Vehicle closing RPM must be non-negative").optional(),
  // Compressor RPM - opening and closing
  compressorOpeningRPM: z.number().int().nonnegative("Compressor opening RPM must be non-negative").optional(),
  compressorClosingRPM: z.number().int().nonnegative("Compressor closing RPM must be non-negative").optional(),
  // Diesel and meter readings
  dieselUsed: z.number().int().nonnegative("Diesel used must be non-negative").optional(),
  vehicleHSD: z.number().int().nonnegative("Vehicle HSD must be non-negative").optional(),
  compressorHSD: z.number().int().nonnegative("Compressor HSD must be non-negative").optional(),
  meter: z.number().int().nonnegative("Meter reading must be non-negative").optional(),
  // Number of holes drilled
  noOfHoles: z.number().int().nonnegative("Number of holes must be non-negative").optional(),
  vehicleServiceDone: z.boolean().optional(),
  compressorServiceDone: z.boolean().optional(),
  employeeId: z.string().uuid("Invalid employee ID format"),
  employeeIds: z.array(z.string().uuid("Invalid employee ID format")).optional(),
  siteId: z.string().uuid("Invalid site ID format"),
  vehicleId: z.string().uuid("Invalid vehicle ID format"),
  compressorId: z.string().uuid("Invalid compressor ID format").optional(),
  // Item fitting data
  fittedItemInstanceIds: z.array(z.string().uuid("Invalid item instance ID format")).optional(),
  removedItemInstanceIds: z.array(z.string().uuid("Invalid item instance ID format")).optional(),
  additionalEmployeeIds: z.array(z.string().uuid("Invalid employee ID format")).optional(),
  notes: z.string().optional(),
});

export const updateDailyEntrySchema = createDailyEntrySchema.partial();

export const deleteDailyEntrySchema = z.object({});
