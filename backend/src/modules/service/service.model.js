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
      type: DataTypes.INTEGER,
      allowNull: false, // at what RPM the service was done
    },
    serviceType: {
      type: DataTypes.ENUM("vehicle", "compressor"),
      allowNull: false,
    },
    serviceDate: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    // 🔗 foreign keys
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: false,
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
    ...commonFields,
  },
  {
    tableName: "service",
    timestamps: true,
    paranoid: true,
  }
);

export default Service;
