import Item from "./item.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const ItemCrud = new BaseCrud(Item);

// 2. Plug it into BaseController
export const ItemController = new BaseController(ItemCrud, "Item");
