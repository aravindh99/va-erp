import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const Item = sequelize.define(
  "Item",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    partNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    groupName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    units: {
      type: DataTypes.ENUM("kg", "ltr", "mtr", "nos", "set", "unit"),
      allowNull: false,
    },
    purchaseRate: {
      type: DataTypes.DECIMAL(12, 2), // precise pricing
      allowNull: false,
    },
    gst: {
      type: DataTypes.DECIMAL(5, 2), // e.g., 18.00
      allowNull: false,
      defaultValue: 0.0,
    },
    // Track if item can be fitted to machines
    canBeFitted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Simple stock quantity tracking
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ...commonFields,
  },
  {
    tableName: "item",
    timestamps: true,
    paranoid: true,
  }
);

export default Item;
