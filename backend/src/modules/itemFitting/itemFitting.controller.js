import ItemFitting from "./itemFitting.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const ItemFittingCrud = new BaseCrud(ItemFitting);

// 2. Create custom controller with filtering
export class ItemFittingController extends BaseController {
  constructor() {
    super(ItemFittingCrud, "Item Fitting");
  }

  // Override getAll to handle filtering
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, vehicleId, status, itemId } = req.query;
      
      // Build where clause for filtering
      const whereClause = {};
      
      if (vehicleId) {
        whereClause.vehicleId = vehicleId;
      }
      
      if (status) {
        whereClause.status = status;
      }
      
      if (itemId) {
        whereClause.itemId = itemId;
      }
      
      const items = await this.service.getAll(page, limit, {
        where: whereClause,
        include: [
          {
            association: 'item',
            attributes: ['id', 'itemName', 'partNumber', 'totalRPMUsed']
          },
          {
            association: 'vehicle',
            attributes: ['id', 'vehicleNumber', 'vehicleType']
          },
          {
            association: 'fittingDailyEntry',
            attributes: ['id', 'refNo', 'date']
          },
          {
            association: 'removalDailyEntry',
            attributes: ['id', 'refNo', 'date']
          }
        ]
      });
      
      return res.json({ success: true, ...items });
    } catch (error) {
      next(error);
    }
  };
}

export const itemFittingController = new ItemFittingController();
