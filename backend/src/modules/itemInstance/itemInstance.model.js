import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const ItemInstance = sequelize.define(
  "ItemInstance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Reference to the item type
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "item",
        key: "id",
      },
    },
    // Instance-specific identifier (e.g., "Hammer-001", "Hammer-002")
    instanceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Current status of the instance
    status: {
      type: DataTypes.ENUM("in_stock", "fitted", "removed"),
      allowNull: false,
      defaultValue: "in_stock",
    },
    // Current meter reading (cumulative)
    currentMeter: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    // Current RPM reading (cumulative)
    currentRPM: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    // Next service RPM for this instance
    nextServiceRPM: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    // Last service date
    lastServiceDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Next service due (calculated)
    nextServiceDue: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    // Currently fitted to which machine/vehicle
    fittedToVehicleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vehicle",
        key: "id",
      },
    },
    // When it was fitted
    fittedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // When it was removed
    removedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Notes about this instance
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ...commonFields,
  },
  {
    tableName: "itemInstance",
    timestamps: true,
    paranoid: true,
  }
);

export default ItemInstance;
