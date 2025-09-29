import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const StockTransaction = sequelize.define(
  "StockTransaction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "item", key: "id" },
    },
    type: {
      type: DataTypes.ENUM("IN", "OUT"),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    ...commonFields,
  },
  { tableName: "stockTransaction", timestamps: true, paranoid: true }
);

export default StockTransaction;

