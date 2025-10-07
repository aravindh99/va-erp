import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    serviceRPM: {
      type: DataTypes.DOUBLE,
      allowNull: false, // at what RPM the service was done
    },
    nextServiceRPM: {
      type: DataTypes.DOUBLE,
      allowNull: true, // what the next service RPM was set to after this service
    },
    serviceType: {
      type: DataTypes.ENUM("vehicle", "compressor", "item"),
      allowNull: false,
    },
    serviceDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    // 🔗 foreign keys
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vehicle",
        key: "id",
      },
    },
    compressorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "compressor",
        key: "id",
      },
    },
    itemInstanceId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "itemInstance",
        key: "id",
      },
    },
    ...commonFields,
  },
  {
    tableName: "services",
    timestamps: true,
    paranoid: true,
  }
);

export default Service;
