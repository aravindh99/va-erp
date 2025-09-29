import Site from "./site.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const SiteCrud = new BaseCrud(Site);

// 2. Plug it into BaseController
export const SiteController = new BaseController(SiteCrud, "Site");
