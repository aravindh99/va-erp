import ItemService from "./itemService.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

const ItemServiceCrud = new BaseCrud(ItemService);

class ItemServiceCustomController extends BaseController {
  constructor() {
    super(ItemServiceCrud, "ItemService");
  }

  // Get all item services with item and vehicle details
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, itemId, vehicleId } = req.query;
      
      const whereClause = {};
      if (itemId) whereClause.itemId = itemId;
      if (vehicleId) whereClause.vehicleId = vehicleId;

      const services = await this.service.getAll(page, limit, {
        where: whereClause,
        include: [
          { model: require("../item/item.model.js").default, as: "item" },
          { model: require("../vehicle/vehicle.model.js").default, as: "vehicle" },
        ],
      });

      return res.json({ success: true, ...services });
    } catch (error) {
      next(error);
    }
  };

  // Get services for a specific item
  getByItemId = async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const services = await ItemService.findAll({
        where: { itemId },
        include: [
          { model: require("../item/item.model.js").default, as: "item" },
          { model: require("../vehicle/vehicle.model.js").default, as: "vehicle" },
        ],
        order: [['serviceDate', 'DESC']],
      });

      return res.json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  };
}

export const ItemServiceController = new ItemServiceCustomController();
