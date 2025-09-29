import { DataTypes } from "sequelize";
import sequelize from "../../config/db.js";
import { commonFields } from "../../shared/models/commonFields.js";


const EmployeeAttendance = sequelize.define(
  "EmployeeAttendance",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "employeeList",
        key: "id",
      },
    },
    presence: {
      type: DataTypes.ENUM("present", "absent"),
      allowNull: false,
    },
    workStatus: {
      type: DataTypes.ENUM("working", "non-working"),
      allowNull: true,
    },
    salary: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // ✅ foreign keys
    siteId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "site",
        key: "id",
      },
    },
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "vehicle",
        key: "id",
      },
    },
    ...commonFields,
  },
  {
    tableName: "employeeAttendance",
    timestamps: true,
    paranoid: true,
  }
);


export default EmployeeAttendance;
