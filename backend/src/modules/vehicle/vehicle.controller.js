import Vehicle from "./vehicle.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const VehicleCrud = new BaseCrud(Vehicle);

// 2. Plug it into BaseController
export const VehicleController = new BaseController(VehicleCrud, "Vehicle");
