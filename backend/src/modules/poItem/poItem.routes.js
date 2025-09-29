import { Router } from "express";
import { PoItemController } from "./poItem.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createPoItemSchema,
  updatePoItemSchema,
  deletePoItemSchema,
} from "./poItem.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createPoItemSchema),
  PoItemController.create
);
router.get("/", authorize("read"), PoItemController.getAll);
router.get("/:id", authorize("read"), PoItemController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updatePoItemSchema),
  PoItemController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deletePoItemSchema),
  PoItemController.softDelete
);
router.delete("/:id/hard", authorize("delete"), PoItemController.hardDelete);
router.post("/:id/restore", authorize("update"), PoItemController.restore);

export default router;
