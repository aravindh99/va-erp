import Vehicle from "../vehicle/vehicle.model.js";
import Compressor from "../compressor/compressor.model.js";
import ItemInstance from "../itemInstance/itemInstance.model.js";
import Item from "../item/item.model.js";
import { Op } from "sequelize";

class ServiceAlertsController {
  // Get all service alerts for vehicles, compressors, and item instances
  getAllServiceAlerts = async (req, res, next) => {
    try {
      const alerts = [];

      // Get vehicles that need service
      const vehicles = await Vehicle.findAll({
        where: {
          status: "active",
          deletedAt: null,
          vehicleServiceSchedule: { [Op.ne]: null }
        },
        attributes: ["id", "vehicleNumber", "vehicleType", "vehicleRPM", "vehicleServiceSchedule"]
      });

      for (const vehicle of vehicles) {
        if (vehicle.vehicleServiceSchedule && vehicle.vehicleServiceSchedule.length > 0) {
          // Find the next service due
          const sortedSchedules = [...vehicle.vehicleServiceSchedule].sort((a, b) => a - b);
          const currentRPM = vehicle.vehicleRPM || 0;
          const nextServiceRPM = sortedSchedules.find(rpm => rpm > currentRPM) || sortedSchedules[sortedSchedules.length - 1];
          
          // Only alert if service is due or overdue
          if (currentRPM >= nextServiceRPM) {
            const overdue = currentRPM - nextServiceRPM;
            alerts.push({
              type: "vehicle",
              id: vehicle.id,
              name: `${vehicle.vehicleNumber} (${vehicle.vehicleType})`,
              currentRPM,
              nextServiceRPM,
              overdue,
              priority: overdue > 1000 ? "high" : overdue > 500 ? "medium" : "low",
              message: `Machine ${vehicle.vehicleNumber} service ${overdue > 0 ? 'OVERDUE' : 'DUE NOW'}`,
            });
          } else if (nextServiceRPM - currentRPM <= 100) {
            // Warning for upcoming service
            alerts.push({
              type: "vehicle",
              id: vehicle.id,
              name: `${vehicle.vehicleNumber} (${vehicle.vehicleType})`,
              currentRPM,
              nextServiceRPM,
              overdue: 0,
              remaining: nextServiceRPM - currentRPM,
              priority: "low",
              message: `Machine ${vehicle.vehicleNumber} service due soon (${nextServiceRPM - currentRPM} RPM)`,
            });
          }
        }
      }

      // Get vehicles with compressors that need service
      const vehiclesWithCompressors = await Vehicle.findAll({
        where: {
          status: "active",
          deletedAt: null,
          compressorId: { [Op.ne]: null },
          compressorServiceSchedule: { [Op.ne]: null }
        },
        include: [
          {
            model: Compressor,
            as: "compressor",
            attributes: ["id", "compressorName"]
          }
        ],
        attributes: ["id", "vehicleNumber", "compressorRPM", "compressorServiceSchedule"]
      });

      for (const vehicle of vehiclesWithCompressors) {
        if (vehicle.compressorServiceSchedule && vehicle.compressorServiceSchedule.length > 0) {
          const sortedSchedules = [...vehicle.compressorServiceSchedule].sort((a, b) => a - b);
          const currentRPM = vehicle.compressorRPM || 0;
          const nextServiceRPM = sortedSchedules.find(rpm => rpm > currentRPM) || sortedSchedules[sortedSchedules.length - 1];
          
          if (currentRPM >= nextServiceRPM) {
            const overdue = currentRPM - nextServiceRPM;
            alerts.push({
              type: "compressor",
              id: vehicle.compressor.id,
              vehicleId: vehicle.id,
              name: `${vehicle.vehicleNumber} - ${vehicle.compressor.compressorName}`,
              currentRPM,
              nextServiceRPM,
              overdue,
              priority: overdue > 1000 ? "high" : overdue > 500 ? "medium" : "low",
              message: `Compressor ${vehicle.compressor.compressorName} service ${overdue > 0 ? 'OVERDUE' : 'DUE NOW'}`,
            });
          } else if (nextServiceRPM - currentRPM <= 100) {
            alerts.push({
              type: "compressor",
              id: vehicle.compressor.id,
              vehicleId: vehicle.id,
              name: `${vehicle.vehicleNumber} - ${vehicle.compressor.compressorName}`,
              currentRPM,
              nextServiceRPM,
              overdue: 0,
              remaining: nextServiceRPM - currentRPM,
              priority: "low",
              message: `Compressor service due soon (${nextServiceRPM - currentRPM} RPM)`,
            });
          }
        }
      }

      // Get item instances that need service
      const itemInstances = await ItemInstance.findAll({
        where: {
          status: "fitted",
          serviceSchedule: { [Op.ne]: null },
          deletedAt: null
        },
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "itemName", "partNumber"]
          },
          {
            model: Vehicle,
            as: "fittedToVehicle",
            attributes: ["id", "vehicleNumber", "vehicleType"]
          }
        ],
        attributes: ["id", "instanceNumber", "currentRPM", "serviceSchedule", "fittedToVehicleId"]
      });

      for (const instance of itemInstances) {
        if (instance.serviceSchedule && Array.isArray(instance.serviceSchedule) && instance.serviceSchedule.length > 0) {
          const sortedSchedules = [...instance.serviceSchedule].sort((a, b) => a - b);
          const currentRPM = instance.currentRPM || 0;
          const nextServiceRPM = sortedSchedules.find(rpm => rpm > currentRPM) || sortedSchedules[sortedSchedules.length - 1];
          
          if (currentRPM >= nextServiceRPM) {
            const overdue = currentRPM - nextServiceRPM;
            alerts.push({
              type: "item",
              id: instance.id,
              itemId: instance.item?.id,
              name: `${instance.item?.itemName} (${instance.instanceNumber})`,
              vehicleName: instance.fittedToVehicle?.vehicleNumber || "Unknown",
              currentRPM,
              nextServiceRPM,
              overdue,
              priority: overdue > 500 ? "high" : overdue > 200 ? "medium" : "low",
              message: `Item ${instance.item?.itemName} service ${overdue > 0 ? 'OVERDUE' : 'DUE NOW'}`,
            });
          } else if (nextServiceRPM - currentRPM <= 50) {
            alerts.push({
              type: "item",
              id: instance.id,
              itemId: instance.item?.id,
              name: `${instance.item?.itemName} (${instance.instanceNumber})`,
              vehicleName: instance.fittedToVehicle?.vehicleNumber || "Unknown",
              currentRPM,
              nextServiceRPM,
              overdue: 0,
              remaining: nextServiceRPM - currentRPM,
              priority: "low",
              message: `Item service due soon (${nextServiceRPM - currentRPM} RPM)`,
            });
          }
        }
      }

      // Sort by priority (high > medium > low) and then by overdue amount
      alerts.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return (b.overdue || 0) - (a.overdue || 0);
      });

      return res.json({
        success: true,
        data: alerts,
        count: alerts.length,
        summary: {
          total: alerts.length,
          high: alerts.filter(a => a.priority === "high").length,
          medium: alerts.filter(a => a.priority === "medium").length,
          low: alerts.filter(a => a.priority === "low").length,
          byType: {
            vehicles: alerts.filter(a => a.type === "vehicle").length,
            compressors: alerts.filter(a => a.type === "compressor").length,
            items: alerts.filter(a => a.type === "item").length,
          }
        }
      });
    } catch (error) {
      console.error("Error fetching service alerts:", error);
      next(error);
    }
  };
}

export default new ServiceAlertsController();