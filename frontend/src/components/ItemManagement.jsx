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
import { canEdit, canDelete } from "../service/auth";
import { handleAutoCapitalize } from "../utils/textUtils";

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
  // const handleSubmit = async (values) => {
  //   try {
  //     if (editingId) {
  //       await api.put(`/api/items/${editingId}`, values);
  //       console.log("Updating values:", values);
  //       message.success("Item updated successfully");
  //     } else {
  //       await api.post("/api/items", values);
  //       console.log("Submitting values:", values);
  //       message.success("Item created successfully");

  //     }

  //     setShowForm(false);
  //     setEditingId(null);
  //     form.resetFields();
  //     fetchItems(pagination.current, pagination.pageSize);
  //   } catch (err) {
  //     console.error("Error saving item", err);
  //     message.error("Error saving item");
  //   }
  // };

  // Handle edit
  // const handleEdit = (record) => {
  //   setEditingId(record.id);
  //   setShowForm(true);
  //   form.setFieldsValue({
  //     ...record,
  //     canBeFitted: record.canBeFitted || false,
  //   });
  // };

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
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Item Management Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Part Number</th>
                <th>Group Name</th>
                <th>Units</th>
                <th>Purchase Rate</th>
                <th>GST %</th>
                <th>Can Be Fitted</th>
                <th>Created By</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.partNumber || '-'}</td>
                  <td>${item.groupName || '-'}</td>
                  <td>${item.units || '-'}</td>
                  <td>₹${item.purchaseRate ? Number(item.purchaseRate).toFixed(2) : '0.00'}</td>
                  <td>${item.gst ? `${item.gst}%` : 'No GST'}</td>
                  <td>${item.canBeFitted ? 'Yes' : 'No'}</td>
                  <td>${item.createdBy || '-'}</td>
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
                <Input onChange={(e) => handleAutoCapitalize(e, (e) => form.setFieldValue('itemName', e.target.value), 'words')} />

              </Form.Item>
              <Form.Item name="partNumber" label="Part Number">
                <Input onChange={(e) => handleAutoCapitalize(e, (e) => form.setFieldValue('partNumber', e.target.value), 'upper')} />
              </Form.Item>
              <Form.Item
                name="groupName"
                label="Group Name"
                rules={[{ required: true, message: "Please enter group name" }]}
              >
                <Input onChange={(e) => handleAutoCapitalize(e, (e) => form.setFieldValue('groupName', e.target.value), 'words')} />
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
                name="canBeFitted"
                label="Can Be Fitted to Machine"
                valuePropName="checked"
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