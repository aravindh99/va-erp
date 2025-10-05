import { Router } from "express";
import { PoController } from "./po.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import { createPoSchema, updatePoSchema, deletePoSchema } from "./po.zod.js";

const router = Router();

router.post(
  "/",
  authorize("create"),
  validate(createPoSchema),
  PoController.create
);
router.get("/", authorize("read"), PoController.getAll);
router.get("/generate-ref", authorize("read"), PoController.generatePONumberAPI);
router.get("/:id", authorize("read"), PoController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updatePoSchema),
  PoController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deletePoSchema),
  PoController.softDelete
);
router.delete("/:id/hard", authorize("delete"), PoController.hardDelete);
router.post("/:id/restore", authorize("update"), PoController.restore);
router.post("/:id/received", authorize("update"), PoController.markAsReceived);


export default router;
