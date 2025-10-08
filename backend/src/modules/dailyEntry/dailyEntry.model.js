import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const DailyEntry = sequelize.define(
  "DailyEntry",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    refNo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // Vehicle RPM - opening and closing
    vehicleOpeningRPM: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    vehicleClosingRPM: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    // Compressor RPM - opening and closing
    compressorOpeningRPM: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    compressorClosingRPM: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    // Diesel and meter readings
    dieselUsed: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    // HSD usage
    vehicleHSD: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    compressorHSD: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    meter: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    // Number of holes drilled
    noOfHoles: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    },
    vehicleServiceDone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    compressorServiceDone: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Primary employee (required)
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "employeeList",
        key: "id",
      },
    },
    // FKs
    siteId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "site",
        key: "id",
      },
    },
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
    tableName: "dailyEntry",
    timestamps: true,
    paranoid: true,
  }
);

export default DailyEntry;
