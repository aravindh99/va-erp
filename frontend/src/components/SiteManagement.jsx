import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Table,
  Tag,
  Space,
  Form,
  Switch,
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

const SiteManagement = () => {
  const [form] = Form.useForm();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch sites
  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/sites");
      setSites(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sites", err);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Handle form submit (create or update)
  const handleSubmit = async (values) => {
    try {
      const payload = {
        siteName: values.siteName,
        siteStatus: values.siteStatus,
      };

      if (editingId) {
        await api.put(`/api/sites/${editingId}`, payload);
      } else {
        const res = await api.post("/api/sites", payload);
        setSites([res.data.data, ...sites]);
      }

      setShowForm(false);
      setEditingId(null);
      form.resetFields();
      fetchSites();
    } catch (err) {
      console.error("Error saving site", err);
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingId(record.id);
    setShowForm(true);
    form.setFieldsValue({
      ...record,
    });
  };

  // Handle hard delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/sites/${id}/hard`);
      setSites(sites.filter((site) => site.id !== id));
    } catch (err) {
      console.error("Error deleting site", err);
    }
  };

  // PDF Export
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Site List</title>
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
            <h1>Site List</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Site Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(sites || [])
                .filter((s) =>
                  s.siteName?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(
                  (site) => `
                <tr>
                  <td>${site.siteName}</td>
                  <td>${site.siteStatus ? "Active" : "Inactive"}</td>
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
    { title: "Site Name", dataIndex: "siteName", key: "siteName" },
    {
      title: "Status",
      dataIndex: "siteStatus",
      key: "siteStatus",
      render: (status) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Active" : "Inactive"}
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
            <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          )}
          {canDelete() && (
            <Popconfirm
              title="Are you sure to delete?"
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
        <h1 className="text-2xl font-bold">Site Management</h1>
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
              {showForm ? "Cancel" : "Add Site"}
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
                name="siteName"
                label="Site Name"
                rules={[{ required: true }]}
              >
                <Input onChange={(e) => handleAutoCapitalize(e, (e) => form.setFieldValue('siteName', e.target.value), 'words')} />
              </Form.Item>
              <Form.Item
                name="siteStatus"
                label="Status"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {editingId ? "Update Site" : "Add Site"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Search */}
      <Input.Search
        placeholder="Search by site name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ maxWidth: 300, marginBottom: 20 }}
      />

      {/* Table */}
      <Table
        columns={columns}
        dataSource={(sites || []).filter((s) =>
          s.siteName?.toLowerCase().includes(searchTerm.toLowerCase())
        )}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default SiteManagement;
