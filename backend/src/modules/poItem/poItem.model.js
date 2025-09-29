import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const POItem = sequelize.define(
  "POItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    poId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "po",
        key: "id",
      },
    },
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "item",
        key: "id",
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    ...commonFields,
  },
  {
    tableName: "po_item",
    timestamps: true,
    paranoid: true,
  }
);

export default POItem;
