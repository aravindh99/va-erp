import { z } from "zod";

export const createEmployeeSchema = z.object({
  empId: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  designation: z.string().max(100).optional(),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
  joiningDate: z.string().date("Invalid date format").optional(),
  status: z.enum(["active", "inactive", "resigned"]).optional(),

    advancedAmount: z.number().nonnegative().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const deleteEmployeeSchema = z.object({});
