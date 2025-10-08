import { DataTypes } from "sequelize";

export const commonFields = {
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  deletedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
};
