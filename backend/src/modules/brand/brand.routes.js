import { Router } from "express";
import { BrandController } from "./brand.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createBrandSchema,
  updateBrandSchema,
  deleteBrandSchema,
} from "./brand.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createBrandSchema),
  BrandController.create
);
router.get("/", authorize("read"), BrandController.getAll);
router.get("/:id", authorize("read"), BrandController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateBrandSchema),
  BrandController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteBrandSchema),
  BrandController.softDelete
);
router.delete("/:id/hard", authorize("delete"), BrandController.hardDelete);
router.post("/:id/restore", authorize("update"), BrandController.restore);

export default router;
