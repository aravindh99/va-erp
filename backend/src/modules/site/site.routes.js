import { Router } from "express";
import { SiteController } from "./site.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createSiteSchema,
  updateSiteSchema,
  deleteSiteSchema,
} from "./site.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createSiteSchema),
  SiteController.create
);
router.get("/", authorize("read"), SiteController.getAll);
router.get("/:id", authorize("read"), SiteController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateSiteSchema),
  SiteController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteSiteSchema),
  SiteController.softDelete
);
router.delete("/:id/hard", authorize("delete"), SiteController.hardDelete);
router.post("/:id/restore", authorize("update"), SiteController.restore);

export default router;
