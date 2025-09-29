import Supplier from "./supplier.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const SupplierCrud = new BaseCrud(Supplier);

// 2. Plug it into BaseController
export const SupplierController = new BaseController(SupplierCrud, "Supplier");
