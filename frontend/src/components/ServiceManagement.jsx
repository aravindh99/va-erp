import { useState, useEffect } from "react";
import {
  Button,
  Table,
  Card,
  Form,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  message,
  Modal,
  InputNumber,
  Input,
  Alert,
  Tabs,
  Statistic,
  Progress,
  Tooltip,
} from "antd";
import {
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  CarOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit } from "../service/auth";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ServiceManagement = () => {
  const [form] = Form.useForm();
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serviceAlerts, setServiceAlerts] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [serviceType, setServiceType] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("vehicles");

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, employeesRes, sitesRes, servicesRes] = await Promise.all([
        api.get("/api/vehicles"),
        api.get("/api/employeeLists"),
        api.get("/api/sites"),
        api.get("/api/services"),
      ]);
      
      const vehiclesData = vehiclesRes.data.data || [];
      setVehicles(vehiclesData);
      setEmployees(employeesRes.data.data || []);
      setSites(sitesRes.data.data || []);
      setServiceHistory(servicesRes.data.data || []);
      
      // Generate service alerts and overview
      const alerts = [];
      const vehicleServiceData = [];
      const compressorServiceData = [];
      
      // Process vehicles
      vehiclesData.forEach(vehicle => {
        // Vehicle service tracking
        if (vehicle.vehicleServiceSchedule && vehicle.vehicleServiceSchedule.length > 0) {
          const sortedSchedules = [...vehicle.vehicleServiceSchedule].sort((a, b) => a - b);
          const currentRPM = vehicle.vehicleRPM || 0;
          const nextServiceRPM = sortedSchedules.find(schedule => schedule > currentRPM) || sortedSchedules[sortedSchedules.length - 1];
          const remainingRPM = nextServiceRPM - currentRPM;
          const progress = Math.min(100, (currentRPM / nextServiceRPM) * 100);
          
          const vehicleServiceInfo = {
            id: vehicle.id,
            name: vehicle.vehicleNumber,
            type: vehicle.vehicleType,
            currentRPM,
            nextServiceRPM,
            remainingRPM,
            progress,
            status: remainingRPM <= 0 ? 'overdue' : remainingRPM <= 100 ? 'due_soon' : 'good',
            allSchedules: sortedSchedules,
            site: vehicle.site?.siteName || 'Unknown',
            brand: vehicle.brand?.brandName || 'Unknown'
          };
          
          vehicleServiceData.push(vehicleServiceInfo);
          
          if (remainingRPM <= 0) {
            alerts.push({
              type: 'vehicle',
              message: `${vehicle.vehicleNumber} service is OVERDUE (${nextServiceRPM} RPM)`,
              priority: 'high',
              item: vehicle.vehicleNumber,
              vehicleId: vehicle.id,
              remainingRPM: 0,
              currentRPM,
              nextServiceRPM,
              vehicle: vehicleServiceInfo
            });
          } else if (remainingRPM <= 100) {
            alerts.push({
              type: 'vehicle',
              message: `${vehicle.vehicleNumber} service due soon (${remainingRPM} RPM remaining)`,
              priority: 'medium',
              item: vehicle.vehicleNumber,
              vehicleId: vehicle.id,
              remainingRPM,
              currentRPM,
              nextServiceRPM,
              vehicle: vehicleServiceInfo
            });
          }
        }

        // Compressor service tracking
        if (vehicle.compressorId && vehicle.compressorServiceSchedule && vehicle.compressorServiceSchedule.length > 0) {
          const sortedSchedules = [...vehicle.compressorServiceSchedule].sort((a, b) => a - b);
          const currentRPM = vehicle.compressorRPM || 0;
          const nextServiceRPM = sortedSchedules.find(schedule => schedule > currentRPM) || sortedSchedules[sortedSchedules.length - 1];
          const remainingRPM = nextServiceRPM - currentRPM;
          const progress = Math.min(100, (currentRPM / nextServiceRPM) * 100);
          
          const compressorServiceInfo = {
            id: vehicle.compressorId,
            name: vehicle.compressor?.compressorName || 'Compressor',
            type: vehicle.compressor?.compressorType || 'Compressor',
            currentRPM,
            nextServiceRPM,
            remainingRPM,
            progress,
            status: remainingRPM <= 0 ? 'overdue' : remainingRPM <= 100 ? 'due_soon' : 'good',
            allSchedules: sortedSchedules,
            vehicleNumber: vehicle.vehicleNumber,
            vehicleId: vehicle.id,
            brand: vehicle.compressor?.brandName || 'Unknown'
          };
          
          compressorServiceData.push(compressorServiceInfo);
          
          if (remainingRPM <= 0) {
            alerts.push({
              type: 'compressor',
              message: `${vehicle.compressor?.compressorName || 'Compressor'} (${vehicle.vehicleNumber}) service is OVERDUE (${nextServiceRPM} RPM)`,
              priority: 'high',
              item: vehicle.compressor?.compressorName || 'Compressor',
              compressorId: vehicle.compressorId,
              vehicleId: vehicle.id,
              remainingRPM: 0,
              currentRPM,
              nextServiceRPM,
              vehicle: compressorServiceInfo
            });
          } else if (remainingRPM <= 100) {
            alerts.push({
              type: 'compressor',
              message: `${vehicle.compressor?.compressorName || 'Compressor'} (${vehicle.vehicleNumber}) service due soon (${remainingRPM} RPM remaining)`,
              priority: 'medium',
              item: vehicle.compressor?.compressorName || 'Compressor',
              compressorId: vehicle.compressorId,
              vehicleId: vehicle.id,
              remainingRPM,
              currentRPM,
              nextServiceRPM,
              vehicle: compressorServiceInfo
            });
          }
        }
      });

      setServiceAlerts(alerts);
    } catch (err) {
      console.error("Error fetching data", err);
      message.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle mark service as done
  const handleMarkServiceDone = async (values) => {
    try {
      const payload = {
        serviceRPM: values.serviceRPM || selectedItem.currentRPM,
        serviceType: serviceType,
        serviceDate: values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        vehicleId: selectedItem.vehicleId,
        notes: values.notes || `Service completed for ${selectedItem.item}`,
        createdBy: "admin" // This should come from auth context
      };

      // Add compressor fields if it's a compressor service
      if (serviceType === 'compressor') {
        payload.compressorId = selectedItem.compressorId;
      }

      await api.post("/api/services", payload);
      
      // Update the vehicle's current RPM to the service RPM
      const updateData = {};
      if (serviceType === 'vehicle') {
        updateData.vehicleRPM = values.serviceRPM || selectedItem.currentRPM;
        // Update next service schedule if provided
        if (values.nextServiceRPM) {
          updateData.vehicleServiceSchedule = [values.nextServiceRPM];
        } else {
          updateData.vehicleServiceSchedule = [];
        }
      } else if (serviceType === 'compressor') {
        updateData.compressorRPM = values.serviceRPM || selectedItem.currentRPM;
        // Update next service schedule if provided
        if (values.nextServiceRPM) {
          updateData.compressorServiceSchedule = [values.nextServiceRPM];
        } else {
          updateData.compressorServiceSchedule = [];
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        await api.put(`/api/vehicles/${selectedItem.vehicleId}`, updateData);
      }
      
      message.success(`${serviceType === 'vehicle' ? 'Machine' : 'Compressor'} service marked as completed`);
      
      setShowServiceModal(false);
      setSelectedItem(null);
      setServiceType(null);
      form.resetFields();
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error marking service as done", err);
      message.error("Error marking service as done");
    }
  };

  // Open service modal
  const openServiceModal = (alert) => {
    setSelectedItem(alert);
    setServiceType(alert.type);
    setShowServiceModal(true);
  };

  // Edit service schedule
  const editServiceSchedule = (item, type) => {
    setEditingSchedule({
      id: item.id,
      type: type,
      name: type === 'vehicle' ? item.vehicleNumber : item.compressorName,
      currentRPM: type === 'vehicle' ? item.vehicleRPM : item.compressorRPM,
      serviceSchedule: item.serviceSchedule || []
    });
    setShowEditScheduleModal(true);
  };

  // Handle schedule update
  const handleScheduleUpdate = async (values) => {
    try {
      const scheduleArray = values.serviceSchedule.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      
      if (editingSchedule.type === 'vehicle') {
        await api.put(`/api/vehicles/${editingSchedule.id}`, {
          serviceSchedule: scheduleArray
        });
      } else {
        await api.put(`/api/compressors/${editingSchedule.id}`, {
          serviceSchedule: scheduleArray
        });
      }
      
      message.success("Service schedule updated successfully");
      setShowEditScheduleModal(false);
      setEditingSchedule(null);
      fetchData();
    } catch (error) {
      console.error("Error updating schedule:", error);
      message.error("Error updating schedule");
    }
  };

  // Machine service columns
  const vehicleColumns = [
    {
      title: "Machine",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" className="text-sm">
            {record.type} • {record.site} • {record.brand}
          </Text>
        </div>
      ),
    },
    {
      title: "Current RPM",
      dataIndex: "currentRPM",
      key: "currentRPM",
      render: (rpm) => <Text strong>{rpm.toLocaleString()}</Text>,
    },
    {
      title: "Next Service",
      dataIndex: "nextServiceRPM",
      key: "nextServiceRPM",
      render: (rpm) => <Text strong>{rpm.toLocaleString()}</Text>,
    },
    {
      title: "Remaining",
      dataIndex: "remainingRPM",
      key: "remainingRPM",
      render: (remaining, record) => (
        <div>
          <Text type={remaining <= 0 ? "danger" : remaining <= 100 ? "warning" : "success"}>
            {remaining <= 0 ? "OVERDUE" : `${remaining.toLocaleString()} RPM`}
          </Text>
          <br />
          <Progress 
            percent={record.progress} 
            size="small" 
            status={record.status === 'overdue' ? 'exception' : record.status === 'due_soon' ? 'active' : 'success'}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const config = {
          overdue: { color: 'red', text: 'OVERDUE', icon: <ExclamationCircleOutlined /> },
          due_soon: { color: 'orange', text: 'DUE SOON', icon: <ClockCircleOutlined /> },
          good: { color: 'green', text: 'GOOD', icon: <CheckCircleOutlined /> }
        };
        const { color, text, icon } = config[status] || config.good;
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {canEdit() && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openServiceModal({
                type: 'vehicle',
                item: record.name,
                vehicleId: record.id,
                currentRPM: record.currentRPM,
                nextServiceRPM: record.nextServiceRPM,
                remainingRPM: record.remainingRPM
              })}
            >
              Mark Done
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => editServiceSchedule(record, 'vehicle')}
          >
            Edit Schedule
          </Button>
        </Space>
      ),
    },
  ];

  // Compressor service columns
  const compressorColumns = [
    {
      title: "Compressor",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" className="text-sm">
            {record.type} • Vehicle: {record.vehicleNumber} • {record.brand}
          </Text>
        </div>
      ),
    },
    {
      title: "Current RPM",
      dataIndex: "currentRPM",
      key: "currentRPM",
      render: (rpm) => <Text strong>{rpm.toLocaleString()}</Text>,
    },
    {
      title: "Next Service",
      dataIndex: "nextServiceRPM",
      key: "nextServiceRPM",
      render: (rpm) => <Text strong>{rpm.toLocaleString()}</Text>,
    },
    {
      title: "Remaining",
      dataIndex: "remainingRPM",
      key: "remainingRPM",
      render: (remaining, record) => (
        <div>
          <Text type={remaining <= 0 ? "danger" : remaining <= 100 ? "warning" : "success"}>
            {remaining <= 0 ? "OVERDUE" : `${remaining.toLocaleString()} RPM`}
          </Text>
          <br />
          <Progress 
            percent={record.progress} 
            size="small" 
            status={record.status === 'overdue' ? 'exception' : record.status === 'due_soon' ? 'active' : 'success'}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const config = {
          overdue: { color: 'red', text: 'OVERDUE', icon: <ExclamationCircleOutlined /> },
          due_soon: { color: 'orange', text: 'DUE SOON', icon: <ClockCircleOutlined /> },
          good: { color: 'green', text: 'GOOD', icon: <CheckCircleOutlined /> }
        };
        const { color, text, icon } = config[status] || config.good;
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {canEdit() && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openServiceModal({
                type: 'compressor',
                item: record.name,
                compressorId: record.id,
                vehicleId: record.vehicleId,
                currentRPM: record.currentRPM,
                nextServiceRPM: record.nextServiceRPM,
                remainingRPM: record.remainingRPM
              })}
            >
              Mark Done
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => editServiceSchedule(record, 'vehicle')}
          >
            Edit Schedule
          </Button>
        </Space>
      ),
    },
  ];

  // Service history columns
  const historyColumns = [
    {
      title: "Date",
      dataIndex: "serviceDate",
      key: "serviceDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Machine/Compressor",
      dataIndex: "vehicle",
      key: "vehicle",
      render: (vehicle, record) => (
        <div>
          <Text strong>{vehicle?.vehicleNumber || 'Unknown'}</Text>
          <br />
          <Text type="secondary" className="text-sm">
            {vehicle?.vehicleType || 'Machine'}
          </Text>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "serviceType",
      key: "serviceType",
      render: (type) => (
        <Tag color={type === 'vehicle' ? 'blue' : 'green'}>
          <ToolOutlined /> {type === 'vehicle' ? 'Machine' : 'Compressor'}
        </Tag>
      ),
    },
    {
      title: "Service RPM",
      dataIndex: "serviceRPM",
      key: "serviceRPM",
      render: (rpm) => <Text strong>{rpm.toLocaleString()}</Text>,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes) => notes || "-",
    },
  ];

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalVehicles = vehicles.length;
    const totalCompressors = vehicles.filter(v => v.compressorId).length;
    const overdueServices = serviceAlerts.filter(a => a.priority === 'high').length;
    const dueSoonServices = serviceAlerts.filter(a => a.priority === 'medium').length;
    
    return {
      totalVehicles,
      totalCompressors,
      overdueServices,
      dueSoonServices,
      totalServices: serviceHistory.length
    };
  };

  const summary = calculateSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">Service Management</Title>
          <Text type="secondary">Track and manage vehicle and compressor service schedules</Text>
        </div>
        <Button onClick={fetchData} loading={loading} icon={<SettingOutlined />}>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Vehicles"
              value={summary.totalVehicles}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Compressors"
              value={summary.totalCompressors}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Overdue Services"
              value={summary.overdueServices}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Due Soon"
              value={summary.dueSoonServices}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

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

      {/* Main Content Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Machine Services" key="vehicles">
          <Card>
            <Table
              columns={vehicleColumns}
              dataSource={vehicles.map(v => {
                if (!v.vehicleServiceSchedule || v.vehicleServiceSchedule.length === 0) return null;
                const sortedSchedules = [...v.vehicleServiceSchedule].sort((a, b) => a - b);
                const currentRPM = v.vehicleRPM || 0;
                const nextServiceRPM = sortedSchedules.find(schedule => schedule > currentRPM) || sortedSchedules[sortedSchedules.length - 1];
                const remainingRPM = nextServiceRPM - currentRPM;
                const progress = Math.min(100, (currentRPM / nextServiceRPM) * 100);
                
                return {
                  id: v.id,
                  name: v.vehicleNumber,
                  type: v.vehicleType,
                  currentRPM,
                  nextServiceRPM,
                  remainingRPM,
                  progress,
                  status: remainingRPM <= 0 ? 'overdue' : remainingRPM <= 100 ? 'due_soon' : 'good',
                  allSchedules: sortedSchedules,
                  site: v.site?.siteName || 'Unknown',
                  brand: v.brand?.brandName || 'Unknown'
                };
              }).filter(Boolean)}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Compressor Services" key="compressors">
          <Card>
            <Table
              columns={compressorColumns}
              dataSource={vehicles.map(v => {
                if (!v.compressorId || !v.compressorServiceSchedule || v.compressorServiceSchedule.length === 0) return null;
                const sortedSchedules = [...v.compressorServiceSchedule].sort((a, b) => a - b);
                const currentRPM = v.compressorRPM || 0;
                const nextServiceRPM = sortedSchedules.find(schedule => schedule > currentRPM) || sortedSchedules[sortedSchedules.length - 1];
                const remainingRPM = nextServiceRPM - currentRPM;
                const progress = Math.min(100, (currentRPM / nextServiceRPM) * 100);
                
                return {
                  id: v.compressorId,
                  name: v.compressor?.compressorName || 'Compressor',
                  type: v.compressor?.compressorType || 'Compressor',
                  currentRPM,
                  nextServiceRPM,
                  remainingRPM,
                  progress,
                  status: remainingRPM <= 0 ? 'overdue' : remainingRPM <= 100 ? 'due_soon' : 'good',
                  allSchedules: sortedSchedules,
                  vehicleNumber: v.vehicleNumber,
                  vehicleId: v.id,
                  brand: v.compressor?.brandName || 'Unknown'
                };
              }).filter(Boolean)}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Item Services" key="items">
          <Card>
            <Table
              columns={[
                {
                  title: "Item",
                  dataIndex: "itemName",
                  key: "itemName",
                  render: (name, record) => (
                    <div>
                      <Text strong>{name}</Text>
                      <br />
                      <Text type="secondary" className="text-sm">
                        {record.item?.partNumber || 'N/A'}
                      </Text>
                    </div>
                  ),
                },
                {
                  title: "Machine",
                  dataIndex: "vehicleNumber",
                  key: "vehicleNumber",
                  render: (vehicleNumber) => vehicleNumber || '-',
                },
                {
                  title: "Service RPM",
                  dataIndex: "serviceRPM",
                  key: "serviceRPM",
                  render: (rpm) => <Text strong>{rpm.toLocaleString()}</Text>,
                },
                {
                  title: "Service Date",
                  dataIndex: "serviceDate",
                  key: "serviceDate",
                  render: (date) => dayjs(date).format("DD/MM/YYYY"),
                },
                {
                  title: "Notes",
                  dataIndex: "notes",
                  key: "notes",
                  render: (notes) => notes || "-",
                },
              ]}
              dataSource={[]} // This would be populated with item services
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 600 }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Service History" key="history">
          <Card>
            <Table
              columns={historyColumns}
              dataSource={serviceHistory.map(service => ({
                ...service,
                vehicle: vehicles.find(v => v.id === service.vehicleId)
              }))}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 600 }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Service Completion Modal */}
      <Modal
        title={`Mark ${serviceType === 'vehicle' ? 'Machine' : 'Compressor'} Service as Done`}
        open={showServiceModal}
        onCancel={() => {
          setShowServiceModal(false);
          setSelectedItem(null);
          setServiceType(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {selectedItem && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <Text strong className="block mb-2">Service Details:</Text>
              <Text className="block">Item: {selectedItem.item}</Text>
              <Text className="block">Current RPM: {selectedItem.currentRPM.toLocaleString()}</Text>
              <Text className="block">Service Threshold: {selectedItem.nextServiceRPM.toLocaleString()}</Text>
              <Text className="block">Remaining: {selectedItem.remainingRPM.toLocaleString()} RPM</Text>
            </div>

            <Form layout="vertical" form={form} onFinish={handleMarkServiceDone}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="date"
                    label="Service Date"
                    rules={[{ required: true, message: "Please select service date" }]}
                    initialValue={dayjs()}
                  >
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="serviceRPM"
                    label="Service RPM (Current RPM when service is done)"
                    rules={[{ required: true, message: "Please enter service RPM" }]}
                    initialValue={selectedItem.currentRPM}
                  >
                    <InputNumber className="w-full" min={0} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="nextServiceRPM"
                    label="Next Service RPM (Optional)"
                    tooltip="Leave blank to clear next service schedule"
                  >
                    <InputNumber className="w-full" min={0} placeholder="Enter next service RPM" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="notes"
                    label="Service Notes"
                  >
                    <Input.TextArea rows={3} placeholder="Enter service notes (optional)" />
                  </Form.Item>
                </Col>
              </Row>

              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => {
                  setShowServiceModal(false);
                  setSelectedItem(null);
                  setServiceType(null);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit">
                  Mark Service as Done
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Edit Service Schedule Modal */}
      <Modal
        title={`Edit Service Schedule - ${editingSchedule?.name}`}
        open={showEditScheduleModal}
        onCancel={() => {
          setShowEditScheduleModal(false);
          setEditingSchedule(null);
        }}
        footer={null}
        width={600}
      >
        {editingSchedule && (
          <Form
            layout="vertical"
            onFinish={handleScheduleUpdate}
            initialValues={{
              serviceSchedule: editingSchedule.serviceSchedule.join(', ')
            }}
          >
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <Text strong className="block mb-2">Current Information:</Text>
              <Text className="block">Type: {editingSchedule.type === 'vehicle' ? 'Vehicle' : 'Compressor'}</Text>
              <Text className="block">Current RPM: {editingSchedule.currentRPM.toLocaleString()}</Text>
              <Text className="block">Current Schedule: {editingSchedule.serviceSchedule.join(', ')}</Text>
            </div>

            <Form.Item
              name="serviceSchedule"
              label="Service Schedule (RPM values, comma-separated)"
              rules={[{ required: true, message: "Please enter service schedule" }]}
            >
              <Input.TextArea 
                rows={3} 
                placeholder="Enter RPM values separated by commas (e.g., 1000, 2000, 3000, 5000)"
              />
            </Form.Item>

            <div className="flex justify-end space-x-2 mt-4">
              <Button onClick={() => {
                setShowEditScheduleModal(false);
                setEditingSchedule(null);
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Schedule
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ServiceManagement;