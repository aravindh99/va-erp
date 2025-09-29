import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const ItemFitting = sequelize.define(
  "ItemFitting",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Item being fitted
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "item",
        key: "id",
      },
    },
    // Vehicle where item is fitted
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "vehicle",
        key: "id",
      },
    },
    // Daily entry when item was fitted
    dailyEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "dailyEntry",
        key: "id",
      },
    },
    // RPM readings
    startingRPM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    closingRPM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Total RPM calculated (closing - starting)
    totalRPM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Status of the fitting
    status: {
      type: DataTypes.ENUM("fitted", "removed"),
      allowNull: false,
      defaultValue: "fitted",
    },
    // Date when item was removed (if applicable)
    removedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    // Daily entry when item was removed
    removedDailyEntryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "dailyEntry",
        key: "id",
      },
    },
    ...commonFields,
  },
  {
    tableName: "itemFitting",
    timestamps: true,
    paranoid: true,
  }
);

export default ItemFitting;
