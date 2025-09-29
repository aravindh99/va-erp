import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const Po = sequelize.define(
  "Po",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    orderDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    gstInclude: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    gstPercent: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    addressId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "address",
        key: "id",
      },
    },
    subTotal: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    taxTotal: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    grandTotal: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    supplierId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "supplier",
        key: "id",
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "received"),
      allowNull: false,
      defaultValue: "pending",
    },
    receivedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    receivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ...commonFields,
  },
  {
    tableName: "po",
    timestamps: true,
    paranoid: true,
  }
);

export default Po;
