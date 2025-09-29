import { Router } from "express";
import { DailyEntryController } from "./dailyEntry.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createDailyEntrySchema,
  updateDailyEntrySchema,
  deleteDailyEntrySchema,
} from "./dailyEntry.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createDailyEntrySchema),
  DailyEntryController.create
);
router.get("/generate-ref", authorize("read"), DailyEntryController.generateRef);
router.get("/", authorize("read"), DailyEntryController.getAll);
router.get("/:id", authorize("read"), DailyEntryController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateDailyEntrySchema),
  DailyEntryController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteDailyEntrySchema),
  DailyEntryController.softDelete
);
router.delete(
  "/:id/hard",
  authorize("delete"),
  DailyEntryController.hardDelete
);
router.post("/:id/restore", authorize("update"), DailyEntryController.restore);

export default router;
