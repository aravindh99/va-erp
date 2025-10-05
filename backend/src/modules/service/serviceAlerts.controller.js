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

      // Get all active vehicles
      const vehicles = await Vehicle.findAll({
        where: {
          status: "active",
          deletedAt: null
        },
        attributes: ["id", "vehicleNumber", "vehicleType", "vehicleRPM", "nextServiceRPM"]
      });

      for (const vehicle of vehicles) {
        const currentRPM = vehicle.vehicleRPM || 0;
        const nextServiceRPM = vehicle.nextServiceRPM;
        
        if (nextServiceRPM && nextServiceRPM > 0) {
          const remaining = nextServiceRPM - currentRPM;
          const overdue = currentRPM - nextServiceRPM;
          
          let priority, message, isAlert;
          
          if (overdue > 100) {
            priority = "high";
            message = `Machine ${vehicle.vehicleNumber} service OVERDUE by ${overdue} RPM`;
            isAlert = true;
          } else if (overdue > 50) {
            priority = "medium";
            message = `Machine ${vehicle.vehicleNumber} service OVERDUE by ${overdue} RPM`;
            isAlert = true;
          } else if (remaining <= 50) {
            priority = "low";
            message = `Machine ${vehicle.vehicleNumber} service due soon (${remaining} RPM)`;
            isAlert = true;
          } else {
            priority = "good";
            message = `Machine ${vehicle.vehicleNumber} - Service in ${remaining} RPM`;
            isAlert = false;
          }
          
          alerts.push({
            type: "vehicle",
            id: vehicle.id,
            name: `${vehicle.vehicleNumber} (${vehicle.vehicleType})`,
            currentRPM,
            nextServiceRPM,
            overdue: Math.max(0, overdue),
            remaining: Math.max(0, remaining),
            priority,
            message,
            isAlert
          });
        } else {
          // No service schedule set
          alerts.push({
            type: "vehicle",
            id: vehicle.id,
            name: `${vehicle.vehicleNumber} (${vehicle.vehicleType})`,
            currentRPM,
            nextServiceRPM: 0,
            overdue: 0,
            remaining: 0,
            priority: "info",
            message: `Machine ${vehicle.vehicleNumber} - No service schedule set`,
            isAlert: false
          });
        }
      }

      // Get all active compressors
      const compressors = await Compressor.findAll({
        where: {
          status: "active",
          deletedAt: null
        },
        attributes: ["id", "compressorName", "compressorType", "compressorRPM", "nextServiceRPM"]
      });

      for (const compressor of compressors) {
        const currentRPM = compressor.compressorRPM || 0;
        const nextServiceRPM = compressor.nextServiceRPM;
        
        if (nextServiceRPM && nextServiceRPM > 0) {
          const remaining = nextServiceRPM - currentRPM;
          const overdue = currentRPM - nextServiceRPM;
          
          let priority, message, isAlert;
          
          if (overdue > 100) {
            priority = "high";
            message = `Compressor ${compressor.compressorName} service OVERDUE by ${overdue} RPM`;
            isAlert = true;
          } else if (overdue > 50) {
            priority = "medium";
            message = `Compressor ${compressor.compressorName} service OVERDUE by ${overdue} RPM`;
            isAlert = true;
          } else if (remaining <= 50) {
            priority = "low";
            message = `Compressor ${compressor.compressorName} service due soon (${remaining} RPM)`;
            isAlert = true;
          } else {
            priority = "good";
            message = `Compressor ${compressor.compressorName} - Service in ${remaining} RPM`;
            isAlert = false;
          }
          
          alerts.push({
            type: "compressor",
            id: compressor.id,
            name: `${compressor.compressorName} (${compressor.compressorType})`,
            currentRPM,
            nextServiceRPM,
            overdue: Math.max(0, overdue),
            remaining: Math.max(0, remaining),
            priority,
            message,
            isAlert
          });
        } else {
          // No service schedule set
          alerts.push({
            type: "compressor",
            id: compressor.id,
            name: `${compressor.compressorName} (${compressor.compressorType})`,
            currentRPM,
            nextServiceRPM: 0,
            overdue: 0,
            remaining: 0,
            priority: "info",
            message: `Compressor ${compressor.compressorName} - No service schedule set`,
            isAlert: false
          });
        }
      }

      // Get all item instances (fitted and in_stock)
      const itemInstances = await ItemInstance.findAll({
        where: {
          [Op.or]: [
            { status: "fitted" },
            { status: "in_stock" }
          ],
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
        attributes: ["id", "instanceNumber", "currentRPM", "nextServiceRPM", "fittedToVehicleId", "status"]
      });

      for (const instance of itemInstances) {
        const currentRPM = instance.currentRPM || 0;
        const nextServiceRPM = instance.nextServiceRPM;
        
        if (nextServiceRPM && nextServiceRPM > 0) {
          const remaining = nextServiceRPM - currentRPM;
          const overdue = currentRPM - nextServiceRPM;
          
          let priority, message, isAlert;
          
          if (overdue > 100) {
            priority = "high";
            message = `Item ${instance.item?.itemName} service OVERDUE by ${overdue} RPM`;
            isAlert = true;
          } else if (overdue > 50) {
            priority = "medium";
            message = `Item ${instance.item?.itemName} service OVERDUE by ${overdue} RPM`;
            isAlert = true;
          } else if (remaining <= 50) {
            priority = "low";
            message = `Item ${instance.item?.itemName} service due soon (${remaining} RPM)`;
            isAlert = true;
          } else {
            priority = "good";
            message = `Item ${instance.item?.itemName} - Service in ${remaining} RPM`;
            isAlert = false;
          }
          
          alerts.push({
            type: "item",
            id: instance.id,
            itemId: instance.item?.id,
            name: `${instance.item?.itemName} (${instance.instanceNumber})`,
            vehicleName: instance.fittedToVehicle?.vehicleNumber || "Not fitted",
            currentRPM,
            nextServiceRPM,
            overdue: Math.max(0, overdue),
            remaining: Math.max(0, remaining),
            priority,
            message,
            isAlert
          });
        } else {
          // No service schedule set
          alerts.push({
            type: "item",
            id: instance.id,
            itemId: instance.item?.id,
            name: `${instance.item?.itemName} (${instance.instanceNumber})`,
            vehicleName: instance.fittedToVehicle?.vehicleNumber || "Not fitted",
            currentRPM,
            nextServiceRPM: 0,
            overdue: 0,
            remaining: 0,
            priority: "info",
            message: `Item ${instance.item?.itemName} - No service schedule set`,
            isAlert: false
          });
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

  // Get only urgent service alerts for notifications (RPM difference < 50)
  getUrgentAlerts = async (req, res, next) => {
    try {
      const alerts = [];

      // Get vehicles that need urgent service
      const vehicles = await Vehicle.findAll({
        where: {
          status: "active",
          deletedAt: null
        },
        attributes: ["id", "vehicleNumber", "vehicleType", "vehicleRPM", "nextServiceRPM"]
      });

      for (const vehicle of vehicles) {
        const currentRPM = vehicle.vehicleRPM || 0;
        const nextServiceRPM = vehicle.nextServiceRPM;
        
        if (nextServiceRPM && nextServiceRPM > 0) {
          const remaining = nextServiceRPM - currentRPM;
          const overdue = currentRPM - nextServiceRPM;
          
          // Only include if service is due, overdue, or within 50 RPM
          if (overdue > 0 || remaining <= 50) {
            let priority;
            if (overdue > 100) {
              priority = "high";
            } else if (overdue > 50) {
              priority = "medium";
            } else {
              priority = "low";
            }
            
            alerts.push({
              type: "vehicle",
              id: vehicle.id,
              name: `${vehicle.vehicleNumber} (${vehicle.vehicleType})`,
              currentRPM,
              nextServiceRPM,
              overdue: Math.max(0, overdue),
              remaining: Math.max(0, remaining),
              priority,
              message: `Machine ${vehicle.vehicleNumber} service ${overdue > 0 ? 'OVERDUE' : 'DUE NOW'}`,
            });
          }
        }
      }

      // Get compressors that need urgent service
      const compressors = await Compressor.findAll({
        where: {
          status: "active",
          deletedAt: null
        },
        attributes: ["id", "compressorName", "compressorType", "compressorRPM", "nextServiceRPM"]
      });

      for (const compressor of compressors) {
        const currentRPM = compressor.compressorRPM || 0;
        const nextServiceRPM = compressor.nextServiceRPM;
        
        if (nextServiceRPM && nextServiceRPM > 0) {
          const remaining = nextServiceRPM - currentRPM;
          const overdue = currentRPM - nextServiceRPM;
          
          // Only include if service is due, overdue, or within 50 RPM
          if (overdue > 0 || remaining <= 50) {
            let priority;
            if (overdue > 100) {
              priority = "high";
            } else if (overdue > 50) {
              priority = "medium";
            } else {
              priority = "low";
            }
            
            alerts.push({
              type: "compressor",
              id: compressor.id,
              name: `${compressor.compressorName} (${compressor.compressorType})`,
              currentRPM,
              nextServiceRPM,
              overdue: Math.max(0, overdue),
              remaining: Math.max(0, remaining),
              priority,
              message: `Compressor ${compressor.compressorName} service ${overdue > 0 ? 'OVERDUE' : 'DUE NOW'}`,
            });
          }
        }
      }

      // Get item instances that need urgent service
      const itemInstances = await ItemInstance.findAll({
        where: {
          [Op.or]: [
            { status: "fitted" },
            { status: "in_stock" }
          ],
          nextServiceRPM: { [Op.ne]: null },
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
        attributes: ["id", "instanceNumber", "currentRPM", "nextServiceRPM", "fittedToVehicleId", "status"]
      });

      for (const instance of itemInstances) {
        const currentRPM = instance.currentRPM || 0;
        const nextServiceRPM = instance.nextServiceRPM;
        
        if (nextServiceRPM && nextServiceRPM > 0) {
          const remaining = nextServiceRPM - currentRPM;
          const overdue = currentRPM - nextServiceRPM;
          
          // Only include if service is due, overdue, or within 50 RPM
          if (overdue > 0 || remaining <= 50) {
            let priority;
            if (overdue > 100) {
              priority = "high";
            } else if (overdue > 50) {
              priority = "medium";
            } else {
              priority = "low";
            }
            
            alerts.push({
              type: "item",
              id: instance.id,
              itemId: instance.item?.id,
              name: `${instance.item?.itemName} (${instance.instanceNumber})`,
              vehicleName: instance.fittedToVehicle?.vehicleNumber || "Not fitted",
              currentRPM,
              nextServiceRPM,
              overdue: Math.max(0, overdue),
              remaining: Math.max(0, remaining),
              priority,
              message: `Item ${instance.item?.itemName} service ${overdue > 0 ? 'OVERDUE' : 'DUE NOW'}`,
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
          overdue: alerts.filter(a => a.overdue > 0).length,
          dueSoon: alerts.filter(a => a.remaining && a.remaining <= 50).length,
        }
      });
    } catch (error) {
      console.error("Urgent alerts error:", error);
      next(error);
    }
  };
}

export default new ServiceAlertsController();