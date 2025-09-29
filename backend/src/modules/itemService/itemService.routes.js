import { Router } from "express";
import { ItemServiceController } from "./itemService.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import { createItemServiceSchema, updateItemServiceSchema, deleteItemServiceSchema } from "./itemService.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createItemServiceSchema),
  ItemServiceController.create
);
router.get("/", authorize("read"), ItemServiceController.getAll);
router.get("/item/:itemId", authorize("read"), ItemServiceController.getByItemId);
router.get("/:id", authorize("read"), ItemServiceController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateItemServiceSchema),
  ItemServiceController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteItemServiceSchema),
  ItemServiceController.softDelete
);
router.delete("/:id/hard", authorize("delete"), ItemServiceController.hardDelete);
router.post("/:id/restore", authorize("update"), ItemServiceController.restore);

export default router;
