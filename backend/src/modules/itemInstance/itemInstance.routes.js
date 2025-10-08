import express from "express";
import ItemInstanceController from "./itemInstance.controller.js";
import { authorize } from "../../shared/middlewares/auth.js";
import { validateRequest } from "../../shared/middlewares/validateRequest.js";
import {
  createItemInstanceSchema,
  updateItemInstanceSchema,
  deleteItemInstanceSchema,
} from "./itemInstance.zod.js";

const router = express.Router();

// Custom routes (must be before /:id routes)
router.get("/available", authorize("read"), ItemInstanceController.getAvailable);
router.get("/fitted/:vehicleId", authorize("read"), ItemInstanceController.getFittedByVehicle);
router.get("/alerts/service", authorize("read"), ItemInstanceController.getServiceAlerts);

// CRUD routes
router.get("/", authorize("read"), ItemInstanceController.getAll);
router.get("/:id", authorize("read"), ItemInstanceController.getById);
router.post("/", authorize("create"), validateRequest(createItemInstanceSchema), ItemInstanceController.create);
router.put("/:id", authorize("update"), validateRequest(updateItemInstanceSchema), ItemInstanceController.update);
router.delete("/:id", authorize("delete"), ItemInstanceController.delete);

// Additional custom routes
router.post("/:id/fit", authorize("update"), ItemInstanceController.fitToVehicle);
router.post("/:id/remove", authorize("update"), ItemInstanceController.removeFromVehicle);
router.post("/:id/update-meter-rpm", authorize("update"), ItemInstanceController.updateMeterRPM);

export default router;
