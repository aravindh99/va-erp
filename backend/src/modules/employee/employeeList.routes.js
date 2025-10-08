import { Router } from "express";
import { EmployeeListController } from "./employeeList.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  deleteEmployeeSchema,
} from "./employeeList.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createEmployeeSchema),
  EmployeeListController.create
);
router.get("/", authorize("read"), EmployeeListController.getAll);
router.get("/:id", authorize("read"), EmployeeListController.getById);
router.get("/:id/history", authorize("read"), EmployeeListController.getEmployeeHistory);
router.put(
  "/:id",
  authorize("update"),
  validate(updateEmployeeSchema),
  EmployeeListController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteEmployeeSchema),
  EmployeeListController.softDelete
);
router.delete(
  "/:id/hard",
  authorize("delete"),
  EmployeeListController.hardDelete
);
router.post(
  "/:id/restore",
  authorize("update"),
  EmployeeListController.restore
);

export default router;
