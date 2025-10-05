import EmployeeList from "../../modules/employee/employeeList.model.js";
import EmployeeAttendance from "../../modules/employee/employeeAttendance.model.js";
import Brand from "../../modules/brand/brand.model.js";
import Vehicle from "../../modules/vehicle/vehicle.model.js";
import Service from "../../modules/service/service.model.js";
import Site from "../../modules/site/site.model.js";
import Item from "../../modules/item/item.model.js";
import StockTransaction from "../../modules/stockTransaction/stockTransaction.model.js";
import Supplier from "../../modules/supplier/supplier.model.js";
import Po from "../../modules/po/po.model.js";
import PoItem from "../../modules/poItem/poItem.model.js";
import DailyEntry from "../../modules/dailyEntry/dailyEntry.model.js";
import DailyEntryEmployee from "../../modules/dailyEntry/dailyEntryEmployee.model.js";
import Compressor from "../../modules/compressor/compressor.model.js";
import Address from "../../modules/address/address.model.js";
import User from "../../modules/user/user.model.js";
import ItemInstance from "../../modules/itemInstance/itemInstance.model.js";

export const defineAssociations = () => {
  // ========== EMPLOYEE MODULE RELATIONSHIPS ==========
  EmployeeList.hasMany(EmployeeAttendance, {
    foreignKey: "employeeId",
    as: "attendances",
  });
  EmployeeAttendance.belongsTo(EmployeeList, {
    foreignKey: "employeeId",
    as: "employee",
  });

  // ========== VEHICLE MODULE RELATIONSHIPS ==========
  Brand.hasMany(Vehicle, { foreignKey: "brandId", as: "vehicles" });
  Vehicle.belongsTo(Brand, { foreignKey: "brandId", as: "brand" });

  Site.hasMany(Vehicle, { foreignKey: "siteId", as: "vehicles" });
  Vehicle.belongsTo(Site, { foreignKey: "siteId", as: "site" });

  Compressor.hasMany(Vehicle, { foreignKey: "compressorId", as: "vehicles" });
  Vehicle.belongsTo(Compressor, {
    foreignKey: "compressorId",
    as: "compressor",
  });

  Vehicle.hasMany(DailyEntry, { foreignKey: "vehicleId", as: "dailyEntries" });
  DailyEntry.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });

  Vehicle.hasMany(Service, { foreignKey: "vehicleId", as: "services" });
  Service.belongsTo(Vehicle, { foreignKey: "vehicleId", as: "vehicle" });

  Compressor.hasMany(Service, { foreignKey: "compressorId", as: "services" });
  Service.belongsTo(Compressor, {
    foreignKey: "compressorId",
    as: "compressor",
  });

  // ========== DAILY ENTRY RELATIONSHIPS ==========
  Site.hasMany(DailyEntry, { foreignKey: "siteId", as: "dailyEntries" });
  DailyEntry.belongsTo(Site, { foreignKey: "siteId", as: "site" });

  // Primary employee relationship (one-to-many)
  EmployeeList.hasMany(DailyEntry, { foreignKey: "employeeId", as: "dailyEntriesAsPrimary" });
  DailyEntry.belongsTo(EmployeeList, { foreignKey: "employeeId", as: "primaryEmployee" });

  // Many-to-many employee relationships (additional employees)
  EmployeeList.belongsToMany(DailyEntry, {
    through: DailyEntryEmployee,
    foreignKey: "employeeId",
    otherKey: "dailyEntryId",
    as: "dailyEntries",
  });
  DailyEntry.belongsToMany(EmployeeList, {
    through: DailyEntryEmployee,
    foreignKey: "dailyEntryId",
    otherKey: "employeeId",
    as: "employees",
  });

  // ========== PO / SUPPLIER / ITEM RELATIONSHIPS ==========
  Supplier.hasMany(Po, { foreignKey: "supplierId", as: "pos" });
  Po.belongsTo(Supplier, { foreignKey: "supplierId", as: "supplier" });

  // Address relationships
  Address.hasMany(Po, { foreignKey: "addressId", as: "pos" });
  Po.belongsTo(Address, { foreignKey: "addressId", as: "address" });

  Po.belongsToMany(Item, {
    through: PoItem,
    foreignKey: "poId",
    otherKey: "itemId",
    as: "items",
  });
  Item.belongsToMany(Po, {
    through: PoItem,
    foreignKey: "itemId",
    otherKey: "poId",
    as: "pos",
  });

  Po.hasMany(PoItem, { foreignKey: "poId", as: "poItems" });
  PoItem.belongsTo(Po, { foreignKey: "poId", as: "po" });

  Item.hasMany(PoItem, { foreignKey: "itemId", as: "poItems" });
  PoItem.belongsTo(Item, { foreignKey: "itemId", as: "item" });

  // ========== STOCK TRANSACTION RELATIONSHIPS ==========
  Item.hasMany(StockTransaction, { foreignKey: "itemId", as: "stockTransactions" });
  StockTransaction.belongsTo(Item, { foreignKey: "itemId", as: "item" });


  // ========== EMPLOYEE ATTENDANCE RELATIONSHIPS ==========
  Site.hasMany(EmployeeAttendance, { foreignKey: "siteId", as: "attendances" });
  EmployeeAttendance.belongsTo(Site, { foreignKey: "siteId", as: "site" });

  Vehicle.hasMany(EmployeeAttendance, {
    foreignKey: "vehicleId",
    as: "attendances",
  });
  EmployeeAttendance.belongsTo(Vehicle, {
    foreignKey: "vehicleId",
    as: "vehicle",
  });


  // ========== ITEM INSTANCE RELATIONSHIPS ==========
  Item.hasMany(ItemInstance, { foreignKey: "itemId", as: "instances" });
  ItemInstance.belongsTo(Item, { foreignKey: "itemId", as: "item" });

  Vehicle.hasMany(ItemInstance, { foreignKey: "fittedToVehicleId", as: "fittedInstances" });
  ItemInstance.belongsTo(Vehicle, { foreignKey: "fittedToVehicleId", as: "fittedToVehicle" });

  // Service relationships with ItemInstance
  ItemInstance.hasMany(Service, { foreignKey: "itemInstanceId", as: "services" });
  Service.belongsTo(ItemInstance, { foreignKey: "itemInstanceId", as: "itemInstance" });

  // ========== USER RELATIONSHIPS ==========
  // User model relationships (if needed for createdBy/updatedBy tracking)
  // Note: These are typically handled by commonFields, but can be explicit if needed
};
