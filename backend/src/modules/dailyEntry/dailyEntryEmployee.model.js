import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";

const DailyEntryEmployee = sequelize.define(
  "DailyEntryEmployee",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    dailyEntryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "dailyEntry", key: "id" },
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "employeeList", key: "id" },
    },
  },
  {
    tableName: "dailyEntryEmployee",
    timestamps: false,
  }
);

export default DailyEntryEmployee;

