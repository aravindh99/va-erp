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
  InputNumber,
  Switch,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  FilePdfOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit, canDelete, canCreate } from "../service/auth";

const { Title, Text } = Typography;

const ItemManagement = () => {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  });

  // Fetch items
  const fetchItems = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/items?page=${page}&limit=${limit}`);
      setItems(res.data.data || []);

      // Update pagination state
      setPagination(prev => ({
        ...prev,
        current: res.data.page || page,
        total: res.data.total || 0,
      }));
    } catch (err) {
      console.error("Error fetching items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

 

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      // Ensure numeric fields are numbers
      const payload = {
        ...values,
        purchaseRate: Number(values.purchaseRate),
        gst: values.gst !== undefined ? Number(values.gst) : 0,
      };

      if (editingId) {
        await api.put(`/api/items/${editingId}`, payload);

        message.success("Item updated successfully");
      } else {
        await api.post("/api/items", payload);

        message.success("Item created successfully");
      }

      setShowForm(false);
      setEditingId(null);
      form.resetFields();
      fetchItems(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error("Error saving item", err);
      message.error("Error saving item");
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingId(record.id);
    setShowForm(true);
    form.setFieldsValue({
      ...record,
      purchaseRate: Number(record.purchaseRate) || 0,
      gst: record.gst !== undefined ? Number(record.gst) : 0,
      canBeFitted: record.canBeFitted || false,
    });
  };


  // Handle hard delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/items/${id}/hard`);
      message.success("Item deleted successfully");
      fetchItems(pagination.current, pagination.pageSize);
    } catch (err) {
      console.error("Error deleting item", err);
      message.error("Error deleting item");
    }
  };

  // Handle table change
  const handleTableChange = (pagination) => {
    fetchItems(pagination.current, pagination.pageSize);
  };

  // Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Item Management Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .item-detail { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .rpm-info { background-color: #e6f7ff; padding: 8px; border-radius: 3px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Item Management Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Items:</strong> ${items.length}</p>
            <p><strong>Total Stock Value:</strong> ₹${items.reduce((sum, item) => sum + ((item.stock || 0) * (item.purchaseRate || 0)), 0).toLocaleString()}</p>
            <p><strong>Items with Stock:</strong> ${items.filter(item => (item.stock || 0) > 0).length}</p>
            <p><strong>Items Out of Stock:</strong> ${items.filter(item => (item.stock || 0) === 0).length}</p>
          </div>
          
          <h3>Item Details</h3>
          ${items.map(item => `
            <div class="item-detail">
              <h4>${item.itemName} (${item.partNumber || 'No Part Number'})</h4>
              <p><strong>Group:</strong> ${item.groupName || 'N/A'} | <strong>Units:</strong> ${item.units || 'N/A'}</p>
              <p><strong>Unit Price:</strong> ₹${item.purchaseRate || 0} | <strong>GST:</strong> ${item.gst || 0}%</p>
              <p><strong>Stock Available:</strong> <span style="color: ${(item.stock || 0) > 0 ? 'green' : 'red'}; font-weight: bold;">${item.stock || 0}</span></p>
              <p><strong>Can Be Fitted:</strong> ${item.canBeFitted ? 'Yes' : 'No'}</p>
              ${item.canBeFitted && item.instances && item.instances.length > 0 ? `
                <div class="rpm-info">
                  <strong>Machine Items with RPM Tracking:</strong>
                  <ul>
                    ${item.instances.map(instance => `
                      <li>
                        <strong>${instance.instanceNumber}:</strong> 
                        Current RPM: ${instance.currentRPM || 0} | 
                        Status: ${instance.status} | 
                        Service Schedule: ${instance.serviceSchedule && instance.serviceSchedule.length > 0 ? instance.serviceSchedule.join(', ') + ' RPM' : 'Not set'}
                        ${instance.fittedToVehicle ? ` | Fitted to: ${instance.fittedToVehicle.vehicleNumber || 'Unknown'}` : ''}
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const columns = [
    { title: "Item Name", dataIndex: "itemName", key: "itemName" },
    { title: "Part Number", dataIndex: "partNumber", key: "partNumber" },
    { title: "Group Name", dataIndex: "groupName", key: "groupName" },
    { title: "Units", dataIndex: "units", key: "units" },
    {
      title: "Purchase Rate",
      dataIndex: "purchaseRate",
      key: "purchaseRate",
      render: (value) => `₹${value ? Number(value).toFixed(2) : '0.00'}`,
    },
    {
      title: "GST %",
      dataIndex: "gst",
      key: "gst",
      render: (value) => value ? `${value}%` : 'No GST',
    },
    {
      title: "Can Be Fitted",
      dataIndex: "canBeFitted",
      key: "canBeFitted",
      render: (value) => (
        <Tag color={value ? "blue" : "default"}>
          {value ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      key: "stock",
      render: (value) => (
        <Text strong style={{ 
          color: value > 0 ? '#52c41a' : '#ff4d4f',
          fontSize: '16px'
        }}>
          {value || 0}
        </Text>
      ),
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (createdBy) => createdBy || "-",
    },
    {
      title: "Updated By",
      dataIndex: "updatedBy",
      key: "updatedBy",
      render: (updatedBy) => updatedBy || "-",
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
            >
              Edit
            </Button>
          )}
          {canDelete() && (
            <Popconfirm
              title="Are you sure you want to delete this item?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
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
          <Title level={2} className="mb-2">Item Management</Title>
          <Text type="secondary">Manage items and their specifications</Text>
        </div>
        <Space>
          <Button
            icon={<FilePdfOutlined />}
            onClick={exportToPDF}
            type="primary"
            danger
          >
            Export PDF
          </Button>
          {canCreate() && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              form.resetFields();
            }}
          >
            Add Item
          </Button>
          )}
        </Space>
      </div>

      {/* Form */}
      {showForm && (
        <Card title={editingId ? "Edit Item" : "Add New Item"}>
          <Form layout="vertical" form={form} onFinish={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="itemName"
                label="Item Name"
                rules={[{ required: true }]}
              >
                <Input />

              </Form.Item>
              <Form.Item 
                name="partNumber" 
                label="Part Number"
                rules={[{ required: true, message: "Part number is required" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="groupName"
                label="Group Name"
                rules={[{ required: true, message: "Please enter group name" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="units"
                label="Units"
                rules={[{ required: true, message: "Please select units" }]}
              >
                <Select placeholder="Select units">
                  <Select.Option value="kg">kg</Select.Option>
                  <Select.Option value="ltr">ltr</Select.Option>
                  <Select.Option value="mtr">mtr</Select.Option>
                  <Select.Option value="nos">nos</Select.Option>
                  <Select.Option value="set">set</Select.Option>
                  <Select.Option value="unit">unit</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="purchaseRate"
                label="Purchase Rate (₹)"
                rules={[{ required: true, message: "Please enter purchase rate" }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  step={0.01}
                  precision={2}
                  placeholder="Enter purchase rate"
                />
              </Form.Item>
              <Form.Item
                name="gst"
                label="GST % (Optional)"
                rules={[{ type: 'number', min: 0, max: 100 }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  max={100}
                  step={0.01}
                  precision={2}
                  placeholder="Enter GST percentage (optional)"
                />
              </Form.Item>
              <Form.Item
                name="stock"
                label="Initial Stock"
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  step={0.1}
                  precision={1}
                  placeholder="0"
                />
              </Form.Item>
              <Form.Item
                name="canBeFitted"
                label="Can Be Fitted to Machine"
                valuePropName="checked"
                tooltip="Items marked 'Can Be Fitted' will create individual instances in inventory for RPM tracking"
              >
                <Switch />
              </Form.Item>
            </div>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingId ? "Update Item" : "Add Item"}
                </Button>
                <Button onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Input.Search
          placeholder="Search by item name or part number"
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

      {/* Table */}
      <Table
        columns={columns}
        dataSource={(items || []).filter((item) =>
          item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        )}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default ItemManagement;