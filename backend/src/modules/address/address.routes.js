import { Router } from "express";
import { AddressController } from "./address.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createAddressSchema,
  updateAddressSchema,
  deleteAddressSchema,
} from "./address.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createAddressSchema),
  AddressController.create
);
router.get("/", authorize("read"), AddressController.getAll);
router.get("/:id", authorize("read"), AddressController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateAddressSchema),
  AddressController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteAddressSchema),
  AddressController.softDelete
);
router.delete("/:id/hard", authorize("delete"), AddressController.hardDelete);
router.post("/:id/restore", authorize("update"), AddressController.restore);

export default router;
