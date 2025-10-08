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
  FilePdfOutlined,
  HistoryOutlined,
  SettingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit } from "../service/auth";
import dayjs from "dayjs";

const { Title, Text } = Typography;

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
      const [vehiclesRes, compressorsRes, itemsRes, servicesRes, serviceAlertsRes, serviceHistoryRes] = await Promise.all([
        api.get("/api/vehicles"),
        api.get("/api/compressors"),
        api.get("/api/items"),
        api.get("/api/services"),
        api.get("/api/service-alerts"),
        api.get("/api/services/history"),
      ]);
      
      const vehiclesData = vehiclesRes.data.data || [];
      const compressorsData = compressorsRes.data.data || [];
      const itemsData = itemsRes.data.data || [];
      setVehicles(vehiclesData);
      setServiceHistory(serviceHistoryRes.data.data || []);
      
      // Process service alerts from backend
      const alerts = serviceAlertsRes.data.data || [];
      setServiceAlerts(alerts);
    } catch (err) {
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
        nextServiceRPM: values.nextServiceRPM || null,
        serviceType: serviceType,
        serviceDate: values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        vehicleId: selectedItem.vehicleId,
        notes: values.notes || `Service completed for ${selectedItem.item}`,
        createdBy: localStorage.getItem("username") || "admin"
      };

      // Add compressor fields if it's a compressor service
      if (serviceType === 'compressor') {
        payload.compressorId = selectedItem.compressorId;
      }
      
      // Add item instance fields if it's an item service
      if (serviceType === 'item') {
        payload.itemInstanceId = selectedItem.itemInstanceId;
      }

      await api.post("/api/services", payload);
      
      // Update the entity's current RPM and next service RPM
      const updateData = {};
      if (serviceType === 'vehicle') {
        updateData.vehicleRPM = values.serviceRPM || selectedItem.currentRPM;
        updateData.nextServiceRPM = values.nextServiceRPM || null;
        await api.put(`/api/vehicles/${selectedItem.vehicleId}`, updateData);
      } else if (serviceType === 'compressor') {
        updateData.compressorRPM = values.serviceRPM || selectedItem.currentRPM;
        updateData.nextServiceRPM = values.nextServiceRPM || null;
        await api.put(`/api/compressors/${selectedItem.compressorId}`, updateData);
      } else if (serviceType === 'item') {
        updateData.currentRPM = values.serviceRPM || selectedItem.currentRPM;
        updateData.nextServiceRPM = values.nextServiceRPM || null;
        await api.put(`/api/itemInstances/${selectedItem.itemInstanceId}`, updateData);
      }
      
      const serviceTypeNames = {
        vehicle: 'Machine',
        compressor: 'Compressor',
        item: 'Item'
      };
      message.success(`${serviceTypeNames[serviceType]} service marked as completed`);
      
      setShowServiceModal(false);
      setSelectedItem(null);
      setServiceType(null);
      form.resetFields();
      fetchData(); // Refresh data
    } catch (err) {
      message.error("Error marking service as done");
    }
  };

  // Open service modal
  const openServiceModal = (alert) => {
    setSelectedItem({
      ...alert,
      nextServiceRPM: alert.nextServiceRPM || null
    });
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
      nextServiceRPM: item.nextServiceRPM || null
    });
    setShowEditScheduleModal(true);
  };

  // Handle schedule update
  const handleScheduleUpdate = async (values) => {
    try {
      const nextServiceRPM = values.nextServiceRPM ? parseInt(values.nextServiceRPM) : null;
      
      if (editingSchedule.type === 'vehicle') {
        await api.put(`/api/vehicles/${editingSchedule.id}`, {
          nextServiceRPM: nextServiceRPM
        });
      } else if (editingSchedule.type === 'compressor') {
        await api.put(`/api/compressors/${editingSchedule.id}`, {
          nextServiceRPM: nextServiceRPM
        });
      } else if (editingSchedule.type === 'item') {
        await api.put(`/api/itemInstances/${editingSchedule.id}`, {
          nextServiceRPM: nextServiceRPM
        });
      }
      
      message.success("Service schedule updated successfully");
      setShowEditScheduleModal(false);
      setEditingSchedule(null);
      fetchData();
    } catch (error) {
      message.error("Error updating schedule");
    }
  };

  // Machine service columns
  const vehicleColumns = [
    {
      title: "Machine",
      dataIndex: "name",
      key: "name",
      width: 200,
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
      width: 120,
      render: (rpm) => <Text strong>{Number(rpm).toFixed(1)}</Text>,
    },
    {
      title: "Next Service",
      dataIndex: "nextServiceRPM",
      key: "nextServiceRPM",
      width: 120,
      render: (rpm) => <Text strong>{Number(rpm).toFixed(1)}</Text>,
    },
    {
      title: "Remaining",
      dataIndex: "remainingRPM",
      key: "remainingRPM",
      width: 150,
      render: (remaining, record) => (
        <div>
          <Text type={remaining <= 0 ? "danger" : remaining <= 50 ? "warning" : "success"}>
            {remaining <= 0 ? "OVERDUE" : remaining > 0 ? `${Number(remaining).toFixed(1)} RPM` : "Not Set"}
          </Text>
          <br />
          {record.nextServiceRPM > 0 && (
            <Progress 
              percent={record.progress} 
              size="small" 
              status={record.status === 'overdue' ? 'exception' : record.status === 'due_soon' ? 'active' : 'success'}
              showInfo={false}
            />
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => {
        const config = {
          overdue: { color: 'red', text: 'OVERDUE', icon: <ExclamationCircleOutlined /> },
          due_soon: { color: 'orange', text: 'DUE SOON', icon: <ClockCircleOutlined /> },
          good: { color: 'green', text: 'GOOD', icon: <CheckCircleOutlined /> },
          info: { color: 'blue', text: 'NO SCHEDULE', icon: <InfoCircleOutlined /> }
        };
        const { color, text, icon } = config[status] || config.good;
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space wrap>
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
            Edit Next Service RPM
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
      width: 200,
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" className="text-sm">
            {record.type}
          </Text>
        </div>
      ),
    },
    {
      title: "Current RPM",
      dataIndex: "currentRPM",
      key: "currentRPM",
      width: 120,
      render: (rpm) => <Text strong>{Number(rpm).toFixed(1)}</Text>,
    },
    {
      title: "Next Service",
      dataIndex: "nextServiceRPM",
      key: "nextServiceRPM",
      width: 120,
      render: (rpm) => <Text strong>{rpm > 0 ? rpm.toLocaleString() : "Not Set"}</Text>,
    },
    {
      title: "Remaining",
      dataIndex: "remainingRPM",
      key: "remainingRPM",
      width: 150,
      render: (remaining, record) => (
        <div>
          <Text type={remaining <= 0 ? "danger" : remaining <= 100 ? "warning" : "success"}>
            {remaining <= 0 ? "OVERDUE" : remaining > 0 ? `${Number(remaining).toFixed(1)} RPM` : "Not Set"}
          </Text>
          <br />
          {record.nextServiceRPM > 0 && (
            <Progress 
              percent={record.progress} 
              size="small" 
              status={record.status === 'overdue' ? 'exception' : record.status === 'due_soon' ? 'active' : 'success'}
              showInfo={false}
            />
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => {
        const config = {
          overdue: { color: 'red', text: 'OVERDUE', icon: <ExclamationCircleOutlined /> },
          due_soon: { color: 'orange', text: 'DUE SOON', icon: <ClockCircleOutlined /> },
          good: { color: 'green', text: 'GOOD', icon: <CheckCircleOutlined /> },
          info: { color: 'blue', text: 'NO SCHEDULE', icon: <InfoCircleOutlined /> }
        };
        const { color, text, icon } = config[status] || config.good;
        return <Tag color={color} icon={icon}>{text}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, record) => (
        <Space wrap>
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
            onClick={() => editServiceSchedule(record, 'compressor')}
          >
            Edit Next Service RPM
          </Button>
        </Space>
      ),
    },
  ];

  // Service history columns
  const serviceHistoryColumns = [
    {
      title: "Date",
      dataIndex: "serviceDate",
      key: "serviceDate",
      width: 100,
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Service Type",
      dataIndex: "serviceType",
      key: "serviceType",
      width: 120,
      render: (type) => {
        const typeConfig = {
          vehicle: { color: "blue", text: "Machine", icon: <CarOutlined /> },
          compressor: { color: "orange", text: "Compressor", icon: <SettingOutlined /> },
          item: { color: "purple", text: "Item", icon: <ToolOutlined /> },
        };
        const config = typeConfig[type] || typeConfig.vehicle;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: "Item/Machine/Compressor",
      dataIndex: "serviceName",
      key: "serviceName",
      width: 250,
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          {record.itemDetails && (
            <>
              <br />
              <Text type="secondary" className="text-sm">
                Part: {record.itemDetails.partNumber}
              </Text>
              <br />
              <Text type="secondary" className="text-sm">
                Fitted to: {record.itemDetails.fittedToVehicle}
              </Text>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Service RPM",
      dataIndex: "serviceRPM",
      key: "serviceRPM",
      width: 120,
      render: (rpm) => <Text strong>{Number(rpm).toFixed(1)}</Text>,
    },
    {
      title: "Current RPM",
      dataIndex: "currentRPM",
      key: "currentRPM",
      width: 120,
      render: (rpm) => <Text>{Number(rpm).toFixed(1)}</Text>,
    },
    {
      title: "Performed By",
      dataIndex: "createdBy",
      key: "createdBy",
      width: 120,
      render: (user) => <Text>{user || "System"}</Text>,
    },
  ];

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalVehicles = vehicles.length;
    const totalCompressors = serviceAlerts.filter(a => a.type === 'compressor').length;
    const totalItems = serviceAlerts.filter(a => a.type === 'item').length;
    const overdueServices = serviceAlerts.filter(a => a.priority === 'high').length;
    const dueSoonServices = serviceAlerts.filter(a => a.priority === 'medium' || a.priority === 'low').length;
    
    return {
      totalVehicles,
      totalCompressors,
      totalItems,
      overdueServices,
      dueSoonServices,
      totalServices: serviceHistory.length
    };
  };

  const summary = calculateSummary();

  // Generate PDF for service history
  const generateServiceHistoryPDF = () => {
    const printWindow = window.open('', '_blank');
    const currentDate = dayjs().format('DD/MM/YYYY');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service History Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            font-size: 12px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 14px;
            color: #888;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          table th, table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
          }
          table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .service-type {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
          }
          .machine { background-color: #e6f7ff; color: #1890ff; }
          .compressor { background-color: #fff7e6; color: #fa8c16; }
          .item { background-color: #f9f0ff; color: #722ed1; }
          .summary {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .summary h3 {
            margin: 0 0 10px 0;
            color: #333;
          }
          .summary-item {
            display: inline-block;
            margin-right: 20px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">VENKATESWARA ASSOCIATES</div>
          <div class="report-title">Service History Report</div>
          <div class="report-date">Generated on: ${currentDate}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Service Type</th>
              <th>Item/Machine/Compressor</th>
              <th>Service RPM</th>
              <th>Current RPM</th>
              <th>Performed By</th>
            </tr>
          </thead>
          <tbody>
            ${serviceHistory.map(service => `
              <tr>
                <td>${dayjs(service.serviceDate).format('DD/MM/YYYY')}</td>
                <td>
                  <span class="service-type ${service.serviceType}">
                    ${service.serviceType === 'vehicle' ? 'Machine' : 
                      service.serviceType === 'compressor' ? 'Compressor' : 'Item'}
                  </span>
                </td>
                <td>
                  <strong>${service.serviceName}</strong>
                  ${service.itemDetails ? `
                    <br><small>Part: ${service.itemDetails.partNumber}</small>
                    <br><small>Fitted to: ${service.itemDetails.fittedToVehicle}</small>
                  ` : ''}
                </td>
                <td><strong>${Number(service.serviceRPM).toFixed(1)}</strong></td>
                <td>${Number(service.currentRPM).toFixed(1)}</td>
                <td>${service.createdBy || 'System'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <h3>Summary</h3>
          <div class="summary-item"><strong>Total Services:</strong> ${serviceHistory.length}</div>
          <div class="summary-item"><strong>Machine Services:</strong> ${serviceHistory.filter(s => s.serviceType === 'vehicle').length}</div>
          <div class="summary-item"><strong>Compressor Services:</strong> ${serviceHistory.filter(s => s.serviceType === 'compressor').length}</div>
          <div class="summary-item"><strong>Item Services:</strong> ${serviceHistory.filter(s => s.serviceType === 'item').length}</div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

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
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Machines"
              value={summary.totalVehicles}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Compressors"
              value={summary.totalCompressors}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={summary.totalItems}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue Services"
              value={summary.overdueServices}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
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
      {/* {serviceAlerts.length > 0 && (
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
      )} */}

      {/* Main Content Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: "vehicles",
            label: "Machine Services",
            children: (
              <Card>
                <Table
                  columns={vehicleColumns}
                  dataSource={serviceAlerts.filter(alert => alert.type === 'vehicle').map(alert => ({
                    id: alert.id,
                    name: alert.name,
                    type: 'Machine',
                    currentRPM: alert.currentRPM,
                    nextServiceRPM: alert.nextServiceRPM,
                    remainingRPM: alert.remaining || alert.overdue || 0,
                    progress: alert.nextServiceRPM > 0 ? Math.min(100, (alert.currentRPM / alert.nextServiceRPM) * 100) : 0,
                    status: alert.priority === 'high' ? 'overdue' : 
                           alert.priority === 'medium' ? 'overdue' : 
                           alert.priority === 'low' ? 'due_soon' : 
                           alert.priority === 'info' ? 'info' : 'good',
                    priority: alert.priority,
                    site: 'N/A',
                    brand: 'N/A',
                    vehicleServiceSchedule: alert.vehicleServiceSchedule || []
                  }))}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 800 }}
                />
              </Card>
            )
          },
          {
            key: "compressors",
            label: "Compressor Services",
            children: (
              <Card>
                <Table
                  columns={compressorColumns}
                  dataSource={serviceAlerts.filter(alert => alert.type === 'compressor').map(alert => ({
                    id: alert.id,
                    name: alert.name,
                    type: 'Compressor',
                    currentRPM: alert.currentRPM,
                    nextServiceRPM: alert.nextServiceRPM,
                    remainingRPM: alert.remaining || alert.overdue || 0,
                    progress: alert.nextServiceRPM > 0 ? Math.min(100, (alert.currentRPM / alert.nextServiceRPM) * 100) : 0,
                    status: alert.priority === 'high' ? 'overdue' : 
                           alert.priority === 'medium' ? 'overdue' : 
                           alert.priority === 'low' ? 'due_soon' : 
                           alert.priority === 'info' ? 'info' : 'good',
                    priority: alert.priority,
                    compressorServiceSchedule: alert.compressorServiceSchedule || []
                  }))}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 800 }}
                />
              </Card>
            )
          },
          {
            key: "items",
            label: "Item Services",
            children: (
              <Card>
                <Table
                  columns={[
                    {
                      title: "Item",
                      dataIndex: "name",
                      key: "name",
                      render: (name, record) => (
                        <div>
                          <Text strong>{name}</Text>
                          <br />
                          <Text type="secondary" className="text-sm">
                            {record.vehicleName || 'Not fitted'}
                          </Text>
                        </div>
                      ),
                    },
                    {
                      title: "Current RPM",
                      dataIndex: "currentRPM",
                      key: "currentRPM",
                      render: (rpm) => <Text strong>{Number(rpm).toFixed(1)}</Text>,
                    },
                    {
                      title: "Next Service",
                      dataIndex: "nextServiceRPM",
                      key: "nextServiceRPM",
                      render: (rpm) => <Text strong>{Number(rpm).toFixed(1)}</Text>,
                    },
                    {
                      title: "Remaining",
                      dataIndex: "remainingRPM",
                      key: "remainingRPM",
                      render: (remaining, record) => (
                        <div>
                          <Text type={remaining <= 0 ? "danger" : remaining <= 50 ? "warning" : "success"}>
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
                                type: 'item',
                                item: record.name,
                                itemInstanceId: record.id,
                                currentRPM: record.currentRPM,
                                nextServiceRPM: record.nextServiceRPM,
                                remainingRPM: record.remainingRPM
                              })}
                            >
                              Mark Done
                            </Button>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                  dataSource={serviceAlerts.filter(alert => alert.type === 'item').map(alert => ({
                    id: alert.id,
                    name: alert.name,
                    vehicleName: alert.vehicleName,
                    currentRPM: alert.currentRPM,
                    nextServiceRPM: alert.nextServiceRPM,
                    remainingRPM: alert.remaining || alert.overdue || 0,
                    progress: Math.min(100, (alert.currentRPM / alert.nextServiceRPM) * 100),
                    status: alert.overdue > 0 ? 'overdue' : (alert.remaining || 0) <= 50 ? 'due_soon' : 'good',
                    priority: alert.priority,
                    serviceSchedule: alert.serviceSchedule || []
                  }))}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 800 }}
                />
              </Card>
            )
          },
          {
            key: "history",
            label: "Service History",
            children: (
              <Card>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <Title level={4} className="mb-2">Service History</Title>
                    <Text type="secondary">Complete history of all services performed</Text>
                  </div>
                  <Button 
                    type="primary" 
                    icon={<FilePdfOutlined />}
                    onClick={generateServiceHistoryPDF}
                  >
                    Export PDF
                  </Button>
                </div>
                <Table
                  columns={serviceHistoryColumns}
                  dataSource={serviceHistory}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 20 }}
                  scroll={{ x: 1000 }}
                />
              </Card>
            )
          }
        ]}
      />

      {/* Service Completion Modal */}
      <Modal
        title={`Mark ${serviceType === 'vehicle' ? 'Machine' : serviceType === 'compressor' ? 'Compressor' : 'Item'} Service as Done`}
        open={showServiceModal}
        onCancel={() => {
          setShowServiceModal(false);
          setSelectedItem(null);
          setServiceType(null);
          form.resetFields();
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 600 }}
      >
        {selectedItem && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <Text strong className="block mb-2">Service Details:</Text>
              <Text className="block">Item: {selectedItem.item}</Text>
              <Text className="block">Current RPM: {Number(selectedItem.currentRPM).toFixed(1)}</Text>
              <Text className="block">Service Threshold: {Number(selectedItem.nextServiceRPM).toFixed(1)}</Text>
              <Text className="block">Remaining: {Number(selectedItem.remainingRPM).toFixed(1)} RPM</Text>
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
                    <InputNumber className="w-full" min={0} step={0.1} precision={1} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="nextServiceRPM"
                    label="Next Service RPM (Optional)"
                    tooltip="Leave blank to clear next service schedule"
                  >
                    <InputNumber className="w-full" min={0} step={0.1} precision={1} placeholder="Enter next service RPM" />
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
                <Button 
                  size="large"
                  onClick={() => {
                    setShowServiceModal(false);
                    setSelectedItem(null);
                    setServiceType(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" size="large">
                  Mark Service as Done
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Edit Service Schedule Modal */}
      <Modal
        title={`Edit Next Service RPM - ${editingSchedule?.name}`}
        open={showEditScheduleModal}
        onCancel={() => {
          setShowEditScheduleModal(false);
          setEditingSchedule(null);
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: 600 }}
      >
        {editingSchedule && (
          <Form
            layout="vertical"
            onFinish={handleScheduleUpdate}
            initialValues={{
              nextServiceRPM: editingSchedule.nextServiceRPM
            }}
          >
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <Text strong className="block mb-2">Current Information:</Text>
              <Text className="block">Type: {editingSchedule.type === 'vehicle' ? 'Vehicle' : 'Compressor'}</Text>
              <Text className="block">Current RPM: {Number(editingSchedule.currentRPM).toFixed(1)}</Text>
              <Text className="block">Next Service RPM: {editingSchedule.nextServiceRPM || 'Not set'}</Text>
            </div>

            <Form.Item
              name="nextServiceRPM"
              label="Next Service RPM"
              help="Enter the RPM at which the next service is due"
            >
              <InputNumber 
                className="w-full" 
                min={0} 
                placeholder="e.g., 1000" 
              />
            </Form.Item>

            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                size="large"
                onClick={() => {
                  setShowEditScheduleModal(false);
                  setEditingSchedule(null);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                Update Next Service RPM
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default ServiceManagement;