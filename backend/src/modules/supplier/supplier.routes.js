import { Router } from "express";
import { SupplierController } from "./supplier.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
  deleteSupplierSchema,
} from "./supplier.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createSupplierSchema),
  SupplierController.create
);
router.get("/", authorize("read"), SupplierController.getAll);
router.get("/:id", authorize("read"), SupplierController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateSupplierSchema),
  SupplierController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteSupplierSchema),
  SupplierController.softDelete
);
router.delete("/:id/hard", authorize("delete"), SupplierController.hardDelete);
router.post("/:id/restore", authorize("update"), SupplierController.restore);

export default router;
