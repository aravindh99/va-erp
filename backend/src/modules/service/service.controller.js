import Service from "./service.model.js";
import Vehicle from "../vehicle/vehicle.model.js";
import Compressor from "../compressor/compressor.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const ServiceCrud = new BaseCrud(Service);

// 2. Extend controller to allow filtered history queries
class ServiceCustomController extends BaseController {
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, vehicleId, compressorId, serviceType } = req.query;
      const where = {};
      if (vehicleId) where.vehicleId = vehicleId;
      if (compressorId) where.compressorId = compressorId;
      if (serviceType) where.serviceType = serviceType;

      const items = await this.service.getAll(page, limit, {
        where,
        include: [
          { model: Vehicle, as: "vehicle", attributes: ["id", "vehicleNumber", "vehicleType"] },
          { model: Compressor, as: "compressor", attributes: ["id", "compressorName", "compressorType"] }
        ]
      });
      return res.json({ success: true, ...items });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const service = await Service.findByPk(req.params.id, {
        include: [
          { model: Vehicle, as: "vehicle", attributes: ["id", "vehicleNumber", "vehicleType"] },
          { model: Compressor, as: "compressor", attributes: ["id", "compressorName", "compressorType"] }
        ]
      });
      if (!service) return res.status(404).json({ success: false, message: "Service not found" });
      return res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  };
}

export const ServiceController = new ServiceCustomController(ServiceCrud, "Service");
