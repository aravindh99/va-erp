import Item from "./item.model.js";
import ItemInstance from "../itemInstance/itemInstance.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";
import { Op } from "sequelize";

// 1. Create CRUD service from model
const ItemCrud = new BaseCrud(Item);

// 2. Custom controller with stock calculations
class ItemCustomController extends BaseController {
  constructor(crud, modelName) {
    super(crud, modelName);
  }

  // Override getAll to include simple stock and instances
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search, groupName } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (search) {
        where[Op.or] = [
          { itemName: { [Op.iLike]: `%${search}%` } },
          { partNumber: { [Op.iLike]: `%${search}%` } },
          { groupName: { [Op.iLike]: `%${search}%` } },
        ];
      }
      if (groupName) {
        where.groupName = groupName;
      }

      const { count, rows: items } = await Item.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
      });

      // For each item, get instances if canBeFitted
      const itemsWithInstances = await Promise.all(items.map(async (item) => {
        let instances = [];
        if (item.canBeFitted) {
          instances = await ItemInstance.findAll({
            where: { 
              itemId: item.id, 
              status: { [Op.in]: ['in_stock', 'fitted'] }
            }
          });
        }
        
        return {
          ...item.toJSON(),
          instances
        };
      }));

      return res.json({
        success: true,
        data: itemsWithInstances,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const ItemController = new ItemCustomController(ItemCrud, "Item");
