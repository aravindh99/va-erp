import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";

const Site = sequelize.define(
  "Site",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    siteName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    siteStatus: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    ...commonFields,
  },
  {
    tableName: "site",
    timestamps: true,
    paranoid: true,
  }
);

export default Site;
