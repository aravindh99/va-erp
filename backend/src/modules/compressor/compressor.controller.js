import Compressor from "./compressor.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const CompressorCrud = new BaseCrud(Compressor);

// 2. Plug it into BaseController
export const CompressorController = new BaseController(CompressorCrud, "Compressor");
