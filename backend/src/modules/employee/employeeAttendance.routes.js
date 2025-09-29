import { Router } from "express";
import { employeeAttendanceController } from "./employeeAttendance.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createEmployeeAttendanceSchema,
  updateEmployeeAttendanceSchema,
  deleteEmployeeAttendanceSchema,
} from "./employeeAttendance.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createEmployeeAttendanceSchema),
  employeeAttendanceController.create
);
router.get("/", authorize("read"), employeeAttendanceController.getAll);
router.get("/:id", authorize("read"), employeeAttendanceController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateEmployeeAttendanceSchema),
  employeeAttendanceController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteEmployeeAttendanceSchema),
  employeeAttendanceController.softDelete
);
router.delete(
  "/:id/hard",
  authorize("delete"),
  employeeAttendanceController.hardDelete
);
router.post(
  "/:id/restore",
  authorize("update"),
  employeeAttendanceController.restore
);
router.post(
  "/deduct-salary",
  authorize("update"),
  employeeAttendanceController.deductSalaryFromAdvance
);

export default router;
