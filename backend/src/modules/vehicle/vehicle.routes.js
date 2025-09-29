import { Router } from "express";
import { VehicleController } from "./vehicle.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createVehicleSchema,
  updateVehicleSchema,
  deleteVehicleSchema,
} from "./vehicle.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createVehicleSchema),
  VehicleController.create
);
router.get("/", authorize("read"), VehicleController.getAll);
router.get("/:id", authorize("read"), VehicleController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateVehicleSchema),
  VehicleController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteVehicleSchema),
  VehicleController.softDelete
);
router.delete("/:id/hard", authorize("delete"), VehicleController.hardDelete);
router.post("/:id/restore", authorize("update"), VehicleController.restore);

export default router;
