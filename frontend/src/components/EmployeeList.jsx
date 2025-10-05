import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Table,
  Tag,
  Space,
  Form,
  Select,
  DatePicker,
  Card,
  Popconfirm,
  InputNumber,
  Typography,
} from "antd";
import {
  PlusOutlined,
  FilePdfOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit, canDelete } from "../service/auth";
import { handleAutoCapitalize } from "../utils/textUtils";
import dayjs from "dayjs";

const EmployeeList = () => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]);
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

  // Fetch employees
  const fetchEmployees = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/employeeLists?page=${page}&limit=${limit}`);
      setEmployees(res.data.data || []);
      
      // Update pagination state
      setPagination(prev => ({
        ...prev,
        current: res.data.page || page,
        total: res.data.total || 0,
        pageSize: res.data.limit || limit,
      }));
    } catch (err) {
      console.error("Error fetching employees", err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handleTableChange = (pagination) => {
    fetchEmployees(pagination.current, pagination.pageSize);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle form submit (create or update)
  const handleSubmit = async (values) => {
    try {
      const currentUser = localStorage.getItem("username") || "Unknown";
      const payload = {
        empId: values.empId,
        name: values.name,
        designation: values.designation,
        phone: values.phone,
        joiningDate: values.joiningDate
          ? values.joiningDate.format("YYYY-MM-DD")
          : null,
        status: values.status,
        advancedAmount: values.advancedAmount ? Number(values.advancedAmount) : 0,
      };

      if (editingId) {
        payload.updatedBy = currentUser;
        await api.put(`/api/employeeLists/${editingId}`, payload);
        
      } else {
        payload.createdBy = currentUser;
        const res = await api.post("/api/employeeLists", payload);
        setEmployees([res.data.data, ...employees]);
        
        
      }

      setShowForm(false);
      setEditingId(null);
      form.resetFields();
      fetchEmployees();
    } catch (err) {
      console.error("Error saving employee", err);
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingId(record.id);
    setShowForm(true);
    form.setFieldsValue({
      ...record,
      joiningDate: record.joiningDate ? dayjs(record.joiningDate) : null,
      advancedAmount: record.advancedAmount || 0,
    });
  };

  // Handle hard delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/employeeLists/${id}/hard`);
      setEmployees(employees.filter((emp) => emp.id !== id));
    } catch (err) {
      console.error("Error deleting employee", err);
    }
  };

  // PDF Export
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee List</title>
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
            <h1>Employee List</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Phone</th>
                <th>Joining Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(employees || [])
                .filter((e) =>
                  e.name?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(
                  (emp) => `
                <tr>
                  <td>${emp.empId}</td>
                  <td>${emp.name}</td>
                  <td>${emp.designation || "-"}</td>
                  <td>${emp.phone || "-"}</td>
                  <td>${
                    emp.joiningDate
                      ? dayjs(emp.joiningDate).format("YYYY-MM-DD")
                      : "-"
                  }</td>
                  <td>${emp.status}</td>
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
    { title: "Emp ID", dataIndex: "empId", key: "empId" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Designation", dataIndex: "designation", key: "designation" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    {
      title: "Joining Date",
      dataIndex: "joiningDate",
      key: "joiningDate",
      render: (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colors = { active: "green", inactive: "orange", resigned: "red" };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Advanced Amount",
      dataIndex: "advancedAmount",
      key: "advancedAmount",
      render: (amount) => (
        <Typography.Text strong>
          ₹{amount ? Number(amount).toLocaleString() : '0'}
        </Typography.Text>
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
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.location.href = `/employee/details/${record.id}`}
            title="View Details"
          >
            View
          </Button>
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
        <h1 className="text-2xl font-bold">Employee List</h1>
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
              {showForm ? "Cancel" : "Add Employee"}
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
                name="empId"
                label="Employee ID"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input onChange={(e) => handleAutoCapitalize(e, (e) => form.setFieldValue('name', e.target.value), 'words')} />
              </Form.Item>
              <Form.Item name="designation" label="Designation">
                <Input onChange={(e) => handleAutoCapitalize(e, (e) => form.setFieldValue('designation', e.target.value), 'words')} />
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
              <Form.Item name="joiningDate" label="Joining Date">
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true }]}
                initialValue="active"
              >
                <Select>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                  <Select.Option value="resigned">Resigned</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="advancedAmount"
                label="Advanced Amount (₹)"
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  step={1000}
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                  placeholder="Enter advanced amount"
                  
                />
              </Form.Item>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {editingId ? "Update Employee" : "Add Employee"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Input.Search
          placeholder="Search by employee name"
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
        dataSource={(employees || []).filter((e) =>
          e.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} employees`
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default EmployeeList;
