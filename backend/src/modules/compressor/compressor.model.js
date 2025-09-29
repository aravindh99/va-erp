import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const Compressor = sequelize.define(
  "Compressor",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    compressorName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    compressorType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    },
    // Additional compressor details
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    startingRPM: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    currentRPM: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    ...commonFields,
  },
  {
    tableName: "compressor",
    timestamps: true,
    paranoid: true,
  }
);

export default Compressor;
