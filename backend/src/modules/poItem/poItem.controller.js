import PoItem from "./poItem.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const PoItemCrud = new BaseCrud(PoItem);

// 2. Plug it into BaseController
export const PoItemController = new BaseController(PoItemCrud, "PoItem");
