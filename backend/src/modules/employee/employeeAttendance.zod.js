// src/modules/employeeAttendance/employeeAttendance.zod.js
import { z } from "zod";

// Reusable YYYY-MM-DD date string validator
const dateYYYYMMDD = z
  .string()
  .refine(
    (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: "Invalid date format, expected YYYY-MM-DD" }
  );

export const createEmployeeAttendanceSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID"),
  presence: z.enum(["present", "absent"]),
  workStatus: z.enum(["working", "non-working"]).optional(),
  salary: z
    .number({ invalid_type_error: "Salary must be a number" })
    .int("Salary must be an integer")
    .nonnegative("Salary must be non-negative"),
  date: dateYYYYMMDD,
  siteId: z.string().uuid("Invalid site ID format").nullable().optional(),
  vehicleId: z.string().uuid("Invalid vehicle ID format").nullable().optional(),
});

export const updateEmployeeAttendanceSchema = createEmployeeAttendanceSchema.partial();

export const deleteEmployeeAttendanceSchema = z.object({});
