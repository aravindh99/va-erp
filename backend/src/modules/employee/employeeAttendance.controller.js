import EmployeeAttendance from "./employeeAttendance.model.js";
import EmployeeList from "./employeeList.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";
import { Op } from "sequelize";

// 1. Create CRUD service from model
const EmployeeAttendanceCrud = new BaseCrud(EmployeeAttendance);

// 2. Create custom controller with date filtering
export class EmployeeAttendanceController extends BaseController {
  constructor() {
    super(EmployeeAttendanceCrud, "Employee Attendance");
  }

  // Override getAll to handle date filtering (single date or range)
  getAll = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, date, startDate, endDate, siteId } = req.query;
      
      // Build where clause for filtering
      const whereClause = {};
      
      // Date filtering
      if (date) {
        whereClause.date = date;
      } else if (startDate && endDate) {
        whereClause.date = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        whereClause.date = { [Op.gte]: startDate };
      } else if (endDate) {
        whereClause.date = { [Op.lte]: endDate };
      }
      
      // Site filtering
      if (siteId) {
        whereClause.siteId = siteId;
      }
      
      console.log('EmployeeAttendance query filters:', whereClause);
      
      const items = await this.service.getAll(page, limit, {
        where: whereClause,
        include: [
          {
            association: 'employee',
            attributes: ['id', 'name', 'empId']
          },
          {
            association: 'site',
            attributes: ['id', 'siteName']
          },
          {
            association: 'vehicle',
            attributes: ['id', 'vehicleNumber', 'vehicleType']
          }
        ]
      });
      
      return res.json({ success: true, ...items });
    } catch (error) {
      next(error);
    }
  };

  // Override create method to automatically deduct salary from advance
  create = async (req, res, next) => {
    const transaction = await EmployeeAttendance.sequelize.transaction();
    try {
      const { employeeId, salary } = req.body;
      const username = (req.user && (req.user.username || req.user.name)) || "system";

      // Create attendance record with createdBy from JWT
      const attendancePayload = {
        ...req.body,
        createdBy: username,
      };
      const attendance = await this.service.create(attendancePayload, { transaction });

      // If salary is provided and greater than 0, deduct from advance
      if (salary && salary > 0) {
        const employee = await EmployeeList.findByPk(employeeId, { transaction });
        if (employee) {
          const currentRemaining = Number(employee.remainingAmount) || 0;
          const salaryNumber = Number(salary) || 0;
          const deduction = Math.min(salaryNumber, currentRemaining);
          const newRemaining = currentRemaining - deduction;

          if (deduction > 0) {
            await employee.update({
              remainingAmount: newRemaining,
              updatedBy: username
            }, { transaction });
          }
        }
      }

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: "Attendance created successfully",
        data: attendance
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  };

  // Override update method to handle salary deduction changes
  update = async (req, res, next) => {
    const transaction = await EmployeeAttendance.sequelize.transaction();
    try {
      const { id } = req.params;
      const { employeeId, salary } = req.body;
      const username = (req.user && (req.user.username || req.user.name)) || "system";

      // Get the existing attendance record to compare salary
      const existingAttendance = await EmployeeAttendance.findByPk(id, { transaction });
      if (!existingAttendance) {
        return res.status(404).json({ success: false, message: "Attendance record not found" });
      }

      // Update attendance record with updatedBy from JWT
      const updatePayload = {
        ...req.body,
        updatedBy: username,
      };
      const updatedAttendance = await this.service.update(id, updatePayload, { transaction });

      // Handle salary deduction if salary changed
      if (salary !== undefined && salary !== existingAttendance.salary) {
        const employee = await EmployeeList.findByPk(employeeId, { transaction });
        if (employee) {
          const currentRemaining = Number(employee.remainingAmount) || 0;
          const previousSalary = Number(existingAttendance.salary) || 0;
          const newSalary = Number(salary) || 0;
          const salaryDifference = newSalary - previousSalary;

          // Only deduct when increasing salary; never re-credit on decrease
          if (salaryDifference > 0) {
            const deduction = Math.min(salaryDifference, currentRemaining);
            const newRemaining = currentRemaining - deduction;

            if (deduction > 0) {
              await employee.update({
                remainingAmount: newRemaining,
                updatedBy: username
              }, { transaction });
            }
          }
        }
      }

      await transaction.commit();

      return res.json({
        success: true,
        message: "Attendance updated successfully",
        data: updatedAttendance
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  };

  // Deduct salary from advanced amount (manual method)
  deductSalaryFromAdvance = async (req, res, next) => {
    try {
      const { employeeId, salaryAmount } = req.body;
      const updatedBy = req.user.username;

      const employee = await EmployeeList.findByPk(employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: "Employee not found" });
      }

      const currentRemaining = employee.remainingAmount || 0;
      const newRemaining = Math.max(0, currentRemaining - salaryAmount);

      await employee.update({
        remainingAmount: newRemaining,
        updatedBy
      });

      return res.json({
        success: true,
        message: "Salary deducted from advance amount",
        data: {
          employeeId,
          salaryAmount,
          previousRemaining: currentRemaining,
          newRemaining: newRemaining,
          deducted: currentRemaining - newRemaining
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

export const employeeAttendanceController = new EmployeeAttendanceController();
