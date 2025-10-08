import { useState, useEffect } from "react";
import {
  Button,
  Table,
  Tag,
  Space,
  Form,
  Select,
  DatePicker,
  Card,
  Input,
  Typography,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  SearchOutlined,
  FilePdfOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit } from "../service/auth";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const EmployeeSalary = () => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]);
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [dateRange, setDateRange] = useState([]);
  const [totalSalary, setTotalSalary] = useState(0);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/employeeLists");
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error("Error fetching employees", err);
    }
  };

  // Fetch salary records for selected employee and date range
  const fetchSalaryRecords = async (employeeId, fromDate, toDate) => {
    setLoading(true);
    try {
      const res = await api.get("/api/employeeAttendance");
      const filteredRecords = res.data.data?.filter(record => {
        const recordDate = dayjs(record.date);
        return (
          record.employeeId === employeeId &&
          recordDate.isAfter(dayjs(fromDate).subtract(1, 'day')) &&
          recordDate.isBefore(dayjs(toDate).add(1, 'day'))
        );
      }) || [];
      
      setSalaryRecords(filteredRecords);
      
      // Calculate total salary
      const total = filteredRecords.reduce((sum, record) => sum + (record.salary || 0), 0);
      setTotalSalary(total);
    } catch (err) {
      console.error("Error fetching salary records", err);
      setSalaryRecords([]);
      setTotalSalary(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle form submit
  const handleSubmit = async (values) => {
    if (values.employeeId && values.dateRange && values.dateRange.length === 2) {
      const [fromDate, toDate] = values.dateRange;
      const employee = employees.find(emp => emp.id === values.employeeId);
      setSelectedEmployee(employee);
      setDateRange([fromDate, toDate]);
      await fetchSalaryRecords(values.employeeId, fromDate, toDate);
    }
  };

  // PDF Export
  const exportToPDF = () => {
    if (!selectedEmployee || salaryRecords.length === 0) return;
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee Salary Report - ${selectedEmployee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .total { font-size: 18px; font-weight: bold; color: #1890ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Employee Salary Report</h1>
            <h2>${selectedEmployee.name} (${selectedEmployee.empId})</h2>
            <p>Period: ${dateRange[0]?.format('DD/MM/YYYY')} to ${dateRange[1]?.format('DD/MM/YYYY')}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
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
              ${salaryRecords.map(record => `
                <tr>
                  <td>${dayjs(record.date).format('DD/MM/YYYY')}</td>
                  <td>${record.presence}</td>
                  <td>${record.workStatus || '-'}</td>
                  <td>₹${record.salary}</td>
                  <td>${record.site?.siteName || '-'}</td>
                  <td>${record.vehicle?.vehicleNumber || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="total">Total Salary: ₹${totalSalary}</div>
            <p>Total Working Days: ${salaryRecords.length}</p>
            <p>Present Days: ${salaryRecords.filter(r => r.presence === 'present').length}</p>
            <p>Absent Days: ${salaryRecords.filter(r => r.presence === 'absent').length}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Table columns
  const columns = [
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
      render: (presence) => {
        const colors = { present: "green", absent: "red" };
        return <Tag color={colors[presence] || "default"}>{presence}</Tag>;
      },
    },
    {
      title: "Work Status",
      dataIndex: "workStatus",
      key: "workStatus",
      render: (status) => {
        const colors = { working: "green", "non-working": "red" };
        return <Tag color={colors[status] || "default"}>{status || "-"}</Tag>;
      },
    },
    {
      title: "Salary",
      dataIndex: "salary",
      key: "salary",
      render: (salary) => `₹${salary}`,
    },
    {
      title: "Site",
      dataIndex: ["site", "siteName"],
      key: "siteName",
      render: (siteName) => siteName || "-",
    },
    {
      title: "Vehicle",
      dataIndex: ["vehicle", "vehicleNumber"],
      key: "vehicleNumber",
      render: (vehicleNumber) => vehicleNumber || "-",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="mb-2">Employee Salary Report</Title>
          <Text type="secondary">View and analyze employee salary details by date range</Text>
        </div>
        {salaryRecords.length > 0 && (
          <Button
            icon={<FilePdfOutlined />}
            onClick={exportToPDF}
            type="primary"
            danger
          >
            Export PDF
          </Button>
        )}
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="employeeId"
                label="Select Employee"
                rules={[{ required: true, message: "Please select an employee" }]}
              >
                <Select placeholder="Select employee" showSearch>
                  {employees.map((emp) => (
                    <Select.Option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.empId})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="dateRange"
                label="Select Date Range"
                rules={[{ required: true, message: "Please select date range" }]}
              >
                <RangePicker className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label=" ">
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} className="w-full">
                  Search Salary Records
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Summary Cards */}
      {selectedEmployee && (
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Employee"
                value={selectedEmployee.name}
                valueStyle={{ fontSize: '16px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Total Salary"
                value={totalSalary}
                prefix="₹"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Working Days"
                value={salaryRecords.length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="Present Days"
                value={salaryRecords.filter(r => r.presence === 'present').length}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Salary Records Table */}
      <Card title="Salary Records">
        <Table
          columns={columns}
          dataSource={salaryRecords}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
        {salaryRecords.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            <CalendarOutlined className="text-4xl mb-4" />
            <p>No salary records found for the selected criteria</p>
            <p className="text-sm">Please select an employee and date range to view salary details</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EmployeeSalary;
