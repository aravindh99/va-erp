import { Router } from "express";
import { CompressorController } from "./compressor.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createCompressorSchema,
  updateCompressorSchema,
  deleteCompressorSchema,
} from "./compressor.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createCompressorSchema),
  CompressorController.create
);
router.get("/", authorize("read"), CompressorController.getAll);
router.get("/:id", authorize("read"), CompressorController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateCompressorSchema),
  CompressorController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteCompressorSchema),
  CompressorController.softDelete
);
router.delete("/:id/hard", authorize("delete"), CompressorController.hardDelete);
router.post("/:id/restore", authorize("update"), CompressorController.restore);

export default router;
