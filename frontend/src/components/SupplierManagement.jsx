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

const SupplierManagement = () => {
  const [form] = Form.useForm();
  const [suppliers, setSuppliers] = useState([]);
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

  // Fetch suppliers
  const fetchSuppliers = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/suppliers?page=${page}&limit=${limit}`);
      setSuppliers(res.data.data || []);
      
      // Update pagination state
      setPagination(prev => ({
        ...prev,
        current: res.data.page || page,
        total: res.data.total || 0,
        pageSize: res.data.limit || limit,
      }));
    } catch (err) {
      console.error("Error fetching suppliers", err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handleTableChange = (pagination) => {
    fetchSuppliers(pagination.current, pagination.pageSize);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Handle form submit (create or update)
  const handleSubmit = async (values) => {
    try {
      const currentUser = localStorage.getItem("username") || "Unknown";
      const payload = {
        supplierName: values.supplierName.trim(),
        gstNumber: values.gstNumber?.trim(),
        phone: values.phone?.trim(),
        email: values.email?.trim(),
        address: values.address.trim(),
        status: values.status || "active",
      };

      if (editingId) {
        payload.updatedBy = currentUser;
        await api.put(`/api/suppliers/${editingId}`, payload);
      } else {
        payload.createdBy = currentUser;
        const res = await api.post("/api/suppliers", payload);
        setSuppliers([res.data.data, ...suppliers]);
      }

      setShowForm(false);
      setEditingId(null);
      form.resetFields();
      fetchSuppliers();
    } catch (err) {
      console.error("Error saving supplier", err);
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingId(record.id);
    setShowForm(true);
    form.setFieldsValue({
      supplierName: record.supplierName,
      gstNumber: record.gstNumber,
      phone: record.phone,
      email: record.email,
      address: record.address,
      status: record.status,
    });
  };

  // Handle hard delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/suppliers/${id}/hard`);
      setSuppliers(suppliers.filter((supplier) => supplier.id !== id));
    } catch (err) {
      console.error("Error deleting supplier", err);
    }
  };

  // PDF Export
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Supplier List</title>
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
            <h1>Supplier List</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>GST Number</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(suppliers || [])
                .filter((s) =>
                  s.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(
                  (supplier) => `
                <tr>
                  <td>${supplier.supplierName}</td>
                  <td>${supplier.gstNumber || "-"}</td>
                  <td>${supplier.phone || "-"}</td>
                  <td>${supplier.email || "-"}</td>
                  <td>${supplier.address || "-"}</td>
                  <td>${supplier.status}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Table columns
  const columns = [
    { title: "Supplier Name", dataIndex: "supplierName", key: "supplierName" },
    { title: "GST Number", dataIndex: "gstNumber", key: "gstNumber" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email" },
    { 
      title: "Address", 
      dataIndex: "address", 
      key: "address",
      render: (text) => (
        <div style={{ maxWidth: 300, wordWrap: "break-word" }}>
          {text}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors = { active: "green", inactive: "red" };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
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
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          )}
          {canDelete() && (
            <Popconfirm
              title="Are you sure to delete this record permanently?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Supplier Management</h1>
        <Space>
          <Button
            icon={<FilePdfOutlined />}
            onClick={exportToPDF}
            type="primary"
            danger
          >
            Export PDF
          </Button>
          {canEdit() && (
            <Button
              icon={<PlusOutlined />}
              onClick={() => {
                setShowForm(!showForm);
                setEditingId(null);
                form.resetFields();
              }}
              type="primary"
            >
              {showForm ? "Cancel" : "Add Supplier"}
            </Button>
          )}
        </Space>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-6">
          <Form layout="vertical" form={form} onFinish={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                name="supplierName"
                label="Supplier Name"
                rules={[
                  { required: true, message: "Supplier name is required" },
                  { min: 1, message: "Supplier name cannot be empty" },
                  { max: 255, message: "Supplier name must be no more than 255 characters" }
                ]}
              >
                <Input onChange={(e) => handleAutoCapitalize(e, (e) => form.setFieldValue('supplierName', e.target.value), 'words')} />
              </Form.Item>
              <Form.Item
                name="gstNumber"
                label="GST Number"
                rules={[{ max: 255, message: "GST number must be no more than 255 characters" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { 
                    pattern: /^[0-9]{10}$/, 
                    message: "Phone number must be exactly 10 digits" 
                  }
                ]}
              >
                <Input placeholder="Enter 10-digit phone number" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { type: "email", message: "Please enter a valid email" },
                  { max: 255, message: "Email must be no more than 255 characters" }
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="status"
                label="Status"
                initialValue="active"
              >
                <Select>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="address"
                label="Address"
                rules={[
                  { required: true, message: "Address is required" },
                  { min: 1, message: "Address cannot be empty" },
                  { max: 255, message: "Address must be no more than 255 characters" }
                ]}
              >
                <Input.TextArea rows={3} />
              </Form.Item>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {editingId ? "Update Supplier" : "Add Supplier"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Search */}
      <Input.Search
        placeholder="Search by supplier name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ maxWidth: 300, marginBottom: 20 }}
      />

      {/* Table */}
      <Table
        columns={columns}
        dataSource={(suppliers || []).filter((s) =>
          s.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
        )}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} suppliers`
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default SupplierManagement;
