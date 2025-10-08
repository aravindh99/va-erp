import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  message,
  Spin,
  Tabs,
  DatePicker,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import api from "../service/api";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  // Fetch employee details
  const fetchEmployee = async () => {
    try {
      const res = await api.get(`/api/employees/${id}`);
      setEmployee(res.data.data);
    } catch (err) {
      console.error("Error fetching employee", err);
      message.error("Error fetching employee details");
    }
  };

  // Fetch attendance records
  const fetchAttendanceRecords = async () => {
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const res = await api.get(
        `/api/employeeAttendance?employeeId=${id}&startDate=${startDate}&endDate=${endDate}`
      );
      setAttendanceRecords(res.data.data || []);
    } catch (err) {
      console.error("Error fetching attendance records", err);
      message.error("Error fetching attendance records");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchEmployee(), fetchAttendanceRecords()]);
      setLoading(false);
    };
    fetchData();
  }, [id, dateRange]);

  // Calculate statistics
  const calculateStats = () => {
    if (!attendanceRecords.length) return {};

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(record => record.presence === 'present').length;
    const absentDays = attendanceRecords.filter(record => record.presence === 'absent').length;
    const workingDays = attendanceRecords.filter(record => record.workStatus === 'working').length;
    const totalSalary = attendanceRecords.reduce((sum, record) => sum + (record.salary || 0), 0);
    const averageSalary = totalDays > 0 ? totalSalary / totalDays : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      workingDays,
      totalSalary,
      averageSalary,
      attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
      workingRate: totalDays > 0 ? (workingDays / totalDays) * 100 : 0,
    };
  };

  const stats = calculateStats();

  // Attendance table columns
  const attendanceColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Presence",
      dataIndex: "presence",
      key: "presence",
      render: (presence) => (
        <Tag color={presence === 'present' ? 'green' : 'red'}>
          {presence === 'present' ? 'Present' : 'Absent'}
        </Tag>
      ),
    },
    {
      title: "Work Status",
      dataIndex: "workStatus",
      key: "workStatus",
      render: (workStatus) => (
        <Tag color={workStatus === 'working' ? 'blue' : 'orange'}>
          {workStatus === 'working' ? 'Working' : 'Non-working'}
        </Tag>
      ),
    },
    {
      title: "Salary",
      dataIndex: "salary",
      key: "salary",
      render: (salary) => `₹${(salary || 0).toLocaleString()}`,
    },
    {
      title: "Site",
      key: "siteName",
      render: (_, record) => {
        const site = record.site;
        return site?.siteName || '-';
      },
    },
    {
      title: "Vehicle",
      key: "vehicleNumber",
      render: (_, record) => {
        const vehicle = record.vehicle;
        return vehicle ? `${vehicle.vehicleNumber} (${vehicle.vehicleType})` : '-';
      },
    },
  ];

  // Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee Detail - ${employee?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .stats { margin: 20px 0; }
            .stat-item { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Employee Detail Report</h1>
            <h2>${employee?.name} (${employee?.empId})</h2>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="stats">
            <h3>Employee Information</h3>
            <div class="stat-item"><strong>Name:</strong> ${employee?.name}</div>
            <div class="stat-item"><strong>Employee ID:</strong> ${employee?.empId}</div>
            <div class="stat-item"><strong>Designation:</strong> ${employee?.designation || 'N/A'}</div>
            <div class="stat-item"><strong>Phone:</strong> ${employee?.phone || 'N/A'}</div>
            <div class="stat-item"><strong>Joining Date:</strong> ${employee?.joiningDate ? dayjs(employee.joiningDate).format('DD/MM/YYYY') : 'N/A'}</div>
            <div class="stat-item"><strong>Status:</strong> ${employee?.status || 'N/A'}</div>
            <div class="stat-item"><strong>Advanced Amount:</strong> ₹${(employee?.advancedAmount || 0).toLocaleString()}</div>
            <div class="stat-item"><strong>Remaining Amount:</strong> ₹${(employee?.remainingAmount || 0).toLocaleString()}</div>
          </div>
          
          <div class="stats">
            <h3>Attendance Summary</h3>
            <div class="stat-item"><strong>Total Days:</strong> ${stats.totalDays || 0}</div>
            <div class="stat-item"><strong>Present Days:</strong> ${stats.presentDays || 0}</div>
            <div class="stat-item"><strong>Absent Days:</strong> ${stats.absentDays || 0}</div>
            <div class="stat-item"><strong>Working Days:</strong> ${stats.workingDays || 0}</div>
            <div class="stat-item"><strong>Attendance Rate:</strong> ${(stats.attendanceRate || 0).toFixed(1)}%</div>
            <div class="stat-item"><strong>Total Salary:</strong> ₹${(stats.totalSalary || 0).toLocaleString()}</div>
            <div class="stat-item"><strong>Average Salary:</strong> ₹${(stats.averageSalary || 0).toFixed(2)}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Presence</th>
                <th>Work Status</th>
                <th>Salary</th>
                <th>Site</th>
                <th>Vehicle</th>
              </tr>
            </thead>
            <tbody>
              ${attendanceRecords.map(record => `
                <tr>
                  <td>${dayjs(record.date).format('DD/MM/YYYY')}</td>
                  <td>${record.presence === 'present' ? 'Present' : 'Absent'}</td>
                  <td>${record.workStatus === 'working' ? 'Working' : 'Non-working'}</td>
                  <td>₹${(record.salary || 0).toLocaleString()}</td>
                  <td>${record.site?.siteName || '-'}</td>
                  <td>${record.vehicle ? `${record.vehicle.vehicleNumber} (${record.vehicle.vehicleType})` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <Text type="danger">Employee not found</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/employees')}
          >
            Back to Employees
          </Button>
          <div>
            <Title level={2} className="mb-0">
              {employee.name} ({employee.empId})
            </Title>
            <Text type="secondary">{employee.designation || 'Employee'}</Text>
          </div>
        </div>
        <Button
          icon={<FilePdfOutlined />}
          onClick={exportToPDF}
          type="primary"
          danger
        >
          Export PDF
        </Button>
      </div>

      {/* Employee Information */}
      <Card title="Employee Information" icon={<UserOutlined />}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <Text strong>Employee ID:</Text>
              <br />
              <Text>{employee.empId}</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <Text strong>Phone:</Text>
              <br />
              <Text>{employee.phone || 'N/A'}</Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <Text strong>Joining Date:</Text>
              <br />
              <Text>
                {employee.joiningDate ? dayjs(employee.joiningDate).format('DD/MM/YYYY') : 'N/A'}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <Text strong>Status:</Text>
              <br />
              <Tag color={employee.status === 'active' ? 'green' : 'red'}>
                {employee.status || 'N/A'}
              </Tag>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <Text strong>Advanced Amount:</Text>
              <br />
              <Text style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                ₹{(employee.advancedAmount || 0).toLocaleString()}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="mb-4">
              <Text strong>Remaining Amount:</Text>
              <br />
              <Text 
                style={{ 
                  color: (employee.remainingAmount || 0) > 0 ? '#52c41a' : '#ff4d4f',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ₹{(employee.remainingAmount || 0).toLocaleString()}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Days"
              value={stats.totalDays || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Present Days"
              value={stats.presentDays || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Salary"
              value={stats.totalSalary || 0}
              prefix="₹"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Attendance Rate"
              value={stats.attendanceRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Attendance Records */}
      <Card title="Attendance Records" icon={<CalendarOutlined />}>
        <div className="mb-4">
          <Text strong>Date Range:</Text>
          <RangePicker
            className="ml-2"
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
          />
        </div>
        
        <Table
          columns={attendanceColumns}
          dataSource={attendanceRecords}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
};

export default EmployeeDetail;
