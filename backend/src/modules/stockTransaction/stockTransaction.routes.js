import { Router } from "express";
import { StockTransactionController } from "./stockTransaction.controller.js";
import { authorize } from "../../shared/middlewares/auth.js";

const router = Router();

router.post("/add-stock", authorize("create"), StockTransactionController.addStock);

export default router;


