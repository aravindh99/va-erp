import StockTransaction from "./stockTransaction.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

const StockTransactionCrud = new BaseCrud(StockTransaction);

export const StockTransactionController = new BaseController(
  StockTransactionCrud,
  "StockTransaction"
);


