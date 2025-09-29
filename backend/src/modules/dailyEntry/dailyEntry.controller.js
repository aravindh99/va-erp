import DailyEntry from "./dailyEntry.model.js";
import Vehicle from "../vehicle/vehicle.model.js";
import Service from "../service/service.model.js";
import EmployeeList from "../employee/employeeList.model.js";
import Item from "../item/item.model.js";
import ItemFitting from "../itemFitting/itemFitting.model.js";
import ItemInstance from "../itemInstance/itemInstance.model.js";
import StockTransaction from "../stockTransaction/stockTransaction.model.js";
import ItemService from "../itemService/itemService.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";
import DailyEntryEmployee from "./dailyEntryEmployee.model.js";
import { Op } from "sequelize";

// 1. Create CRUD service from model
const DailyEntryCrud = new BaseCrud(DailyEntry);

// 2. Plug it into BaseController
class DailyEntryCustomController extends BaseController {
  constructor() {
    super(DailyEntryCrud, "DailyEntry");
  }
  // Auto-generate reference number with VA- prefix
  generateRefNo = async () => {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const count = await DailyEntry.count({
      where: {
        refNo: {
          [Op.like]: `VA-%-${currentYear}`
        },
        deletedAt: null
      }
    });
    return `VA-${String(count + 1).padStart(3, '0')}-${currentYear}`;
  };

  // Endpoint: generate and return next ref no
  generateRef = async (req, res, next) => {
    try {
      const refNo = await this.generateRefNo();
      return res.json({ success: true, refNo });
    } catch (error) {
      next(error);
    }
  };

