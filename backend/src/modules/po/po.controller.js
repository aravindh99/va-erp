import Po from "./po.model.js";
import POItem from "../poItem/poItem.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";
import sequelize from "../../config/db.js";
import Item from "../item/item.model.js";
import StockTransaction from "../stockTransaction/stockTransaction.model.js";
import { Op } from "sequelize";

// 1. Create CRUD service from model
const PoCrud = new BaseCrud(Po);

// 2. Custom create to handle items and totals
class PoCustomController extends BaseController {
  // Auto-generate PO number with VA/YY-YY/XXX format
  generatePONumber = async () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const yearFormat = `${currentYear.toString().slice(-2)}-${nextYear.toString().slice(-2)}`;
    
    // Find the highest PO number for this year format
    const lastPO = await Po.findOne({
      where: {
        orderNumber: {
          [Op.like]: `VA/${yearFormat}/%`
        },
        deletedAt: null
      },
      order: [['orderNumber', 'DESC']]
    });

    let nextNumber = 1;
    if (lastPO) {
      // Extract the number from the last PO (e.g., "VA/25-26/003" -> 3)
      const match = lastPO.orderNumber.match(/VA\/\d{2}-\d{2}\/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `VA/${yearFormat}/${String(nextNumber).padStart(3, '0')}`;
  };

  // API endpoint to generate PO number for display
  generatePONumberAPI = async (req, res, next) => {
    try {
      const refNo = await this.generatePONumber();
      return res.json({ success: true, refNo });
    } catch (error) {
      next(error);
    }
  };
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const items = await this.service.getAll(page, limit, {
        include: [
          { model: POItem, as: "poItems", include: [{ model: Item, as: "item" }] },
        ],
      });
      return res.json({ success: true, ...items });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const po = await Po.findByPk(req.params.id, {
        include: [
          { model: POItem, as: "poItems", include: [{ model: Item, as: "item" }] },
        ],
      });
      if (!po) return res.status(404).json({ success: false, message: "Po not found" });
      return res.json({ success: true, data: po });
    } catch (error) {
      next(error);
    }
  };
  create = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { items = [], gstInclude, gstPercent = 0 } = req.body;
      const createdBy = req.user.username;
      
      // Auto-generate PO number
      const orderNumber = await this.generatePONumber();

      // Calculate pricing based on GST inclusion
      const itemTotals = items.map((i) => {
        const totalAmount = i.quantity * i.rate;
        
        if (gstInclude && gstPercent > 0) {
          // GST-inclusive pricing: rate includes GST
          const gstAmount = (totalAmount * gstPercent) / (100 + gstPercent);
          const baseAmount = totalAmount - gstAmount;
          
          return { 
            ...i, 
            total: totalAmount,
            baseAmount: baseAmount,
            gstAmount: gstAmount
          };
        } else {
          // No GST: rate is the base amount
          return { 
            ...i, 
            total: totalAmount,
            baseAmount: totalAmount,
            gstAmount: 0
          };
        }
      });
      
      const subTotal = itemTotals.reduce((s, i) => s + i.baseAmount, 0);
      const taxTotal = itemTotals.reduce((s, i) => s + i.gstAmount, 0);
      const grandTotal = subTotal + taxTotal;

      const po = await Po.create({ ...req.body, orderNumber, subTotal, taxTotal, grandTotal, createdBy }, { transaction: t });
      const rows = itemTotals.map((i) => ({ 
        ...i, 
        poId: po.id, 
        createdBy,
        // Store the base rate (without GST) for reference
        baseRate: i.baseAmount / i.quantity
      }));
      await POItem.bulkCreate(rows, { transaction: t });

      // Don't create stock transactions on PO creation - only when marked as received

      await t.commit();
      return res.status(201).json({ success: true, message: "Po created successfully", data: { ...po.toJSON(), items: rows } });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  };

  // Mark PO as received and update stock
  markAsReceived = async (req, res, next) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const updatedBy = req.user.username;

      // Get PO with items
      const po = await Po.findByPk(id, {
        include: [{ model: POItem, as: "poItems", include: [{ model: Item, as: "item" }] }],
        transaction: t
      });

      if (!po) {
        return res.status(404).json({ success: false, message: "PO not found" });
      }

      // Update stock for each item
      for (const poItem of po.poItems) {
        const item = poItem.item;
        const newStock = (item.openingStock || 0) + poItem.quantity;
        
        await item.update({
          openingStock: newStock,
          updatedBy
        }, { transaction: t });

        // Create stock transaction for received items
        await StockTransaction.create({
          itemId: item.id,
          type: "IN",
          quantity: poItem.quantity,
          rate: poItem.rate,
          reference: "PO_RECEIVED",
          referenceId: po.id,
          createdBy: updatedBy
        }, { transaction: t });
      }

      // Mark PO as received
      await po.update({
        status: "received",
        receivedBy: updatedBy,
        receivedAt: new Date(),
        updatedBy
      }, { transaction: t });

      await t.commit();
      return res.json({ 
        success: true, 
        message: "PO marked as received and stock updated successfully",
        data: po 
      });
    } catch (error) {
      await t.rollback();
      next(error);
    }
  };
}

export const PoController = new PoCustomController(PoCrud, "Po");
