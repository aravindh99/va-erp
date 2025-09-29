import { Router } from "express";
import { ServiceController } from "./service.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
} from "./service.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createServiceSchema),
  ServiceController.create
);
router.get("/", authorize("read"), ServiceController.getAll);
router.get("/:id", authorize("read"), ServiceController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateServiceSchema),
  ServiceController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteServiceSchema),
  ServiceController.softDelete
);
router.delete("/:id/hard", authorize("delete"), ServiceController.hardDelete);
router.post("/:id/restore", authorize("update"), ServiceController.restore);

// Service Alerts routes (moved to separate route file - see server.js)

export default router;
