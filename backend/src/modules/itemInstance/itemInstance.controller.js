import ItemInstance from "./itemInstance.model.js";
import Item from "../item/item.model.js";
import Vehicle from "../vehicle/vehicle.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";
import { Op } from "sequelize";

// Create CRUD service from model
const ItemInstanceCrud = new BaseCrud(ItemInstance);

class ItemInstanceController extends BaseController {
  constructor() {
    super(ItemInstanceCrud);
  }

  // Override getAll to include related data
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search, status, itemId } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (search) {
        where[Op.or] = [
          { instanceNumber: { [Op.iLike]: `%${search}%` } },
          { notes: { [Op.iLike]: `%${search}%` } },
        ];
      }
      if (status) {
        where.status = status;
      }
      if (itemId) {
        where.itemId = itemId;
      }

      const { count, rows } = await ItemInstance.findAndCountAll({
        where,
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "itemName", "partNumber", "groupName", "units", "canBeFitted"],
          },
          {
            model: Vehicle,
            as: "fittedToVehicle",
            attributes: ["id", "vehicleNumber", "vehicleType"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdAt", "DESC"]],
      });

      return res.json({
        success: true,
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (error) {
      next(error);
    }
  };

  // Create new item instance
  create = async (req, res, next) => {
    try {
      const createdBy = req.user?.username || "system";
      const payload = { ...req.body, createdBy };

      // Generate instance number if not provided
      if (!payload.instanceNumber) {
        const item = await Item.findByPk(payload.itemId);
        if (!item) {
          return res.status(404).json({ success: false, message: "Item not found" });
        }

        // Find the highest instance number for this item
        const lastInstance = await ItemInstance.findOne({
          where: { itemId: payload.itemId },
          order: [["instanceNumber", "DESC"]],
        });

        let nextNumber = 1;
        if (lastInstance) {
          const match = lastInstance.instanceNumber.match(/-(\d+)$/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }

        payload.instanceNumber = `${item.itemName}-${String(nextNumber).padStart(3, '0')}`;
      }

      const itemInstance = await ItemInstance.create(payload);
      
      // Fetch with relations
      const instanceWithRelations = await ItemInstance.findByPk(itemInstance.id, {
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "itemName", "partNumber", "groupName", "units", "canBeFitted"],
          },
          {
            model: Vehicle,
            as: "fittedToVehicle",
            attributes: ["id", "vehicleNumber", "vehicleType"],
          },
        ],
      });

      return res.status(201).json({
        success: true,
        message: "Item instance created successfully",
        data: instanceWithRelations,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update item instance
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const updatedBy = req.user?.username || "system";
      const payload = { ...req.body, updatedBy };

      const itemInstance = await ItemInstance.findByPk(id);
      if (!itemInstance) {
        return res.status(404).json({ success: false, message: "Item instance not found" });
      }

      await itemInstance.update(payload);

      // Fetch with relations
      const instanceWithRelations = await ItemInstance.findByPk(id, {
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "itemName", "partNumber", "groupName", "units", "canBeFitted"],
          },
          {
            model: Vehicle,
            as: "fittedToVehicle",
            attributes: ["id", "vehicleNumber", "vehicleType"],
          },
        ],
      });

      return res.json({
        success: true,
        message: "Item instance updated successfully",
        data: instanceWithRelations,
      });
    } catch (error) {
      next(error);
    }
  };

  // Fit item instance to vehicle
  fitToVehicle = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { vehicleId, fittedDate } = req.body;
      const updatedBy = req.user?.username || "system";

      const itemInstance = await ItemInstance.findByPk(id);
      if (!itemInstance) {
        return res.status(404).json({ success: false, message: "Item instance not found" });
      }

      if (itemInstance.status !== "in_stock") {
        return res.status(400).json({ 
          success: false, 
          message: "Item instance must be in stock to be fitted" 
        });
      }

      await itemInstance.update({
        status: "fitted",
        fittedToVehicleId: vehicleId,
        fittedDate: fittedDate || new Date().toISOString().split('T')[0],
        updatedBy,
      });

      // Fetch with relations
      const instanceWithRelations = await ItemInstance.findByPk(id, {
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "itemName", "partNumber", "groupName", "units", "canBeFitted"],
          },
          {
            model: Vehicle,
            as: "fittedToVehicle",
            attributes: ["id", "vehicleNumber", "vehicleType"],
          },
        ],
      });

      return res.json({
        success: true,
        message: "Item instance fitted to vehicle successfully",
        data: instanceWithRelations,
      });
    } catch (error) {
      next(error);
    }
  };

  // Remove item instance from vehicle
  removeFromVehicle = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { removedDate } = req.body;
      const updatedBy = req.user?.username || "system";

      const itemInstance = await ItemInstance.findByPk(id);
      if (!itemInstance) {
        return res.status(404).json({ success: false, message: "Item instance not found" });
      }

      if (itemInstance.status !== "fitted") {
        return res.status(400).json({ 
          success: false, 
          message: "Item instance must be fitted to be removed" 
        });
      }

      await itemInstance.update({
        status: "in_stock",
        fittedToVehicleId: null,
        fittedDate: null,
        removedDate: removedDate || new Date().toISOString().split('T')[0],
        updatedBy,
      });

      // Fetch with relations
      const instanceWithRelations = await ItemInstance.findByPk(id, {
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "itemName", "partNumber", "groupName", "units", "canBeFitted"],
          },
          {
            model: Vehicle,
            as: "fittedToVehicle",
            attributes: ["id", "vehicleNumber", "vehicleType"],
          },
        ],
      });

      return res.json({
        success: true,
        message: "Item instance removed from vehicle successfully",
        data: instanceWithRelations,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update meter and RPM from daily entry
  updateMeterRPM = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { meterIncrement, rpmIncrement } = req.body;
      const updatedBy = req.user?.username || "system";

      const itemInstance = await ItemInstance.findByPk(id);
      if (!itemInstance) {
        return res.status(404).json({ success: false, message: "Item instance not found" });
      }

      if (itemInstance.status !== "fitted") {
        return res.status(400).json({ 
          success: false, 
          message: "Item instance must be fitted to update meter/RPM" 
        });
      }

      const newMeter = (itemInstance.currentMeter || 0) + (meterIncrement || 0);
      const newRPM = (itemInstance.currentRPM || 0) + (rpmIncrement || 0);

      await itemInstance.update({
        currentMeter: newMeter,
        currentRPM: newRPM,
        updatedBy,
      });

      // Fetch with relations
      const instanceWithRelations = await ItemInstance.findByPk(id, {
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "itemName", "partNumber", "groupName", "units", "canBeFitted"],
          },
          {
            model: Vehicle,
            as: "fittedToVehicle",
            attributes: ["id", "vehicleNumber", "vehicleType"],
          },
        ],
      });

      return res.json({
        success: true,
        message: "Item instance meter/RPM updated successfully",
        data: instanceWithRelations,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get service alerts for item instances
  getServiceAlerts = async (req, res, next) => {
    try {
      const instances = await ItemInstance.findAll({
        where: {
          status: "fitted",
          serviceSchedule: { [Op.ne]: null },
        },
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "itemName", "partNumber"],
          },
          {
            model: Vehicle,
            as: "fittedToVehicle",
            attributes: ["id", "vehicleNumber", "vehicleType"],
          },
        ],
      });

      const alerts = [];
      for (const instance of instances) {
        if (instance.serviceSchedule && Array.isArray(instance.serviceSchedule)) {
          for (const serviceRPM of instance.serviceSchedule) {
            if (instance.currentRPM >= serviceRPM) {
              alerts.push({
                id: instance.id,
                instanceNumber: instance.instanceNumber,
                itemName: instance.item?.itemName,
                vehicleNumber: instance.fittedToVehicle?.vehicleNumber,
                currentRPM: instance.currentRPM,
                serviceRPM,
                status: "due",
              });
            }
          }
        }
      }

      return res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ItemInstanceController();
