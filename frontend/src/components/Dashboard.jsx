import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Progress,
  Typography,
  DatePicker,
  Select,
  Space,
  Alert,
} from "antd";
import {
  UserOutlined,
  CarOutlined,
  ShopOutlined,
  FileTextOutlined,
  ToolOutlined,
  HomeOutlined,
  TeamOutlined,
  DollarOutlined,
  FireOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../service/api";
import { getUserRole } from "../service/auth";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    employees: 0,
    vehicles: 0,
    sites: 0,
    suppliers: 0,
    items: 0,
    purchaseOrders: 0,
    services: 0,
    compressors: 0,
  });
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [serviceAlerts, setServiceAlerts] = useState([]);
  const [financialData, setFinancialData] = useState({
    totalSalaryPaid: 0,
    totalPOAmount: 0,
    totalDieselUsed: 0,
  });
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [timeFilter, setTimeFilter] = useState('monthly');

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch counts for all modules
      const [
        employeesRes,
        vehiclesRes,
        sitesRes,
        suppliersRes,
        itemsRes,
        purchaseOrdersRes,
        servicesRes,
        compressorsRes,
        dailyEntriesRes,
        attendanceRes,
      ] = await Promise.all([
        api.get("/api/employeeLists"),
        api.get("/api/vehicles"),
        api.get("/api/sites"),
        api.get("/api/suppliers"),
        api.get("/api/items"),
        api.get("/api/pos"),
        api.get("/api/services"),
        api.get("/api/compressors"),
        api.get("/api/dailyEntries").catch(() => ({ data: { data: [] } })),
        api.get("/api/employeeAttendance").catch(() => ({ data: { data: [] } })),
      ]);

      setStats({
        employees: employeesRes.data.data?.length || 0,
        vehicles: vehiclesRes.data.data?.length || 0,
        sites: sitesRes.data.data?.length || 0,
        suppliers: suppliersRes.data.data?.length || 0,
        items: itemsRes.data.data?.length || 0,
        purchaseOrders: purchaseOrdersRes.data.data?.length || 0,
        services: servicesRes.data.data?.length || 0,
        compressors: compressorsRes.data.data?.length || 0,
      });

      // Fetch today's attendance
      const today = dayjs().format("YYYY-MM-DD");
      const todayAttendances = (attendanceRes.data.data || [])
        .filter((att) => att.date === today)
        .map((att) => ({
          ...att,
          employee: att.employee || (att.employeeId && (employeesRes.data.data || []).find(e => e.id === att.employeeId)) || {},
          site: att.site || (att.siteId && (sitesRes.data.data || []).find(s => s.id === att.siteId)) || {},
        }));
      setTodayAttendance(todayAttendances.slice(0, 5));

      // Check service alerts for vehicles and compressors
      const alerts = [];
      
      // Check vehicle service schedules
      vehiclesRes.data.data?.forEach(vehicle => {
        if (vehicle.vehicleServiceSchedule && vehicle.vehicleServiceSchedule.length > 0) {
          const nextServiceRPM = Math.min(...vehicle.vehicleServiceSchedule);
          const remainingRPM = nextServiceRPM - (vehicle.vehicleRPM ?? 0);
          
          if (remainingRPM <= 0) {
            alerts.push({
              type: 'vehicle',
              message: `${vehicle.vehicleNumber} service is due NOW (${nextServiceRPM} RPM)`,
              priority: 'high',
              item: vehicle.vehicleNumber,
            });
          } else if (remainingRPM <= 100) {
            alerts.push({
              type: 'vehicle',
              message: `${vehicle.vehicleNumber} service due soon (${remainingRPM} RPM remaining)`,
              priority: 'medium',
              item: vehicle.vehicleNumber,
            });
          }
        }
      });

      // Check compressor service schedules
      vehiclesRes.data.data?.forEach(vehicle => {
        if (vehicle.compressorId && vehicle.compressorServiceSchedule && vehicle.compressorServiceSchedule.length > 0) {
          const nextServiceRPM = Math.min(...vehicle.compressorServiceSchedule);
          const remainingRPM = nextServiceRPM - (vehicle.compressorRPM ?? 0);

          if (remainingRPM <= 0) {
            alerts.push({
              type: 'compressor',
              message: `${vehicle.compressor?.compressorName || 'Compressor'} (in ${vehicle.vehicleNumber}) service is due NOW (${nextServiceRPM} RPM)`,
              priority: 'high',
              item: vehicle.compressor?.compressorName || 'Compressor',
            });
          } else if (remainingRPM <= 100) {
            alerts.push({
              type: 'compressor',
              message: `${vehicle.compressor?.compressorName || 'Compressor'} (in ${vehicle.vehicleNumber}) service due soon (${remainingRPM} RPM remaining)`,
              priority: 'medium',
              item: vehicle.compressor?.compressorName || 'Compressor',
            });
          }
        }
      });

      setServiceAlerts(alerts);

      // Calculate financial data
      await calculateFinancialData();

    } catch (err) {
      console.error("Error fetching dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate financial data based on date range
  const calculateFinancialData = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');

      // Fetch attendance data for salary calculation
      const attendanceRes = await api.get(`/api/employeeAttendance?startDate=${startDate}&endDate=${endDate}`);
      const attendanceData = attendanceRes.data.data || [];

      // Calculate total salary paid
      const totalSalaryPaid = attendanceData.reduce((sum, att) => sum + (att.salary || 0), 0);

      // Fetch PO data for amount calculation
      const poRes = await api.get(`/api/pos?startDate=${startDate}&endDate=${endDate}`);
      const poData = poRes.data.data || [];
      const totalPOAmount = poData.reduce((sum, po) => sum + (po.grandTotal || 0), 0);

      // Fetch daily entries for diesel calculation
      const dailyEntriesRes = await api.get(`/api/dailyEntries?startDate=${startDate}&endDate=${endDate}`);
      const dailyEntriesData = dailyEntriesRes.data.data || [];
      const totalDieselUsed = dailyEntriesData.reduce((sum, entry) => sum + (entry.dieselUsed || 0), 0);

      setFinancialData({
        totalSalaryPaid,
        totalPOAmount,
        totalDieselUsed,
      });
    } catch (err) {
      console.error("Error calculating financial data", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  // Handle time filter change
  const handleTimeFilterChange = (value) => {
    setTimeFilter(value);
    const today = dayjs();
    
    switch (value) {
      case 'daily':
        setDateRange([today, today]);
        break;
      case 'weekly':
        setDateRange([today.subtract(7, 'days'), today]);
        break;
      case 'monthly':
        setDateRange([today.subtract(30, 'days'), today]);
        break;
      case 'yearly':
        setDateRange([today.subtract(365, 'days'), today]);
        break;
      case 'custom':
        // Keep current date range
        break;
      default:
        setDateRange([today.subtract(30, 'days'), today]);
    }
  };

  // Navigation handlers
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">Dashboard</Title>
          <Text type="secondary">Overview of your VA ERP system</Text>
        </div>
        <Space>
          <Select
            value={timeFilter}
            onChange={handleTimeFilterChange}
            style={{ width: 120 }}
          >
            <Option value="daily">Daily</Option>
            <Option value="weekly">Weekly</Option>
            <Option value="monthly">Monthly</Option>
            <Option value="yearly">Yearly</Option>
            <Option value="custom">Custom</Option>
          </Select>
          {timeFilter === 'custom' && (
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
            />
          )}
        </Space>
      </div>

      {/* Service Alerts */}
      {serviceAlerts.length > 0 && (
        <Alert
          message={`${serviceAlerts.length} Service Alert${serviceAlerts.length > 1 ? 's' : ''}`}
          description={
            <div>
              {serviceAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="mb-1">
                  <Text type={alert.priority === 'high' ? 'danger' : 'warning'}>
                    • {alert.message}
                  </Text>
                </div>
              ))}
              {serviceAlerts.length > 3 && (
                <Text type="secondary">... and {serviceAlerts.length - 3} more</Text>
              )}
            </div>
          }
          type={serviceAlerts.some(a => a.priority === 'high') ? 'error' : 'warning'}
          showIcon
          className="mb-4"
        />
      )}

      {/* Financial Overview */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Salary Paid"
              value={financialData.totalSalaryPaid}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => `₹${value.toLocaleString()}`}
            />
            <Text type="secondary" className="text-sm">
              {dayjs(dateRange[0]).format('DD/MM/YYYY')} - {dayjs(dateRange[1]).format('DD/MM/YYYY')}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Purchase Order Amount"
              value={financialData.totalPOAmount}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `₹${value.toLocaleString()}`}
            />
            <Text type="secondary" className="text-sm">
              {dayjs(dateRange[0]).format('DD/MM/YYYY')} - {dayjs(dateRange[1]).format('DD/MM/YYYY')}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Diesel Used"
              value={financialData.totalDieselUsed}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => `${value.toLocaleString()}L`}
            />
            <Text type="secondary" className="text-sm">
              {dayjs(dateRange[0]).format('DD/MM/YYYY')} - {dayjs(dateRange[1]).format('DD/MM/YYYY')}
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Card 
            hoverable 
            onClick={() => handleNavigation('/employee/list')}
            className="cursor-pointer"
          >
            <Statistic
              title="Employees"
              value={stats.employees}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card 
            hoverable 
            onClick={() => handleNavigation('/vehicle')}
            className="cursor-pointer"
          >
            <Statistic
              title="Vehicles"
              value={stats.vehicles}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card 
            hoverable 
            onClick={() => handleNavigation('/site')}
            className="cursor-pointer"
          >
            <Statistic
              title="Sites"
              value={stats.sites}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card 
            hoverable 
            onClick={() => handleNavigation('/supplier')}
            className="cursor-pointer"
          >
            <Statistic
              title="Suppliers"
              value={stats.suppliers}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Today's Attendance */}
      <Card title="Today's Attendance" extra={<Button onClick={() => handleNavigation('/employee/attendance')}>View All</Button>}>
        <Table
          dataSource={todayAttendance}
          pagination={false}
          size="small"
          columns={[
            {
              title: "Employee",
              key: "employee",
              render: (_, record) => (
                <div>
                  <Text strong>{record.employee?.name || 'Unknown'}</Text>
                  <br />
                  <Text type="secondary" className="text-sm">
                    {record.employee?.empId || 'N/A'}
                  </Text>
                </div>
              ),
            },
            {
              title: "Site",
              key: "site",
              render: (_, record) => record.site?.siteName || 'Unknown',
            },
            {
              title: "Status",
              dataIndex: "status",
              key: "status",
              render: (status) => {
                const config = {
                  present: { color: 'green', text: 'Present' },
                  absent: { color: 'red', text: 'Absent' },
                  present_nonworking: { color: 'orange', text: 'Present (Non-working)' },
                };
                const { color, text } = config[status] || { color: 'default', text: status };
                return <Tag color={color}>{text}</Tag>;
              },
            },
            {
              title: "Salary",
              dataIndex: "salary",
              key: "salary",
              render: (salary) => salary ? `₹${salary.toLocaleString()}` : '-',
            },
          ]}
        />
        {todayAttendance.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No attendance records for today
          </div>
        )}
      </Card>

      {/* Service Alerts Summary */}
      {serviceAlerts.length > 0 && (
        <Card title="Service Alerts" extra={<Button onClick={() => handleNavigation('/service-management')}>Manage Services</Button>}>
          <div className="space-y-2">
            {serviceAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  {alert.priority === 'high' ? (
                    <ExclamationCircleOutlined className="text-red-500" />
                  ) : (
                    <ClockCircleOutlined className="text-orange-500" />
                  )}
                  <Text type={alert.priority === 'high' ? 'danger' : 'warning'}>
                    {alert.message}
                  </Text>
                </div>
                <Tag color={alert.priority === 'high' ? 'red' : 'orange'}>
                  {alert.priority === 'high' ? 'URGENT' : 'SOON'}
                </Tag>
              </div>
            ))}
            {serviceAlerts.length > 5 && (
              <div className="text-center">
                <Text type="secondary">
                  ... and {serviceAlerts.length - 5} more alerts
                </Text>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;