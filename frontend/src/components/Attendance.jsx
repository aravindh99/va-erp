import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Table,
  Tag,
  Space,
  Form,
  Select,
  Card,
  Popconfirm,
  DatePicker,
  InputNumber,
  message,
  Typography,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  SaveOutlined,
  FilePdfOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit, canDelete } from "../service/auth";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const Attendance = () => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [attendanceData, setAttendanceData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // View attendance states
  const [viewDate, setViewDate] = useState(dayjs());
  const [viewSite, setViewSite] = useState('');
  const [viewRecords, setViewRecords] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  // Inline edit state for View table
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEdit, setInlineEdit] = useState(null);
  const [inlineSaving, setInlineSaving] = useState(false);

  // Fetch attendance records for selected date (for adding attendance)
  const fetchRecords = async (date = selectedDate) => {
    setLoading(true);
    try {
      const dateStr = date.format("YYYY-MM-DD");
      const res = await api.get(`/api/employeeAttendance?date=${dateStr}`);
      setRecords(res.data.data || []);
      
      // Initialize attendance data for all employees
      const initialData = {};
      employees.forEach(emp => {
        const existingRecord = res.data.data?.find(r => r.employeeId === emp.id);
        initialData[emp.id] = {
          presence: existingRecord?.presence || 'present',
          workStatus: existingRecord?.workStatus || 'working',
          salary: existingRecord?.salary || 0,
          siteId: existingRecord?.siteId || '',
          vehicleId: existingRecord?.vehicleId || '',
          recordId: existingRecord?.id || null
        };
      });
      setAttendanceData(initialData);
    } catch (err) {
      message.error("Error fetching attendance");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance records for viewing
  const fetchViewRecords = async (date = viewDate, siteId = viewSite) => {
    setViewLoading(true);
    try {
      const dateStr = date.format("YYYY-MM-DD");
      
      let url = `/api/employeeAttendance?date=${dateStr}`;
      if (siteId) {
        url += `&siteId=${siteId}`;
      }
      
      const res = await api.get(url);
      const records = res.data.data || [];
      
      setViewRecords(records);
    } catch (err) {
      message.error("Error fetching attendance records");
      setViewRecords([]);
    } finally {
      setViewLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/employeeLists");
      setEmployees(res.data.data || []);
    } catch (err) {
      message.error("Error fetching employees");
    }
  };

  const fetchSites = async () => {
    try {
      const res = await api.get("/api/sites");
      setSites(res.data.data || []);
    } catch (err) {
      message.error("Error fetching sites");
    }
  };

  const fetchVehicles = async () => {
    try {
      const res = await api.get("/api/vehicles");
      setVehicles(res.data.data || []);
    } catch (err) {
      message.error("Error fetching vehicles");
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchEmployees(),
        fetchSites(),
        fetchVehicles()
      ]);
      fetchRecords();
      fetchViewRecords();
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (employees.length > 0 && selectedDate) {
      fetchRecords();
    }
  }, [employees.length, selectedDate]);

  // Update attendance data for an employee
  const updateAttendanceData = (employeeId, field, value) => {
    setAttendanceData(prev => {
      const prevEntry = prev[employeeId] || {};
      const nextEntry = { ...prevEntry, [field]: value };

      // Business rule: if absent, force non-working (but allow salary to be set manually)
      if (field === 'presence' && value === 'absent') {
        nextEntry.workStatus = 'non-working';
      }

      return {
        ...prev,
        [employeeId]: nextEntry,
      };
    });
  };

  // Save all attendance records
  const saveAllAttendance = async () => {
    setSaving(true);
    try {
      const currentUser = localStorage.getItem("username") || "Unknown";
      const dateStr = selectedDate.format("YYYY-MM-DD");
      
      const promises = Object.entries(attendanceData).map(async ([employeeId, data]) => {
        const payload = {
          employeeId,
          presence: data.presence || 'present',
          workStatus: data.workStatus || 'working',
          salary: Number(data.salary) || 0,
          date: dateStr,
          siteId: data.siteId || null,
          vehicleId: data.vehicleId || null,
        };

        if (data.recordId) {
          // Update existing record
          payload.updatedBy = currentUser;
          return api.put(`/api/employeeAttendance/${data.recordId}`, payload);
        } else {
          // Create new record
          payload.createdBy = currentUser;
          return api.post("/api/employeeAttendance", payload);
        }
      });

      await Promise.all(promises);
      message.success("Attendance saved successfully!");
      // Refresh attendance and employees to reflect updated remaining amounts
      fetchRecords();
      fetchEmployees();
      fetchViewRecords();
    } catch (err) {
      message.error("Error saving attendance");
    } finally {
      setSaving(false);
    }
  };

  // Handle individual record edit
  const handleEdit = (record) => {
    if (!record || !record.id || !record.employeeId) {
      message.error("Invalid record to edit");
      return;
    }
    setInlineEditId(record.id);
    setExpandedRowKeys([record.id]);
    setInlineEdit({
      id: record.id,
      employeeId: record.employeeId,
      date: record.date,
      presence: record.presence || 'present',
      workStatus: record.workStatus || 'working',
      salary: record.salary || 0,
      siteId: record.siteId || '',
      vehicleId: record.vehicleId || '',
    });
  };

  const handleInlineField = (field, value) => {
    setInlineEdit(prev => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === 'presence' && value === 'absent') {
        next.workStatus = 'non-working';
      }
      return next;
    });
  };

  const handleInlineCancel = () => {
    setInlineEditId(null);
    setInlineEdit(null);
    setExpandedRowKeys([]);
  };

  const handleInlineSave = async () => {
    if (!inlineEdit || !inlineEdit.id) return;
    setInlineSaving(true);
    try {
      const payload = {
        employeeId: inlineEdit.employeeId,
        presence: inlineEdit.presence,
        workStatus: inlineEdit.workStatus,
        salary: Number(inlineEdit.salary) || 0,
        date: dayjs(inlineEdit.date).format('YYYY-MM-DD'),
        siteId: inlineEdit.siteId || null,
        vehicleId: inlineEdit.vehicleId || null,
      };
      await api.put(`/api/employeeAttendance/${inlineEdit.id}`, payload);
      message.success('Attendance updated');
      handleInlineCancel();
      await fetchViewRecords(viewDate, viewSite);
      await fetchEmployees();
    } catch (e) {
      message.error('Failed to update attendance');
    } finally {
      setInlineSaving(false);
    }
  };

  // Handle hard delete
  const handleDelete = async (id) => {
    try {
      if (!id) {
        message.error("Missing record id for delete");
        return;
      }
      await api.delete(`/api/employeeAttendance/${id}/hard`);
      message.success("Record deleted successfully");
      fetchRecords();
      fetchViewRecords();
    } catch (err) {
      message.error("Error deleting record");
    }
  };

  // Get all employees for adding attendance (no filters)
  const getFilteredEmployees = () => {
    return employees;
  };

  // PDF Export for view records
  const exportToPDF = () => {
    const selectedSiteName = viewSite ? sites.find(s => s.id === viewSite)?.siteName : 'All Sites';
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Records - ${viewDate.format("DD/MM/YYYY")}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .filters { margin-bottom: 20px; }
            .filter-item { margin: 5px 0; }
            .status-present { color: green; font-weight: bold; }
            .status-absent { color: red; font-weight: bold; }
            .status-working { color: blue; font-weight: bold; }
            .status-non-working { color: orange; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Attendance Records</h1>
            <p>Date: ${viewDate.format("DD/MM/YYYY")}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="filters">
            <h3>Filters Applied:</h3>
            <div class="filter-item"><strong>Site:</strong> ${selectedSiteName}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Emp ID</th>
                <th>Presence</th>
                <th>Work Status</th>
                <th>Salary</th>
                <th>Site</th>
                <th>Vehicle</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${viewRecords
                .map(record => {
                  const employee = employees.find(emp => emp.id === record.employeeId);
                  const site = sites.find(s => s.id === record.siteId);
                  const vehicle = vehicles.find(v => v.id === record.vehicleId);
                  return `
                    <tr>
                      <td>${employee?.name || "-"}</td>
                      <td>${employee?.empId || "-"}</td>
                      <td class="status-${record.presence}">${record.presence || "-"}</td>
                      <td class="status-${record.workStatus?.replace('-', '')}">${record.workStatus || "-"}</td>
                      <td>₹${record.salary?.toLocaleString() || 0}</td>
                      <td>${site?.siteName || "-"}</td>
                      <td>${vehicle ? `${vehicle.vehicleNumber} (${vehicle.vehicleType})` : "-"}</td>
                      <td>${dayjs(record.date).format('DD/MM/YYYY')}</td>
                    </tr>`;
                })
                .join("")}
            </tbody>
          </table>
          <div style="margin-top: 20px; text-align: center; color: #666;">
            <p>Total Records: ${viewRecords.length}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Calculate statistics based on all employees
  const allEmployees = getFilteredEmployees();
  const presentCount = allEmployees.filter(emp => attendanceData[emp.id]?.presence === 'present').length;
  const workingCount = allEmployees.filter(emp => attendanceData[emp.id]?.workStatus === 'working').length;
  const totalEmployees = allEmployees.length;
  const attendancePercentage = totalEmployees > 0 ? (presentCount / totalEmployees) * 100 : 0;

  // Table columns for viewing attendance records
  const viewColumns = [
    {
      title: "Employee",
      key: "employeeName",
      render: (_, record) => {
        const employee = employees.find(emp => emp.id === record.employeeId);
        return (
          <div>
            <div className="font-medium">{employee?.name || 'Unknown'}</div>
            <div className="text-sm text-gray-500">ID: {employee?.empId || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      title: "Presence",
      key: "presence",
      render: (_, record) => (
        <Tag color={record.presence === 'present' ? 'green' : 'red'}>
          {record.presence === 'present' ? (
            <><CheckCircleOutlined /> Present</>
          ) : (
            <><CloseCircleOutlined /> Absent</>
          )}
        </Tag>
      ),
    },
    {
      title: "Work Status",
      key: "workStatus",
      render: (_, record) => (
        <Tag color={record.workStatus === 'working' ? 'blue' : 'orange'}>
          {record.workStatus || 'N/A'}
        </Tag>
      ),
    },
    {
      title: "Salary",
      key: "salary",
      render: (_, record) => (
        <Text strong>₹{record.salary?.toLocaleString() || 0}</Text>
      ),
    },
    {
      title: "Advance Amount",
      key: "advancedAmount",
      render: (_, record) => {
        const employee = employees.find(emp => emp.id === record.employeeId);
        const advance = employee?.advancedAmount || 0;
        return (
          <Text 
            strong 
            style={{ color: advance > 0 ? '#ff4d4f' : '#52c41a' }}
          >
            ₹{advance.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: "Site",
      key: "site",
      render: (_, record) => {
        const site = sites.find(s => s.id === record.siteId);
        return <Text>{site?.siteName || '-'}</Text>;
      },
    },
    {
      title: "Vehicle",
      key: "vehicle",
      render: (_, record) => {
        const vehicle = vehicles.find(v => v.id === record.vehicleId);
        return <Text>{vehicle ? `${vehicle.vehicleNumber} (${vehicle.vehicleType})` : '-'}</Text>;
      },
    },
    {
      title: "Date",
      key: "date",
      render: (_, record) => (
        <Text>{dayjs(record.date).format('DD/MM/YYYY')}</Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {canEdit() && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            >
              Edit
            </Button>
          )}
          {canDelete() && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              size="small"
            >
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderInlineEditor = (record) => {
    if (!inlineEdit || inlineEditId !== record.id) return null;
    return (
      <div className="bg-gray-50 rounded-md p-4">
        <Row gutter={12}>
          <Col xs={24} sm={8}>
            <Text strong>Date</Text>
            <DatePicker
              className="w-full mt-1"
              value={dayjs(inlineEdit.date)}
              onChange={(d) => handleInlineField('date', d)}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col xs={24} sm={6}>
            <Text strong>Presence</Text>
            <Select
              className="w-full mt-1"
              value={inlineEdit.presence}
              onChange={(v) => handleInlineField('presence', v)}
            >
              <Select.Option value="present">Present</Select.Option>
              <Select.Option value="absent">Absent</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Text strong>Work Status</Text>
            <Select
              className="w-full mt-1"
              value={inlineEdit.workStatus}
              onChange={(v) => handleInlineField('workStatus', v)}
              disabled={inlineEdit.presence === 'absent'}
            >
              <Select.Option value="working">Working</Select.Option>
              <Select.Option value="non-working">Non-working</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Text strong>Salary</Text>
            <InputNumber
              className="w-full mt-1"
              value={inlineEdit.salary}
              onChange={(v) => handleInlineField('salary', v)}
              min={0}
              step={0.01}
              precision={2}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Col>
        </Row>
        <Row gutter={12} className="mt-3">
          <Col xs={24} sm={12}>
            <Text strong>Site</Text>
            <Select
              className="w-full mt-1"
              value={inlineEdit.siteId || ''}
              onChange={(v) => handleInlineField('siteId', v)}
              allowClear
            >
              {sites.map(site => (
                <Select.Option key={site.id} value={site.id}>{site.siteName}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong>Vehicle</Text>
            <Select
              className="w-full mt-1"
              value={inlineEdit.vehicleId || ''}
              onChange={(v) => handleInlineField('vehicleId', v)}
              allowClear
            >
              {vehicles.map(vehicle => (
                <Select.Option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicleNumber} ({vehicle.vehicleType})
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>
        <div className="mt-4 flex gap-2">
          <Button type="primary" onClick={handleInlineSave} loading={inlineSaving}>Save</Button>
          <Button onClick={handleInlineCancel}>Cancel</Button>
        </div>
      </div>
    );
  };

  // Table columns for the new list-based system
  const columns = [
    {
      title: "Employee",
      key: "employeeName",
      render: (_, employee) => (
        <div>
          <div className="font-medium">{employee.name}</div>
          <div className="text-sm text-gray-500">ID: {employee.empId}</div>
        </div>
      ),
    },
    {
      title: "Presence",
      key: "presence",
      render: (_, employee) => {
        const data = attendanceData[employee.id] || {};
        return (
          <Select
            value={data.presence || 'present'}
            onChange={(value) => updateAttendanceData(employee.id, 'presence', value)}
            style={{ width: 120 }}
            size="small"
          >
            <Select.Option value="present">
              <CheckCircleOutlined style={{ color: 'green' }} /> Present
            </Select.Option>
            <Select.Option value="absent">
              <CloseCircleOutlined style={{ color: 'red' }} /> Absent
            </Select.Option>
          </Select>
        );
      },
    },
    {
      title: "Work Status",
      key: "workStatus",
      render: (_, employee) => {
        const data = attendanceData[employee.id] || {};
        return (
          <Select
            value={data.workStatus || 'working'}
            onChange={(value) => updateAttendanceData(employee.id, 'workStatus', value)}
            style={{ width: 120 }}
            size="small"
            disabled={(attendanceData[employee.id]?.presence || 'present') === 'absent'}
          >
            <Select.Option value="working">Working</Select.Option>
            <Select.Option value="non-working">Non-working</Select.Option>
          </Select>
        );
      },
    },
    {
      title: "Salary",
      key: "salary",
      render: (_, employee) => {
        const data = attendanceData[employee.id] || {};
        return (
          <InputNumber
            value={data.salary || 0}
            onChange={(value) => updateAttendanceData(employee.id, 'salary', value)}
            style={{ width: 100 }}
            size="small"
            min={0}
            step={0.01}
            precision={2}
            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/₹\s?|(,*)/g, '')}
          />
        );
      },
    },
    {
      title: "Site",
      key: "site",
      render: (_, employee) => {
        const data = attendanceData[employee.id] || {};
        return (
          <Select
            value={data.siteId || ''}
            onChange={(value) => updateAttendanceData(employee.id, 'siteId', value)}
            style={{ width: 150 }}
            size="small"
            placeholder="Select site"
            allowClear
          >
            {sites.map(site => (
              <Select.Option key={site.id} value={site.id}>
                {site.siteName}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Vehicle",
      key: "vehicle",
      render: (_, employee) => {
        const data = attendanceData[employee.id] || {};
        return (
          <Select
            value={data.vehicleId || ''}
            onChange={(value) => updateAttendanceData(employee.id, 'vehicleId', value)}
            style={{ width: 150 }}
            size="small"
            placeholder="Select vehicle"
            allowClear
          >
            {vehicles.map(vehicle => (
              <Select.Option key={vehicle.id} value={vehicle.id}>
                {vehicle.vehicleNumber} ({vehicle.vehicleType})
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Advance Amount",
      key: "advancedAmount",
      render: (_, employee) => {
        const advance = employee.advancedAmount || 0;
        return (
          <Text 
            strong 
            style={{ 
              color: advance > 0 ? '#ff4d4f' : '#52c41a',
              backgroundColor: advance > 0 ? '#fff2f0' : '#f6ffed',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          >
            ₹{advance.toLocaleString()}
          </Text>
        );
      },
    },
  ];

  return (
    <div className="space-y-8">
      {/* SECTION 1: ADD ATTENDANCE */}
      <div className="bg-white rounded-lg p-6">
        <div className="mb-6">
          <Title level={2} className="mb-2">Mark Daily Attendance</Title>
          <Text type="secondary">Mark attendance for all employees for the selected date</Text>
        </div>

        {/* Date Selection and Statistics */}
        <Card className="mb-6">
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Text strong>Select Date:</Text>
              <DatePicker
                className="w-full mt-1"
                value={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  fetchRecords(date);
                }}
                format="DD/MM/YYYY"
              />
            </Col>
            <Col xs={24} sm={16}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Total Employees"
                    value={totalEmployees}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Present"
                    value={presentCount}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Working"
                    value={workingCount}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Attendance %"
                    value={Math.round(attendancePercentage)}
                    suffix="%"
                    valueStyle={{ 
                      color: attendancePercentage >= 80 ? '#3f8600' : 
                             attendancePercentage >= 60 ? '#faad14' : '#cf1322' 
                    }}
                  />
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>


        {/* Attendance Table for Adding */}
        <Table
          columns={columns}
          dataSource={allEmployees}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1000 }}
          size="small"
          className="attendance-table"
        />

        {/* Save Button at Bottom */}
        {canEdit() && (
          <div className="mt-6 text-center">
            <Button
              icon={<SaveOutlined />}
              onClick={saveAllAttendance}
              type="primary"
              loading={saving}
              size="large"
              className="min-w-[200px]"
            >
              Save All Attendance
            </Button>
          </div>
        )}
      </div>

      {/* SECTION 2: VIEW ATTENDANCE RECORDS */}
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="mb-2">View Attendance Records</Title>
            <Text type="secondary">View attendance records for any date with site filtering</Text>
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

        {/* View Filters */}
        <Card className="mb-6">
          <Row gutter={16} align="middle">
            <Col xs={24} sm={8}>
              <Text strong>Select Date to View:</Text>
              <DatePicker
                className="w-full mt-1"
                value={viewDate}
                onChange={(date) => {
                  setViewDate(date);
                  fetchViewRecords(date, viewSite);
                }}
                format="DD/MM/YYYY"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Text strong>Filter by Site:</Text>
              <Select
                className="w-full mt-1"
                placeholder="Select site to filter"
                value={viewSite}
                onChange={(siteId) => {
                  setViewSite(siteId);
                  fetchViewRecords(viewDate, siteId);
                }}
                allowClear
              >
                {sites.map(site => (
                  <Select.Option key={site.id} value={site.id}>
                    {site.siteName}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Text strong>Actions:</Text>
              <div className="mt-1">
                <Button
                  onClick={() => {
                    setViewSite('');
                    fetchViewRecords(viewDate, '');
                  }}
                  className="w-full"
                  icon={<ClearOutlined />}
                >
                  Clear Filters
                </Button>
              </div>
            </Col>
          </Row>
          {(viewSite) && (
            <div className="mt-4">
              <Text type="secondary">
                Showing records for {sites.find(s => s.id === viewSite)?.siteName} on {viewDate.format('DD/MM/YYYY')}
              </Text>
            </div>
          )}
        </Card>

        {/* View Records Table with inline editor */}
        <Table
          columns={viewColumns}
          dataSource={viewRecords}
          rowKey="id"
          loading={viewLoading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1000 }}
          size="small"
          className="view-attendance-table"
          expandable={{
            expandedRowKeys,
            onExpand: (expanded, record) => {
              if (!expanded) {
                handleInlineCancel();
              } else {
                handleEdit(record);
              }
            },
            expandedRowRender: (record) => renderInlineEditor(record),
          }}
        />
        
      </div>
    </div>
  );
};

export default Attendance;
