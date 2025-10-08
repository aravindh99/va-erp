import Address from "./address.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const AddressCrud = new BaseCrud(Address);

// 2. Plug it into BaseController
export const AddressController = new BaseController(AddressCrud, "Address");
