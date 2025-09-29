import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const ItemService = sequelize.define(
  "ItemService",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    // Item that was serviced
    itemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "item",
        key: "id",
      },
    },
    // Vehicle where item was fitted when serviced
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vehicle",
        key: "id",
      },
    },
    // RPM at which service was done
    serviceRPM: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Service date
    serviceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // Service notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Daily entry when service was done
    dailyEntryId: {
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
    tableName: "itemService",
    timestamps: true,
    paranoid: true,
  }
);

export default ItemService;
