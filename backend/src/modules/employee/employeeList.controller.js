import EmployeeList from "./employeeList.model.js";
import EmployeeAttendance from "./employeeAttendance.model.js";
import Site from "../site/site.model.js";
import Vehicle from "../vehicle/vehicle.model.js";
import DailyEntry from "../dailyEntry/dailyEntry.model.js";
import { BaseCrud } from "../../shared/utils/baseCrud.js";
import { BaseController } from "../../shared/utils/baseController.js";

// 1. Create CRUD service from model
const EmployeeCrud = new BaseCrud(EmployeeList);

// 2. Create custom controller with proper advance amount handling
class EmployeeListCustomController extends BaseController {
  constructor() {
    super(EmployeeCrud, "Employee");
  }

  // Override create method to properly initialize advancedAmount
  create = async (req, res, next) => {
    try {
      const { advancedAmount, ...otherData } = req.body;
      const createdBy = req.user.username;

      // Set advancedAmount
      const employeeData = {
        ...otherData,
        advancedAmount: advancedAmount || 0,
        createdBy
      };

      const employee = await EmployeeList.create(employeeData);
      
      return res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: employee
      });
    } catch (error) {
      next(error);
    }
  };

  // Override update method to handle advance amount changes
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { advancedAmount, ...otherData } = req.body;
      const updatedBy = req.user.username;

      // Update employee with new data including advancedAmount
      await EmployeeList.update(
        { ...otherData, advancedAmount: advancedAmount || 0, updatedBy },
        { where: { id } }
      );

      const updatedEmployee = await EmployeeList.findByPk(id);
      
      return res.json({
        success: true,
        message: "Employee updated successfully",
        data: updatedEmployee
      });
    } catch (error) {
      next(error);
    }
  };

  // Get employee work history and statistics
  getEmployeeHistory = async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Get employee with all related data
      const employee = await EmployeeList.findByPk(id, {
        include: [
          {
            model: EmployeeAttendance,
            as: 'attendances',
            include: [
              { model: Site, as: 'site' },
              { model: Vehicle, as: 'vehicle' }
            ],
            order: [['date', 'DESC']]
          }
        ]
      });

      if (!employee) {
        return res.status(404).json({ 
          success: false, 
          message: "Employee not found" 
        });
      }

      // Get daily entries where this employee was involved
      const dailyEntries = await DailyEntry.findAll({
        where: {
          $or: [
            { employeeId: id },
            { '$employees.id$': id }
          ]
        },
        include: [
          { model: Site, as: 'site' },
          { model: Vehicle, as: 'vehicle' },
          { model: EmployeeList, as: 'employees', through: { attributes: [] } }
        ],
        order: [['date', 'DESC']]
      });

      // Calculate statistics
      const attendances = employee.attendances || [];
      const totalDaysWorked = attendances.filter(a => a.presence === 'present').length;
      const totalSalaryPaid = attendances.reduce((sum, a) => sum + (a.salary || 0), 0);
      const uniqueSites = [...new Set(attendances.map(a => a.siteId).filter(Boolean))];
      const uniqueVehicles = [...new Set([
        ...attendances.map(a => a.vehicleId),
        ...dailyEntries.map(e => e.vehicleId)
      ].filter(Boolean))];

      return res.json({
        success: true,
        data: {
          employee,
          dailyEntries,
          statistics: {
            totalDaysWorked,
            totalPresent: attendances.filter(a => a.presence === 'present').length,
            totalAbsent: attendances.filter(a => a.presence === 'absent').length,
            totalSalaryPaid,
            totalAdvanceTaken: employee.advancedAmount || 0,
            currentBalance: employee.advancedAmount || 0,
            uniqueSitesCount: uniqueSites.length,
            uniqueVehiclesCount: uniqueVehicles.length,
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

export const EmployeeListController = new EmployeeListCustomController();
