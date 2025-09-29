import { Router } from "express";
import { StockTransactionController } from "./stockTransaction.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { authorize } from "../../shared/middlewares/auth.js";
import {
  createStockTransactionSchema,
  updateStockTransactionSchema,
  deleteStockTransactionSchema,
} from "./stockTransaction.zod.js";

const router = Router();

router.post("/", authorize("create"), validate(createStockTransactionSchema), StockTransactionController.create);
router.get("/", authorize("read"), StockTransactionController.getAll);
router.get("/:id", authorize("read"), StockTransactionController.getById);
router.put(
  "/:id",
  authorize("update"),
  validate(updateStockTransactionSchema),
  StockTransactionController.update
);
router.delete(
  "/:id",
  authorize("delete"),
  validate(deleteStockTransactionSchema),
  StockTransactionController.softDelete
);
router.delete("/:id/hard", authorize("delete"), StockTransactionController.hardDelete);
router.post("/:id/restore", authorize("update"), StockTransactionController.restore);

export default router;


