import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const Address = sequelize.define(
  "Address",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    addressBill: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    addressShip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ...commonFields,
  },
  {
    tableName: "address",
    timestamps: true,
    paranoid: true,
  }
);

export default Address;
