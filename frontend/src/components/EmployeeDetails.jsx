import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Descriptions,
  Table,
  Tag,
  Statistic,
  Timeline,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Tabs,
  List,
  Empty,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  CarOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [dailyEntries, setDailyEntries] = useState([]);
  const [sites, setSites] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [statistics, setStatistics] = useState({
    totalDaysWorked: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalSalaryPaid: 0,
    totalAdvanceTaken: 0,
    currentBalance: 0,
    uniqueSites: 0,
    uniqueVehicles: 0,
  });

  // Fetch employee details
  const fetchEmployeeDetails = async () => {
    setLoading(true);
    try {
      const [sitesRes, vehiclesRes] = await Promise.all([
        api.get("/api/sites"),
        api.get("/api/vehicles"),
      ]);
      const sitesData = sitesRes.data.data || [];
      const vehiclesData = vehiclesRes.data.data || [];
      setSites(sitesData);
      setVehicles(vehiclesData);

      // Try history endpoint first
      try {
        const historyRes = await api.get(`/api/employeeLists/${id}/history`);
        const historyData = historyRes.data.data;
        setEmployee(historyData.employee);
        setAttendanceRecords(historyData.employee.attendances || []);
        setDailyEntries(historyData.dailyEntries || []);
        setStatistics(historyData.statistics);
        return;
      } catch (historyErr) {
        // Fallback to basic employee data if history not available
        if (historyErr?.response?.status === 404) {
          const empRes = await api.get(`/api/employeeLists/${id}`);
          const emp = empRes.data.data;
          if (!emp) throw historyErr;
          setEmployee(emp);
          setAttendanceRecords([]);
          setDailyEntries([]);
          setStatistics({
            totalDaysWorked: 0,
            totalPresent: 0,
            totalAbsent: 0,
            totalSalaryPaid: 0,
            totalAdvanceTaken: emp.advancedAmount || 0,
            currentBalance: emp.remainingAmount || 0,
            uniqueSites: 0,
            uniqueVehicles: 0,
          });
        } else {
          throw historyErr;
        }
      }
    } catch (err) {
      console.error("Error fetching employee details:", err);
      message.error("Failed to fetch employee details");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchEmployeeDetails();
  }, [id]);

  // Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee Report - ${employee?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .section { margin-bottom: 30px; }
            .info-row { margin: 10px 0; }
            .info-label { font-weight: bold; display: inline-block; width: 150px; }
            .statistics { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
            .stat-box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; min-width: 150px; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1890ff; }
            .stat-label { color: #666; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Employee Report: ${employee?.name}</h1>
          
          <div class="section">
            <h2>Personal Information</h2>
            <div class="info-row">
              <span class="info-label">Employee ID:</span> ${employee?.empId}
            </div>
            <div class="info-row">
              <span class="info-label">Designation:</span> ${employee?.designation || 'N/A'}
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span> ${employee?.phone || 'N/A'}
            </div>
            <div class="info-row">
              <span class="info-label">Joining Date:</span> ${employee?.joiningDate ? dayjs(employee.joiningDate).format('DD/MM/YYYY') : 'N/A'}
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span> ${employee?.status}
            </div>
          </div>

          <div class="section">
            <h2>Statistics</h2>
            <div class="statistics">
              <div class="stat-box">
                <div class="stat-value">${statistics.totalDaysWorked}</div>
                <div class="stat-label">Total Days Worked</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">₹${statistics.totalSalaryPaid}</div>
                <div class="stat-label">Total Salary Paid</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">₹${statistics.totalAdvanceTaken}</div>
                <div class="stat-label">Total Advance</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">₹${statistics.currentBalance}</div>
                <div class="stat-label">Current Balance</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Attendance History</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Work Status</th>
                  <th>Salary</th>
                  <th>Site</th>
                  <th>Machine</th>
                </tr>
              </thead>
              <tbody>
                ${attendanceRecords.slice(0, 20).map(record => `
                  <tr>
                    <td>${dayjs(record.date).format('DD/MM/YYYY')}</td>
                    <td>${record.presence}</td>
                    <td>${record.workStatus || 'N/A'}</td>
                    <td>₹${record.salary || 0}</td>
                    <td>${sites.find(s => s.id === record.siteId)?.siteName || 'N/A'}</td>
                    <td>${vehicles.find(v => v.id === record.vehicleId)?.vehicleNumber || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Attendance columns
  const attendanceColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: "Presence",
      dataIndex: "presence",
      key: "presence",
      render: (presence) => (
        <Tag color={presence === "present" ? "green" : "red"}>
          {presence === "present" ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          {" "}{presence.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Work Status",
      dataIndex: "workStatus",
      key: "workStatus",
      render: (status) => status || "-",
    },
    {
      title: "Salary",
      dataIndex: "salary",
      key: "salary",
      render: (salary) => `₹${salary || 0}`,
    },
    {
      title: "Site",
      dataIndex: "siteId",
      key: "site",
      render: (siteId) => {
        const site = sites.find(s => s.id === siteId);
        return site ? site.siteName : "-";
      },
    },
    {
      title: "Machine",
      dataIndex: "vehicleId",
      key: "vehicle",
      render: (vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? `${vehicle.vehicleNumber} (${vehicle.vehicleType})` : "-";
      },
    },
  ];

  // Daily entries columns
  const dailyEntryColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Ref No",
      dataIndex: "refNo",
      key: "refNo",
    },
    {
      title: "Site",
      key: "site",
      render: (_, record) => {
        const site = sites.find(s => s.id === record.siteId);
        return site ? site.siteName : "-";
      },
    },
    {
      title: "Machine",
      key: "vehicle",
      render: (_, record) => {
        const vehicle = vehicles.find(v => v.id === record.vehicleId);
        return vehicle ? `${vehicle.vehicleNumber} (${vehicle.vehicleType})` : "-";
      },
    },
    {
      title: "Meter",
      dataIndex: "meter",
      key: "meter",
      render: (meter) => meter || 0,
    },
    {
      title: "Diesel Used",
      dataIndex: "dieselUsed",
      key: "dieselUsed",
      render: (diesel) => `${diesel || 0} L`,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return (
      <Empty
        description="Employee not found"
        style={{ marginTop: "50px" }}
      >
        <Button type="primary" onClick={() => navigate("/employee/list")}>
          Back to Employees
        </Button>
      </Empty>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/employee/list")}
          >
            Back
          </Button>
          <Title level={2} className="mb-0">
            Employee Details
          </Title>
        </div>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={exportToPDF}
        >
          Export PDF
        </Button>
      </div>

      {/* Employee Info Card */}
      <Card className="mb-6">
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <UserOutlined className="text-2xl text-blue-600" />
              </div>
              <div>
                <Title level={3} className="mb-0">{employee.name}</Title>
                <Text type="secondary">{employee.empId}</Text>
              </div>
            </div>
            <Descriptions column={1}>
              <Descriptions.Item label="Designation">
                {employee.designation || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {employee.phone || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Joining Date">
                {employee.joiningDate ? dayjs(employee.joiningDate).format("DD/MM/YYYY") : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={employee.status === "active" ? "green" : "red"}>
                  {employee.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} lg={12}>
            <Title level={4}>Financial Summary</Title>
            <Descriptions column={1}>
              <Descriptions.Item label="Total Advance Taken">
                <Text strong>₹{employee.advancedAmount || 0}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Remaining Balance">
                <Text strong type={employee.remainingAmount > 0 ? "success" : "danger"}>
                  ₹{employee.remainingAmount || 0}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Total Salary Paid">
                <Text strong>₹{statistics.totalSalaryPaid}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Amount Settled">
                <Text strong>
                  ₹{(employee.advancedAmount || 0) - (employee.remainingAmount || 0)}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Days Worked"
              value={statistics.totalDaysWorked}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Days Present"
              value={statistics.totalPresent}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Days Absent"
              value={statistics.totalAbsent}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Attendance %"
              value={statistics.totalDaysWorked > 0 
                ? ((statistics.totalPresent / (statistics.totalPresent + statistics.totalAbsent)) * 100).toFixed(1)
                : 0}
              suffix="%"
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Sites Worked"
              value={statistics.uniqueSites}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Machines Used"
              value={statistics.uniqueVehicles}
              prefix={<CarOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Advance"
              value={statistics.totalAdvanceTaken}
              prefix="₹"
              valueStyle={{ color: "#13c2c2" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Balance"
              value={statistics.currentBalance}
              prefix="₹"
              valueStyle={{ color: statistics.currentBalance > 0 ? "#52c41a" : "#cf1322" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs for detailed information */}
      <Card>
        <Tabs defaultActiveKey="attendance">
          <TabPane tab="Attendance History" key="attendance">
            <Table
              columns={attendanceColumns}
              dataSource={attendanceRecords}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </TabPane>

          <TabPane tab="Daily Entries" key="dailyEntries">
            {dailyEntries.length > 0 ? (
              <Table
                columns={dailyEntryColumns}
                dataSource={dailyEntries}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            ) : (
              <Empty description="No daily entries found for this employee" />
            )}
          </TabPane>

          <TabPane tab="Work Timeline" key="timeline">
            <Timeline mode="left">
              {attendanceRecords
                .filter(a => a.presence === "present")
                .slice(0, 10)
                .map((record, index) => (
                  <Timeline.Item
                    key={index}
                    color={record.workStatus === "working" ? "green" : "blue"}
                    label={dayjs(record.date).format("DD/MM/YYYY")}
                  >
                    <p>
                      <strong>Status:</strong> {record.workStatus || "N/A"}
                    </p>
                    <p>
                      <strong>Salary:</strong> ₹{record.salary || 0}
                    </p>
                    {record.siteId && (
                      <p>
                        <strong>Site:</strong> {sites.find(s => s.id === record.siteId)?.siteName || "N/A"}
                      </p>
                    )}
                    {record.vehicleId && (
                      <p>
                        <strong>Machine:</strong> {vehicles.find(v => v.id === record.vehicleId)?.vehicleNumber || "N/A"}
                      </p>
                    )}
                  </Timeline.Item>
                ))}
            </Timeline>
          </TabPane>

          <TabPane tab="Summary" key="summary">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card title="Work Distribution by Site" size="small">
                  <List
                    dataSource={[...new Set(attendanceRecords.map(a => a.siteId).filter(Boolean))]}
                    renderItem={siteId => {
                      const site = sites.find(s => s.id === siteId);
                      const count = attendanceRecords.filter(a => a.siteId === siteId).length;
                      return (
                        <List.Item>
                          <Text>{site?.siteName || "Unknown"}</Text>
                          <Tag>{count} days</Tag>
                        </List.Item>
                      );
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="Machine Usage" size="small">
                  <List
                    dataSource={[...new Set([
                      ...attendanceRecords.map(a => a.vehicleId),
                      ...dailyEntries.map(e => e.vehicleId)
                    ].filter(Boolean))]}
                    renderItem={vehicleId => {
                      const vehicle = vehicles.find(v => v.id === vehicleId);
                      const count = attendanceRecords.filter(a => a.vehicleId === vehicleId).length +
                                   dailyEntries.filter(e => e.vehicleId === vehicleId).length;
                      return (
                        <List.Item>
                          <Text>{vehicle?.vehicleNumber || "Unknown"}</Text>
                          <Tag>{count} times</Tag>
                        </List.Item>
                      );
                    }}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default EmployeeDetails;