  create = async (req, res, next) => {
    const transaction = await DailyEntry.sequelize.transaction();
    try {
      const { 
        vehicleId, 
        vehicleOpeningRPM, 
        vehicleClosingRPM,
        compressorId, 
        compressorOpeningRPM, 
        compressorClosingRPM, 
        vehicleServiceDone, 
        compressorServiceDone, 
        employeeId, 
        employeeIds = [],
        fittedItems = [],
        removedItems = []
      } = req.body;

      // Auto-generate reference number if not provided
      const refNo = req.body.refNo || await this.generateRefNo();

      // Create entry first
      const entryPayload = { 
        ...req.body, 
        refNo,
        createdBy: req.user.username 
      };
      const entry = await DailyEntry.create(entryPayload, { transaction });

      // Attach additional employees (many-to-many)
      const additionalIds = Array.isArray(req.body.additionalEmployeeIds) ? req.body.additionalEmployeeIds : [];
      const effectiveEmployeeIds = (employeeIds && Array.isArray(employeeIds) ? employeeIds : additionalIds);
      if (effectiveEmployeeIds && effectiveEmployeeIds.length) {
        const allEmployeeIds = [...new Set([employeeId, ...employeeIds])];
        const rows = allEmployeeIds.map((eid) => ({ dailyEntryId: entry.id, employeeId: eid }));
        await DailyEntryEmployee.bulkCreate(rows, { transaction });
      } else {
        await DailyEntryEmployee.create({ dailyEntryId: entry.id, employeeId }, { transaction });
      }

      // Handle item fitting - update ItemInstance
      if (fittedItems && fittedItems.length > 0) {
        for (const item of fittedItems) {
          // Find the ItemInstance
          const itemInstance = await ItemInstance.findByPk(item.itemInstanceId, { transaction });
          if (itemInstance && itemInstance.status === 'in_stock') {
            // Update ItemInstance to fitted status
            await itemInstance.update({
              status: 'fitted',
              fittedToVehicleId: vehicleId,
              fittedDate: entry.date,
              updatedBy: req.user?.username || "system"
            }, { transaction });

            // Update meter and RPM from daily entry
            const meterIncrement = item.meterIncrement || 0;
            const rpmIncrement = item.rpmIncrement || 0;
            
            await itemInstance.update({
              currentMeter: (itemInstance.currentMeter || 0) + meterIncrement,
              currentRPM: (itemInstance.currentRPM || 0) + rpmIncrement,
              updatedBy: req.user?.username || "system"
            }, { transaction });

            // Create outward stock transaction
            await StockTransaction.create({
              itemId: itemInstance.itemId,
              type: 'OUT',
              quantity: 1,
              rate: 0,
              reference: 'DAILY_ENTRY_FITTING',
              referenceId: entry.id,
              createdBy: req.user?.username || "system"
            }, { transaction });
          }
        }
      }

      // Handle item removal - update ItemInstance
      if (removedItems && removedItems.length > 0) {
        for (const item of removedItems) {
          // Find the ItemInstance
          const itemInstance = await ItemInstance.findByPk(item.itemInstanceId, { transaction });
          if (itemInstance && itemInstance.status === 'fitted' && itemInstance.fittedToVehicleId === vehicleId) {
            // Update ItemInstance to in_stock status
            await itemInstance.update({
              status: 'in_stock',
              fittedToVehicleId: null,
              fittedDate: null,
              removedDate: entry.date,
              updatedBy: req.user?.username || "system"
            }, { transaction });

            // Create inward stock transaction for removed items
            await StockTransaction.create({
              itemId: itemInstance.itemId,
              type: 'IN',
              quantity: 1,
              rate: 0,
              reference: 'DAILY_ENTRY_REMOVAL',
              referenceId: entry.id,
              createdBy: req.user?.username || "system"
            }, { transaction });
          }
        }
      }

      // Update vehicle RPM totals
      const vehicle = await Vehicle.findByPk(vehicleId, { transaction });
      if (vehicle) {
        const vehicleRPMDiff = (vehicleClosingRPM || 0) - (vehicleOpeningRPM || 0);
        const compressorRPMDiff = (compressorClosingRPM || 0) - (compressorOpeningRPM || 0);
        
        const updatedVehicleRPM = (vehicle.vehicleRPM || 0) + Math.max(0, vehicleRPMDiff);
        const updatedCompressorRPM = (vehicle.compressorRPM || 0) + Math.max(0, compressorRPMDiff);
        
        await vehicle.update({ 
          vehicleRPM: updatedVehicleRPM, 
          compressorRPM: updatedCompressorRPM 
        }, { transaction });

        // Create service records if needed
        const serviceCreates = [];
        if (vehicleServiceDone) {
          serviceCreates.push(
            Service.create({
              serviceRPM: updatedVehicleRPM,
              serviceType: "vehicle",
              vehicleId: vehicle.id,
              compressorId: vehicle.compressorId,
              createdBy: req.user.username,
            }, { transaction })
          );
        }
        if (compressorServiceDone && compressorId) {
          serviceCreates.push(
            Service.create({
              serviceRPM: updatedCompressorRPM,
              serviceType: "compressor",
              vehicleId: vehicle.id,
              compressorId,
              createdBy: req.user.username,
            }, { transaction })
          );
        }

        // Handle spare parts service tracking
        if (fittedItems && fittedItems.length > 0) {
          for (const item of fittedItems) {
            if (item.serviceDone) {
              await ItemService.create({
                itemId: item.itemId,
                vehicleId: vehicle.id,
                serviceRPM: item.startingRPM || 0,
                serviceDate: entry.date,
                dailyEntryId: entry.id,
                notes: `Service completed for ${item.itemName || 'item'} fitted to ${vehicle.vehicleNumber}`,
                createdBy: req.user.username
              }, { transaction });
            }
          }
        }

        if (removedItems && removedItems.length > 0) {
          for (const item of removedItems) {
            if (item.serviceDone) {
              await ItemService.create({
                itemId: item.itemId,
                vehicleId: vehicle.id,
                serviceRPM: item.closingRPM || 0,
                serviceDate: entry.date,
                dailyEntryId: entry.id,
                notes: `Service completed for ${item.itemName || 'item'} removed from ${vehicle.vehicleNumber}`,
                createdBy: req.user.username
              }, { transaction });
            }
          }
        }
        if (serviceCreates.length) await Promise.all(serviceCreates);
      }

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: `DailyEntry created successfully`,
        data: entry,
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  };

  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, startDate, endDate, date, siteId } = req.query;
      const where = {};
      if (date) {
        where.date = date;
      } else if (startDate && endDate) {
        where.date = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        where.date = { [Op.gte]: startDate };
      } else if (endDate) {
        where.date = { [Op.lte]: endDate };
      }
      if (siteId) {
        where.siteId = siteId;
      }

      const items = await this.service.getAll(page, limit, {
        where,
        include: [
          { model: EmployeeList, as: "primaryEmployee", attributes: ["id", "name", "empId"] },
          { model: EmployeeList, as: "employees", attributes: ["id", "name", "empId"] },
        ],
      });
      return res.json({ success: true, ...items });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const entry = await DailyEntry.findByPk(req.params.id, {
        include: [
          { model: EmployeeList, as: "primaryEmployee", attributes: ["id", "name", "empId"] },
          { model: EmployeeList, as: "employees", attributes: ["id", "name", "empId"] },
        ],
      });
      if (!entry) return res.status(404).json({ success: false, message: "DailyEntry not found" });
      return res.json({ success: true, data: entry });
    } catch (error) {
      next(error);
    }
  };
}

export const DailyEntryController = new DailyEntryCustomController(
  DailyEntryCrud,
  "DailyEntry"
);
