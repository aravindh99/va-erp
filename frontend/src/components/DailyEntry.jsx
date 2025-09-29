import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Table,
  Tag,
  Space,
  Form,
  Select,
  InputNumber,
  Switch,
  Card,
  Popconfirm,
  DatePicker,
  Alert,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Collapse,
  Tooltip,
  Progress,
  Modal,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CarOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit, canDelete } from "../service/auth";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Panel } = Collapse;

const DailyEntry = () => {
  const [form] = Form.useForm();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [sites, setSites] = useState([]);
  const [machines, setMachines] = useState([]);
  const [compressors, setCompressors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  });
  const [notifications, setNotifications] = useState([]);
  const [items, setItems] = useState([]);
  const [fittedItems, setFittedItems] = useState([]);
  // RemovedItems deprecated: removal managed within fitted items UI
  const [removedItems, setRemovedItems] = useState([]); // kept to avoid runtime errors; no longer rendered
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedCompressor, setSelectedCompressor] = useState(null);
  const [serviceAlerts, setServiceAlerts] = useState([]);
  const [rpmValues, setRpmValues] = useState({
    vehicleOpening: 0,
    vehicleClosing: 0,
    compressorOpening: 0,
    compressorClosing: 0,
  });
  const [showItemForm, setShowItemForm] = useState(false);
  const [showRemoveItemForm, setShowRemoveItemForm] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [fittedItemsList, setFittedItemsList] = useState([]);

  // Fetch data
  const fetchEntries = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      console.log("Fetching daily entries with:", { page, limit });
      let res;
      
      try {
        res = await api.get(`/api/dailyEntries?page=${page}&limit=${limit}`);
        console.log("Daily entries response (with pagination):", res.data);
      } catch (paginationError) {
        console.log("Pagination not supported, trying without pagination");
        res = await api.get("/api/dailyEntries");
        console.log("Daily entries response (without pagination):", res.data);
      }
      
      setEntries(res.data.data || []);
      setPagination(prev => ({
        ...prev,
        current: res.data.page || page,
        total: res.data.total || (res.data.data?.length || 0),
        pageSize: res.data.limit || limit,
      }));
    } catch (err) {
      console.error("Error fetching daily entries", err);
      setEntries([]);
      message.error(`Failed to fetch daily entries: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await api.get("/api/sites");
      setSites(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sites", err);
    }
  };

  const fetchMachines = async () => {
    try {
      const res = await api.get("/api/vehicles");
      setMachines(res.data.data || []);
    } catch (err) {
      console.error("Error fetching machines", err);
    }
  };

  const fetchCompressors = async () => {
    try {
      const res = await api.get("/api/compressors");
      setCompressors(res.data.data || []);
    } catch (err) {
      console.error("Error fetching compressors", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/employeeLists");
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error("Error fetching employees", err);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await api.get("/api/items");
      setItems(res.data.data || []);
    } catch (err) {
      console.error("Error fetching items", err);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchSites();
    fetchMachines();
    fetchCompressors();
    fetchEmployees();
    fetchItems();
  }, []);

  // Auto-generate reference number
  const generateRefNo = async () => {
    try {
      const res = await api.get("/api/dailyEntries/generate-ref");
      return res.data.refNo;
    } catch (err) {
      console.error("Error generating ref number", err);
      return `VA-${Date.now()}`;
    }
  };

  // Handle vehicle selection
  const handleMachineChange = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    setSelectedMachine(machine);
    
    if (machine && machine.compressorId) {
      const compressor = compressors.find(c => c.id === machine.compressorId);
      setSelectedCompressor(compressor);
    } else {
      setSelectedCompressor(null);
    }

    // Check for service alerts
    checkServiceAlerts(machine);
  };

  // Handle RPM field changes for real-time calculation
  const handleRPMChange = (field, value) => {
    const numValue = value || 0;
    form.setFieldValue(field, numValue);
    
    // Update RPM values state for real-time calculation
    setRpmValues(prev => ({
      ...prev,
      [field === 'vehicleOpeningRPM' ? 'vehicleOpening' : 
       field === 'vehicleClosingRPM' ? 'vehicleClosing' :
       field === 'compressorOpeningRPM' ? 'compressorOpening' : 'compressorClosing']: numValue
    }));
    
    // Force form to re-render and recalculate
    setTimeout(() => {
      form.validateFields([field]);
    }, 0);
  };

  // Check service alerts for selected vehicle
  const checkServiceAlerts = (vehicle) => {
    if (!vehicle) {
      setServiceAlerts([]);
      return;
    }

    const alerts = [];

    // Check vehicle service schedule
    if (vehicle.vehicleServiceSchedule && vehicle.vehicleServiceSchedule.length > 0) {
      const sortedSchedules = [...vehicle.vehicleServiceSchedule].sort((a, b) => a - b);
      const currentRPM = vehicle.vehicleRPM || 0;
      const nextServiceRPM = sortedSchedules.find(schedule => schedule > currentRPM) || sortedSchedules[sortedSchedules.length - 1];
      const remainingRPM = nextServiceRPM - currentRPM;

      if (remainingRPM <= 0) {
        alerts.push({
          type: 'vehicle',
          message: `${vehicle.vehicleNumber} service is OVERDUE (${nextServiceRPM} RPM)`,
          priority: 'high',
          currentRPM,
          nextServiceRPM,
          remainingRPM: 0
        });
      } else if (remainingRPM <= 100) {
        alerts.push({
          type: 'vehicle',
          message: `${vehicle.vehicleNumber} service due soon (${remainingRPM} RPM remaining)`,
          priority: 'medium',
          currentRPM,
          nextServiceRPM,
          remainingRPM
        });
      }
    }

    // Check compressor service schedule
    if (vehicle.compressorId && vehicle.compressorServiceSchedule && vehicle.compressorServiceSchedule.length > 0) {
      const sortedSchedules = [...vehicle.compressorServiceSchedule].sort((a, b) => a - b);
      const currentRPM = vehicle.compressorRPM || 0;
      const nextServiceRPM = sortedSchedules.find(schedule => schedule > currentRPM) || sortedSchedules[sortedSchedules.length - 1];
      const remainingRPM = nextServiceRPM - currentRPM;

      if (remainingRPM <= 0) {
        alerts.push({
          type: 'compressor',
          message: `Compressor service is OVERDUE (${nextServiceRPM} RPM)`,
          priority: 'high',
          currentRPM,
          nextServiceRPM,
          remainingRPM: 0
        });
      } else if (remainingRPM <= 100) {
        alerts.push({
          type: 'compressor',
          message: `Compressor service due soon (${remainingRPM} RPM remaining)`,
          priority: 'medium',
          currentRPM,
          nextServiceRPM,
          remainingRPM
        });
      }
    }

    setServiceAlerts(alerts);
  };

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      const refNo = values.refNo || await generateRefNo();
      
      const payload = {
        refNo,
        date: values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        siteId: values.siteId,
        vehicleId: values.vehicleId,
        compressorId: selectedCompressor?.id,
        vehicleOpeningRPM: values.vehicleOpeningRPM || 0,
        vehicleClosingRPM: values.vehicleClosingRPM || 0,
        compressorOpeningRPM: values.compressorOpeningRPM || 0,
        compressorClosingRPM: values.compressorClosingRPM || 0,
        dieselUsed: values.dieselUsed || 0,
        vehicleHSD: values.vehicleHSD || 0,
        compressorHSD: values.compressorHSD || 0,
        noOfHoles: values.noOfHoles || 0,
        meter: values.meter || 0,
        employeeId: values.employeeId,
        additionalEmployeeIds: values.additionalEmployeeIds || [],
        vehicleServiceDone: values.vehicleServiceDone || false,
        compressorServiceDone: values.compressorServiceDone || false,
        notes: values.notes || "",
        fittedItems: fittedItems,
        removedItems: removedItems,
      };

      if (editingId) {
        console.log("Updating daily entry");
        const res = await api.put(`/api/dailyEntries/${editingId}`, payload);
        console.log("Update response:", res.data);
        setEntries(entries.map(entry => entry.id === editingId ? res.data.data : entry));
        
        if (res.data.notifications) {
          setNotifications(res.data.notifications);
          res.data.notifications.forEach(notification => {
            message.warning(notification.message);
          });
        }
      } else {
        console.log("Creating new daily entry");
        const res = await api.post("/api/dailyEntries", payload);
        console.log("Create response:", res.data);
        setEntries([res.data.data, ...entries]);
        
        if (res.data.notifications) {
          setNotifications(res.data.notifications);
          res.data.notifications.forEach(notification => {
            message.warning(notification.message);
          });
        }
      }

      setShowForm(false);
      setEditingId(null);
      form.resetFields();
      setFittedItems([]);
      setSelectedMachine(null);
      setSelectedCompressor(null);
      setServiceAlerts([]);
      fetchEntries();
    } catch (err) {
      console.error("Error saving daily entry", err);
      message.error(`Failed to save daily entry: ${err.response?.data?.message || err.message}`);
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingId(record.id);
    setShowForm(true);
    form.setFieldsValue({
      ...record,
      date: record.date ? dayjs(record.date) : null,
    });
    
    if (record.vehicleId) {
      handleVehicleChange(record.vehicleId);
    }
  };

  // Handle soft delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/dailyEntries/${id}`, { data: {} });
      setEntries(entries.filter((entry) => entry.id !== id));
    } catch (err) {
      console.error("Error deleting daily entry", err);
    }
  };


  // Simplified Table columns
  const columns = [
    { title: "Ref No", dataIndex: "refNo", key: "refNo" },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    { 
      title: "Machine", 
      key: "machine",
      render: (_, record) => {
        const machine = record.vehicle || machines.find(m => m.id === record.vehicleId);
        if (!machine) return '-';
        const name = machine.vehicleType || 'Machine';
        const number = machine.vehicleNumber || '';
        return number ? `${name} (${number})` : name;
      }
    },
    {
      title: "Site",
      key: "site",
      render: (_, record) => {
        const site = record.site || sites.find(s => s.id === record.siteId);
        return site?.siteName || '-';
      }
    },
    {
      title: "Employees",
      key: "employees",
      render: (_, record) => {
        const count = Array.isArray(record.employees) ? record.employees.length : 0;
        return count;
      }
    },
    { title: "Created By", dataIndex: "createdBy", key: "createdBy" },
    { title: "Updated By", dataIndex: "updatedBy", key: "updatedBy" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {canEdit() && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
          {canDelete() && (
            <Popconfirm
              title="Are you sure you want to delete this entry?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">Daily Entry Management</Title>
          <Text type="secondary">Track daily operations, RPM, and service status</Text>
        </div>
        <Space>
          {canEdit() && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                form.resetFields();
                setFittedItems([]);
                setRemovedItems([]);
                setSelectedMachine(null);
                setSelectedCompressor(null);
                setServiceAlerts([]);
              }}
            >
              Add Daily Entry
            </Button>
          )}
        </Space>
      </div>

      {/* Service Alerts */}
      {serviceAlerts.length > 0 && (
        <Alert
          message="Service Alerts"
          description={
            <div>
              {serviceAlerts.map((alert, index) => (
                <div key={index} className="mb-1">
                  <Text type={alert.priority === 'high' ? 'danger' : 'warning'}>
                    • {alert.message}
                  </Text>
                </div>
              ))}
            </div>
          }
          type={serviceAlerts.some(a => a.priority === 'high') ? 'error' : 'warning'}
          showIcon
          className="mb-4"
        />
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <Input.Search
          placeholder="Search by site name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: 300 }}
        />
        <Button
          onClick={() => setSearchTerm('')}
          disabled={!searchTerm}
        >
          Clear Filters
        </Button>
      </div>

      {/* Daily Entry Form */}
      {showForm && (
        <Card title={editingId ? "Edit Daily Entry" : "Add Daily Entry"} className="mb-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <Collapse defaultActiveKey={['basic', 'rpm', 'production', 'employees', 'service']}>
            {/* Basic Information */}
            <Panel header="Basic Information" key="basic">
              <Row gutter={16}>
                <Col xs={24} sm={8}>
              <Form.Item
                name="refNo"
                label="Reference Number"
                rules={[{ required: true, message: "Reference number is required" }]}
              >
                <Input placeholder="VA-001" disabled />
              </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
              <Form.Item
                name="date"
                label="Date"
                    rules={[{ required: true, message: "Please select date" }]}
                    initialValue={dayjs()}
              >
                <DatePicker className="w-full" />
              </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
              <Form.Item
                name="siteId"
                label="Site"
                    rules={[{ required: true, message: "Please select site" }]}
              >
                <Select placeholder="Select site">
                  {sites.map((site) => (
                    <Select.Option key={site.id} value={site.id}>
                      {site.siteName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
              <Form.Item
                name="vehicleId"
                label="Machine"
                rules={[{ required: true, message: "Please select machine" }]}
                  >
                    <Select 
                      placeholder="Select machine"
                      onChange={handleMachineChange}
                      showSearch
                      optionFilterProp="children"
                    >
                  {machines.map((machine) => (
                    <Select.Option key={machine.id} value={machine.id}>
                          {machine.vehicleType || machine.vehicleNumber}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="compressorId"
                    label="Compressor"
                  >
                    <Select 
                      placeholder="Select compressor"
                      disabled={!selectedCompressor}
                      value={selectedCompressor?.id}
                    >
                      {selectedCompressor && (
                        <Select.Option key={selectedCompressor.id} value={selectedCompressor.id}>
                          {selectedCompressor.compressorName} - {selectedCompressor.compressorType}
                        </Select.Option>
                      )}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* RPM Tracking */}
            <Panel header="RPM Tracking" key="rpm">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Card title={`${selectedMachine?.vehicleType || 'Machine'} RPM`} size="small">
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="vehicleOpeningRPM"
                          label="Opening RPM"
                          rules={[
                            { type: 'number', min: 0 },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const closingRPM = getFieldValue('vehicleClosingRPM');
                                if (value && closingRPM && value > closingRPM) {
                                  return Promise.reject(new Error('Opening RPM cannot be higher than Closing RPM'));
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <InputNumber 
                            className="w-full" 
                            min={0} 
                            placeholder="0"
                            onChange={(value) => handleRPMChange('vehicleOpeningRPM', value)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="vehicleClosingRPM"
                          label="Closing RPM"
                          rules={[
                            { type: 'number', min: 0 },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const openingRPM = getFieldValue('vehicleOpeningRPM');
                                if (value && openingRPM && openingRPM > value) {
                                  return Promise.reject(new Error('Closing RPM cannot be lower than Opening RPM'));
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <InputNumber 
                            className="w-full" 
                            min={0} 
                            placeholder="0"
                            onChange={(value) => handleRPMChange('vehicleClosingRPM', value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <div className="text-center">
                      <Text strong>
                        Total: {rpmValues.vehicleClosing - rpmValues.vehicleOpening} RPM
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card title="Compressor RPM" size="small">
                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="compressorOpeningRPM"
                          label="Opening RPM"
                          rules={[
                            { type: 'number', min: 0 },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const closingRPM = getFieldValue('compressorClosingRPM');
                                if (value && closingRPM && value > closingRPM) {
                                  return Promise.reject(new Error('Opening RPM cannot be higher than Closing RPM'));
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <InputNumber 
                            className="w-full" 
                            min={0} 
                            placeholder="0"
                            onChange={(value) => handleRPMChange('compressorOpeningRPM', value)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="compressorClosingRPM"
                          label="Closing RPM"
                          rules={[
                            { type: 'number', min: 0 },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                const openingRPM = getFieldValue('compressorOpeningRPM');
                                if (value && openingRPM && openingRPM > value) {
                                  return Promise.reject(new Error('Closing RPM cannot be lower than Opening RPM'));
                                }
                                return Promise.resolve();
                              },
                            }),
                          ]}
                        >
                          <InputNumber 
                            className="w-full" 
                            min={0} 
                            placeholder="0"
                            onChange={(value) => handleRPMChange('compressorClosingRPM', value)}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <div className="text-center">
                      <Text strong>
                        Total: {rpmValues.compressorClosing - rpmValues.compressorOpening} RPM
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Panel>

            {/* Production Data */}
            <Panel header="Production Data" key="production">
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="dieselUsed"
                    label="Diesel Used (L)"
                    rules={[{ type: 'number', min: 0 }]}
                  >
                    <InputNumber className="w-full" min={0} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="vehicleHSD"
                    label="Machine HSD"
                    rules={[{ type: 'number', min: 0 }]}
                  >
                    <InputNumber className="w-full" min={0} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="compressorHSD"
                    label="Compressor HSD"
                    rules={[{ type: 'number', min: 0 }]}
                  >
                    <InputNumber className="w-full" min={0} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="noOfHoles"
                    label="Number of Holes"
                    rules={[{ type: 'number', min: 0 }]}
                  >
                    <InputNumber className="w-full" min={0} placeholder="0" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="meter"
                    label="Total Production Meter"
                    rules={[{ type: 'number', min: 0 }]}
                  >
                    <InputNumber className="w-full" min={0} placeholder="0" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="notes"
                    label="Notes"
                  >
                    <Input.TextArea rows={2} placeholder="Additional notes..." />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* Employee Assignment */}
            <Panel header="Employee Assignment" key="employees">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
              <Form.Item
                name="employeeId"
                label="Primary Employee"
                    rules={[{ required: true, message: "Please select primary employee" }]}
              >
                <Select placeholder="Select primary employee">
                  {employees.map((employee) => (
                    <Select.Option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.empId})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
              <Form.Item
                    name="additionalEmployeeIds"
                label="Additional Employees"
              >
                <Select 
                  mode="multiple" 
                  placeholder="Select additional employees"
                  allowClear
                >
                  {employees.map((employee) => (
                    <Select.Option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.empId})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* Spare Parts Management */}
            <Panel header="Spare Parts Management" key="spares">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Card title="Fitted Items" size="small">
                    <div className="mb-4">
                      <Button 
                        type="dashed" 
                        onClick={() => setShowItemForm(true)}
                        className="w-full"
                        icon={<PlusOutlined />}
                      >
                        Add Spare Parts
                      </Button>
                    </div>
                    {fittedItems.length > 0 && (
                      <div className="space-y-2">
                        {fittedItems.map((item, index) => (
                          <div key={index} className="p-2 border rounded bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <Text strong>{item.itemName}</Text>
                                <br />
                                <Text type="secondary" className="text-sm">
                                  Starting RPM: {item.startingRPM || 0}
                                </Text>
                              </div>
                              <Button 
                                size="small" 
                                danger 
                                onClick={() => {
                                  setFittedItems(fittedItems.filter((_, i) => i !== index));
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </Col>
                
              </Row>
            </Panel>

            {/* Service Status */}
            <Panel header="Service Status" key="service">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Card title="Machine Service" size="small">
              <Form.Item
                name="vehicleServiceDone"
                valuePropName="checked"
              >
                      <Switch 
                        checkedChildren="Done" 
                        unCheckedChildren="Pending"
                      />
              </Form.Item>
                    {selectedMachine && (
                      <div className="mt-2">
                        <Text type="secondary" className="text-sm">
                          Current RPM: {selectedMachine.vehicleRPM || 0}
                        </Text>
                        <br />
                        <Text type="secondary" className="text-sm">
                          Next Service: {selectedMachine.vehicleServiceSchedule?.[0] || 'Not set'}
                        </Text>
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card title="Compressor Service" size="small">
              <Form.Item
                name="compressorServiceDone"
                valuePropName="checked"
              >
                      <Switch 
                        checkedChildren="Done" 
                        unCheckedChildren="Pending"
                      />
              </Form.Item>
                    {selectedCompressor && (
                      <div className="mt-2">
                        <Text type="secondary" className="text-sm">
                          Current RPM: {selectedCompressor.currentRPM || 0}
                        </Text>
                        <br />
                        <Text type="secondary" className="text-sm">
                          Next Service: {selectedMachine?.compressorServiceSchedule?.[0] || 'Not set'}
                        </Text>
            </div>
                    )}
        </Card>
                </Col>
              </Row>
            </Panel>
          </Collapse>

          <Divider />

          <div className="flex justify-end space-x-2">
            <Button onClick={() => {
              setShowForm(false);
              setEditingId(null);
              form.resetFields();
              setFittedItems([]);
              setRemovedItems([]);
              setSelectedMachine(null);
              setSelectedCompressor(null);
              setServiceAlerts([]);
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingId ? "Update Entry" : "Create Entry"}
            </Button>
          </div>
        </Form>
        </Card>
      )}

      {/* Daily Entries Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={entries.filter((entry) =>
            entry.site?.siteName?.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
              fetchEntries(page, pageSize);
            },
          }}
          size="middle"
        />
      </Card>

      {/* Add Spare Parts Modal */}
      <Modal
        title="Add Spare Parts"
        open={showItemForm}
        onCancel={() => setShowItemForm(false)}
        footer={null}
        width={800}
      >
        <div className="space-y-4">
          <div className="mb-4">
            <Text type="secondary">Select items that can be fitted to vehicles</Text>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.filter(item => item.canBeFitted).map(item => (
              <div key={item.id} className="p-3 border rounded mb-2 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <Text strong>{item.itemName}</Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      Part: {item.partNumber} | Group: {item.groupName}
                    </Text>
                    <br />
                    <Text type="secondary" className="text-sm">
                      Current RPM: {item.currentRPM || 0} | Initial RPM: {item.initialRPM || 0}
                    </Text>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => {
                      const newItem = {
                        itemId: item.id,
                        itemName: item.itemName,
                        startingRPM: item.currentRPM || 0,
                        serviceDone: false
                      };
                      setFittedItems([...fittedItems, newItem]);
                      setShowItemForm(false);
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      
    </div>
  );
};

export default DailyEntry;