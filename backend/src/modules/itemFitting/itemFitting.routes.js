import { Router } from "express";
import { itemFittingController } from "./itemFitting.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createItemFittingSchema,
  updateItemFittingSchema,
  deleteItemFittingSchema,
} from "./itemFitting.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createItemFittingSchema),
  itemFittingController.create
);
router.get("/", authorize("read"), itemFittingController.getAll);
router.get("/:id", authorize("read"), itemFittingController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateItemFittingSchema),
  itemFittingController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteItemFittingSchema),
  itemFittingController.softDelete
);
router.delete(
  "/:id/hard",
  authorize("delete"),
  itemFittingController.hardDelete
);
router.post(
  "/:id/restore",
  authorize("update"),
  itemFittingController.restore
);

export default router;
