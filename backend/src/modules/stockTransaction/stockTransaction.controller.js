import StockTransaction from "./stockTransaction.model.js";
import Item from "../item/item.model.js";
import ItemInstance from "../itemInstance/itemInstance.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// Create CRUD service from model
const StockTransactionCrud = new BaseCrud(StockTransaction);

class StockTransactionCustomController extends BaseController {
  constructor(crud, modelName) {
    super(crud, modelName);
  }

  // Add manual stock entry
  addStock = async (req, res, next) => {
    try {
      const { itemId, quantity, nextServiceRPM, notes } = req.body;

      // 1. Validate item exists
      const item = await Item.findByPk(itemId);
      if (!item) {
        return res.status(404).json({ 
          success: false, 
          message: "Item not found" 
        });
      }

      // 2. Simply increment stock
      await item.update({
        stock: (item.stock || 0) + quantity
      });

      const instances = [];

      // 3. If item.canBeFitted, create ItemInstances for RPM tracking
      if (item.canBeFitted) {
        for (let i = 0; i < quantity; i++) {
          // Get next sequence number for this item
          const existingInstances = await ItemInstance.count({
            where: { itemId }
          });
          const seq = String(existingInstances + i + 1).padStart(3, '0');
          
          const instance = await ItemInstance.create({
            itemId,
            instanceNumber: `${item.itemName}-${item.partNumber}-${seq}`,
            status: "in_stock",
            currentRPM: 0,
            nextServiceRPM: nextServiceRPM || null,
            notes: notes || `Instance created from manual stock entry`
          });
          
          instances.push(instance);
        }
      }

      return res.json({
        success: true,
        message: `${quantity} ${item.itemName} added to stock${instances.length > 0 ? ` (${instances.length} instances created)` : ''}`,
        data: {
          item,
          instances
        }
      });
    } catch (error) {
      console.error("Error adding stock:", error);
      next(error);
    }
  };
}

export const StockTransactionController = new StockTransactionCustomController(
  StockTransactionCrud,
  "StockTransaction"
);


