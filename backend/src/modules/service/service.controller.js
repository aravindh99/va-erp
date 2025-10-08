import Service from "./service.model.js";
import Vehicle from "../vehicle/vehicle.model.js";
import Compressor from "../compressor/compressor.model.js";
import ItemInstance from "../itemInstance/itemInstance.model.js";
import Item from "../item/item.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const ServiceCrud = new BaseCrud(Service);

// 2. Extend controller to allow filtered history queries
class ServiceCustomController extends BaseController {
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, vehicleId, compressorId, itemInstanceId, serviceType } = req.query;
      const where = {};
      if (vehicleId) where.vehicleId = vehicleId;
      if (compressorId) where.compressorId = compressorId;
      if (itemInstanceId) where.itemInstanceId = itemInstanceId;
      if (serviceType) where.serviceType = serviceType;

      // Simplified query for debugging
      const items = await this.service.getAll(page, limit, {
        where,
        // Temporarily remove complex includes to test basic functionality
      });
      return res.json({ success: true, ...items });
    } catch (error) {
      console.error("Service getAll error:", error);
      next(error);
    }
  };

  // Get service history with detailed information
  getServiceHistory = async (req, res, next) => {
    try {
      const { page = 1, limit = 50, serviceType, startDate, endDate } = req.query;
      const where = {};
      
      if (serviceType) where.serviceType = serviceType;
      if (startDate && endDate) {
        where.serviceDate = {
          [require('sequelize').Op.between]: [startDate, endDate]
        };
      }

      const { count, rows } = await Service.findAndCountAll({
        where,
        include: [
          {
            model: Vehicle,
            as: "vehicle",
            attributes: ["id", "vehicleNumber", "vehicleType", "vehicleRPM"],
            required: false
          },
          {
            model: Compressor,
            as: "compressor", 
            attributes: ["id", "compressorName", "compressorType", "compressorRPM"],
            required: false
          },
          {
            model: ItemInstance,
            as: "itemInstance",
            attributes: ["id", "instanceNumber", "currentRPM", "nextServiceRPM"],
            include: [
              {
                model: Item,
                as: "item",
                attributes: ["id", "itemName", "partNumber"]
              },
              {
                model: Vehicle,
                as: "fittedToVehicle",
                attributes: ["id", "vehicleNumber", "vehicleType"],
                required: false
              }
            ],
            required: false
          }
        ],
        order: [["serviceDate", "DESC"], ["createdAt", "DESC"]],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      // Transform the data for better frontend display
      const transformedRows = rows.map(service => {
        let itemDetails = null;
        let serviceName = "";
        let currentRPM = 0;

        if (service.serviceType === "vehicle" && service.vehicle) {
          serviceName = `${service.vehicle.vehicleNumber} (${service.vehicle.vehicleType})`;
          currentRPM = service.vehicle.vehicleRPM || 0;
        } else if (service.serviceType === "compressor" && service.compressor) {
          serviceName = `${service.compressor.compressorName} (${service.compressor.compressorType})`;
          currentRPM = service.compressor.compressorRPM || 0;
        } else if (service.serviceType === "item" && service.itemInstance) {
          serviceName = `${service.itemInstance.item.itemName} (${service.itemInstance.instanceNumber})`;
          currentRPM = service.itemInstance.currentRPM || 0;
          itemDetails = {
            itemName: service.itemInstance.item.itemName,
            partNumber: service.itemInstance.item.partNumber,
            instanceNumber: service.itemInstance.instanceNumber,
            fittedToVehicle: service.itemInstance.fittedToVehicle?.vehicleNumber || "Not fitted"
          };
        }

        return {
          id: service.id,
          serviceType: service.serviceType,
          serviceName,
          serviceRPM: service.serviceRPM,
          currentRPM,
          serviceDate: service.serviceDate,
          itemDetails,
          createdAt: service.createdAt,
          createdBy: service.createdBy
        };
      });

      return res.json({
        success: true,
        data: transformedRows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    } catch (error) {
      console.error("Service history error:", error);
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const service = await Service.findByPk(req.params.id, {
        include: [
          { model: Vehicle, as: "vehicle", attributes: ["id", "vehicleNumber", "vehicleType"] },
          { model: Compressor, as: "compressor", attributes: ["id", "compressorName", "compressorType"] },
          { 
            model: ItemInstance, 
            as: "itemInstance", 
            attributes: ["id", "instanceNumber", "currentRPM"],
            include: [
              { model: Item, as: "item", attributes: ["id", "itemName", "partNumber"] }
            ]
          }
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
