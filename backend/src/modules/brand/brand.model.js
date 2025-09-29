import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const Brand = sequelize.define(
  "Brand",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    brandName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    brandStatus: {
      type: DataTypes.ENUM("active", "inactive"),
      allowNull: false,
    },
    ...commonFields,
  },
  {
    tableName: "brand",
    timestamps: true,
    paranoid: true,
  }
);

export default Brand;
