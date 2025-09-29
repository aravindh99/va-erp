import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const Vehicle = sequelize.define(
  "Vehicle",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    vehicleType: {
      type: DataTypes.STRING, // crawler, camper, truck, etc.
      allowNull: false,
    },
    vehicleNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    brandId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "brand",
        key: "id",
      },
    },
    siteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "site",
        key: "id",
      },
    },
    vehicleRPM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    vehicleServiceSchedule: {
      type: DataTypes.JSON,
      allowNull: true,
      // Example: [500, 1000, 2500]
    },
    compressorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "compressor",
        key: "id",
      },
    },
    compressorRPM: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    compressorServiceSchedule: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ...commonFields,
  },
  {
    tableName: "vehicle",
    timestamps: true,
    paranoid: true,
  }
);

export default Vehicle;
