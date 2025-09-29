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
  Modal,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit, canDelete, canManageUsers } from "../service/auth";

const UserManagement = () => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm] = Form.useForm();

  // Check if user has permission to access this page
  if (!canManageUsers()) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the User Management page.</p>
          <p className="text-sm text-gray-500 mt-2">Only admin users can manage users.</p>
        </div>
      </div>
    );
  }

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/users");
      setUsers(res.data.data || []);
    } catch (err) {
      console.error("Error fetching users", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageUsers()) {
      fetchUsers();
    }
  }, []);

  // Handle form submit (create or update)
  const handleSubmit = async (values) => {
    try {
      const currentUser = localStorage.getItem("username") || "Unknown";
      const payload = {
        username: values.username.trim(),
        password: values.password?.trim(),
        role: values.role,
      };

      // Remove password from payload for updates
      if (editingId) {
        delete payload.password;
        payload.updatedBy = currentUser;
        await api.put(`/api/users/${editingId}`, payload);
      } else {
        payload.createdBy = currentUser;
        const res = await api.post("/api/users", payload);
        setUsers([res.data.data, ...users]);
      }

      setShowForm(false);
      setEditingId(null);
      form.resetFields();
      fetchUsers();
    } catch (err) {
      console.error("Error saving user", err);
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingId(record.id);
    setShowForm(true);
    form.setFieldsValue({
      username: record.username,
      role: record.role,
      // Don't set password for edit
    });
  };

  // Handle password change
  const handlePasswordChange = async (values) => {
    try {
      await api.put(`/api/users/${editingId}`, {
        password: values.newPassword,
        updatedBy: localStorage.getItem("username") || "admin"
      });
      message.success("Password updated successfully");
      setShowPasswordForm(false);
      setEditingId(null);
      passwordForm.resetFields();
    } catch (err) {
      console.error("Error updating password", err);
      message.error("Error updating password");
    }
  };

  // Open password change form
  const openPasswordForm = (record) => {
    setEditingId(record.id);
    setShowPasswordForm(true);
    passwordForm.resetFields();
  };

  // Handle hard delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/users/${id}/hard`);
      setUsers(users.filter((user) => user.id !== id));
    } catch (err) {
      console.error("Error deleting user", err);
    }
  };


  // Table columns
  const columns = [
    { title: "Username", dataIndex: "username", key: "username" },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => {
        const colors = { admin: "red", editor: "blue", viewer: "green" };
        return <Tag color={colors[role] || "default"}>{role}</Tag>;
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
          {canEdit() && (
            <Button 
              icon={<KeyOutlined />} 
              onClick={() => openPasswordForm(record)}
              title="Change Password"
            />
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

  // Check if user has permission to manage users
  if (!canManageUsers()) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access User Management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Space>
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
              {showForm ? "Cancel" : "Add User"}
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
                name="username"
                label="Username"
                rules={[
                  { required: true, message: "Username is required" },
                  { min: 3, message: "Username must be at least 3 characters" },
                  { max: 20, message: "Username must be no more than 20 characters" }
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true }]}
                initialValue="viewer"
              >
                <Select>
                  <Select.Option value="admin">Admin</Select.Option>
                  <Select.Option value="editor">Editor</Select.Option>
                  <Select.Option value="viewer">Viewer</Select.Option>
                </Select>
              </Form.Item>
              {!editingId && (
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[
                    { required: !editingId, message: "Password is required" },
                    { min: 3, message: "Password must be at least 3 characters" },
                    { max: 20, message: "Password must be no more than 20 characters" }
                  ]}
                >
                  <Input.Password />
                </Form.Item>
              )}
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {editingId ? "Update User" : "Add User"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Search */}
      <Input.Search
        placeholder="Search by username"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ maxWidth: 300, marginBottom: 20 }}
      />

      {/* Table */}
      <Table
        columns={columns}
        dataSource={(users || []).filter((u) =>
          u.username?.toLowerCase().includes(searchTerm.toLowerCase())
        )}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* Password Change Modal */}
      <Modal
        title="Change Password"
        open={showPasswordForm}
        onCancel={() => {
          setShowPasswordForm(false);
          setEditingId(null);
          passwordForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: "Please enter new password" },
              { min: 3, message: "Password must be at least 3 characters" },
              { max: 20, message: "Password must be no more than 20 characters" }
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: "Please confirm new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Change Password
              </Button>
              <Button onClick={() => {
                setShowPasswordForm(false);
                setEditingId(null);
                passwordForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
