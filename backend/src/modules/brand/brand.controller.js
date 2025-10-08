import Brand from "./brand.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const BrandCrud = new BaseCrud(Brand);

// 2. Plug it into BaseController
export const BrandController = new BaseController(BrandCrud, "Brand");
