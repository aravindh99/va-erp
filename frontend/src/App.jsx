// App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./shared/Layout";
import Attendance from "./components/Attendance";
import Login from "./shared/Login";
import ProtectedRoute from "./service/ProtectedRoute";
import EmployeeList from "./components/EmployeeList";
import Dashboard from "./components/Dashboard";
import BrandManagement from "./components/BrandManagement";
import DailyEntry from "./components/DailyEntry";
import ItemManagement from "./components/ItemManagement";
import PurchaseOrderComplete from "./components/PurchaseOrderComplete";
import SiteManagement from "./components/SiteManagement";
import SupplierManagement from "./components/SupplierManagement";
import Vehicle from "./components/Vehicle";
import CompressorManagement from "./components/CompressorManagement";
import UserManagement from "./components/UserManagement";
import Reports from "./components/Reports";
import ItemStockReport from "./components/ItemStockReport";
import VehicleServiceHistory from "./components/VehicleServiceHistory";
import CompressorServiceHistory from "./components/CompressorServiceHistory";
import ServiceManagement from "./components/ServiceManagement";
import AddressManagement from "./components/AddressManagement";
import InventoryManagement from "./components/InventoryManagement";
import ProductionReport from "./components/ProductionReport";
import ItemInstanceManagement from "./components/ItemInstanceManagement";
import EmployeeDetails from "./components/EmployeeDetails";
import NotFound from "./components/NotFound";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes (require JWT) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            {/* Redirect root to dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Main routes */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="brand" element={<BrandManagement />} />
            <Route path="daily-entry" element={<DailyEntry />} />
            <Route path="item-management" element={<ItemManagement />} />
            <Route path="inventory-management" element={<InventoryManagement />} />
            <Route path="site" element={<SiteManagement />} />
            <Route path="supplier" element={<SupplierManagement />} />
            <Route path="vehicle" element={<Vehicle />} />
            <Route path="compressor" element={<CompressorManagement />} />
            <Route path="service-management" element={<ServiceManagement />} />
            <Route path="user-management" element={<UserManagement />} />
            <Route path="address" element={<AddressManagement />} />
            <Route path="item-instances" element={<ItemInstanceManagement />} />

            {/* Employee sub-routes */}
            <Route path="employee/attendance" element={<Attendance />} />
            <Route path="employee/list" element={<EmployeeList />} />
            <Route path="employee/details/:id" element={<EmployeeDetails />} />

            {/* Purchase Order */}
            <Route path="purchase-order" element={<PurchaseOrderComplete />} />

            {/* Reports sub-routes */}
            <Route path="reports" element={<Reports />} />
            <Route path="reports/item-stock" element={<ItemStockReport />} />
            <Route path="reports/production" element={<ProductionReport />} />
            <Route path="reports/vehicle-service/:vehicleId" element={<VehicleServiceHistory />} />
            <Route path="reports/compressor-service/:compressorId" element={<CompressorServiceHistory />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
