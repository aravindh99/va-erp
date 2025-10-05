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
} from "antd";
import {
  PlusOutlined,
  FilePdfOutlined,
  EditOutlined,
  DeleteOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit, canDelete } from "../service/auth";
import { useNavigate } from "react-router-dom";
import { handleAutoCapitalize } from "../utils/textUtils";
import dayjs from "dayjs";

const CompressorManagement = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [compressors, setCompressors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Fetch compressors
  const fetchCompressors = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/compressors");
      setCompressors(res.data.data || []);
    } catch (err) {
      console.error("Error fetching compressors", err);
      setCompressors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompressors();
  }, []);

  // Handle form submit (create or update)
  const handleSubmit = async (values) => {
    try {
      const payload = {
        compressorName: values.compressorName,
        compressorType: values.compressorType,
        status: values.status,
        serialNumber: values.serialNumber || null,
        purchaseDate: values.purchaseDate ? values.purchaseDate.format("YYYY-MM-DD") : null,
        compressorRPM: values.compressorRPM ?? null,
        nextServiceRPM: values.nextServiceRPM ?? null,
      };

      if (editingId) {
        await api.put(`/api/compressors/${editingId}`, payload);
      } else {
        const res = await api.post("/api/compressors", payload);
        setCompressors([res.data.data, ...compressors]);
      
      }

      setShowForm(false);
      setEditingId(null);
      form.resetFields();
      fetchCompressors();
    } catch (err) {
      console.error("Error saving compressor", err);
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingId(record.id);
    setShowForm(true);
    form.setFieldsValue({
      ...record,
      purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : null,
      nextServiceRPM: record.nextServiceRPM ?? undefined,
    });
  };

  // Handle hard delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/compressors/${id}/hard`);
      setCompressors(compressors.filter((compressor) => compressor.id !== id));
    } catch (err) {
      console.error("Error deleting compressor", err);
    }
  };

  // PDF Export
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Compressor List</title>
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
            <h1>Compressor List</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Compressor Name</th>
                <th>Type</th>
                <th>Compressor RPM</th>
                <th>Next Service RPM</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(compressors || [])
        .filter((c) =>
          c.compressorName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map(
          (compressor) => `
                <tr>
                  <td>${compressor.compressorName}</td>
                  <td>${compressor.compressorType}</td>
                  <td>${compressor.compressorRPM || 0}</td>
                  <td>${compressor.nextServiceRPM || '-'}</td>
                  <td>${compressor.status}</td>
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
    { title: "Compressor Name", dataIndex: "compressorName", key: "compressorName" },
    { title: "Type", dataIndex: "compressorType", key: "compressorType" },
    { title: "Serial Number", dataIndex: "serialNumber", key: "serialNumber" },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: "Compressor RPM",
      dataIndex: "compressorRPM",
      key: "compressorRPM",
      render: (value) => value || 0,
    },
    {
      title: "Next Service RPM",
      dataIndex: "nextServiceRPM",
      key: "nextServiceRPM",
      render: (value) => value || '-',
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
          <Button
            icon={<ToolOutlined />}
            onClick={() => navigate(`/reports/compressor-service/${record.id}`)}
            title="View Service History"
          />
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
        <h1 className="text-2xl font-bold">Compressor Management</h1>
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
              {showForm ? "Cancel" : "Add Compressor"}
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
                name="compressorName"
                label="Compressor Name"
                rules={[{ required: true }]}
              >
                <Input onChange={(e) => handleAutoCapitalize(e, (e) => form.setFieldValue('compressorName', e.target.value), 'words')} />
              </Form.Item>
              <Form.Item
                name="compressorType"
                label="Type"
                rules={[{ required: true }]}
              >
                <Input onChange={(e) => handleAutoCapitalize(e, (e) => form.setFieldValue('compressorType', e.target.value), 'words')} />
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
                </Select>
              </Form.Item>
              <Form.Item
                name="serialNumber"
                label="Serial Number"
              >
                <Input placeholder="Enter serial number" />
              </Form.Item>
              <Form.Item
                name="purchaseDate"
                label="Purchase Date"
              >
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item
                name="compressorRPM"
                label="Compressor RPM"
                rules={[{ type: 'number', min: 0 }]}
              >
                <InputNumber
                  className="w-full"
                  min={0}
                  placeholder="Enter compressor RPM"
                />
              </Form.Item>
              <Form.Item
                name="nextServiceRPM"
                label="Next Service RPM"
                tooltip="Enter the RPM at which the next service is due"
              >
                <InputNumber className="w-full" min={0} placeholder="e.g., 1000" />
              </Form.Item>
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {editingId ? "Update Compressor" : "Add Compressor"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Input.Search
          placeholder="Search by compressor name"
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
        dataSource={(compressors || []).filter((c) =>
          c.compressorName?.toLowerCase().includes(searchTerm.toLowerCase())
        )}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default CompressorManagement;
