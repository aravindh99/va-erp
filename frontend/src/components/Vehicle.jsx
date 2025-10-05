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
  Card,
  Popconfirm,
  message,
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

const Vehicle = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [brands, setBrands] = useState([]);
  const [compressors, setCompressors] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  });

  // Fetch data
  const fetchVehicles = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/vehicles?page=${page}&limit=${limit}`);
      setVehicles(res.data.data || []);
      
      // Update pagination state
      setPagination(prev => ({
        ...prev,
        current: res.data.page || page,
        total: res.data.total || 0,
        pageSize: res.data.limit || limit,
      }));
    } catch (err) {
      console.error("Error fetching vehicles", err);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handleTableChange = (pagination) => {
    fetchVehicles(pagination.current, pagination.pageSize);
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get("/api/brands");
      setBrands(res.data.data || []);
    } catch (err) {
      console.error("Error fetching brands", err);
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

  useEffect(() => {
    fetchVehicles();
    fetchBrands();
    fetchCompressors();
  }, []);

  // Handle form submit (create or update)
  const handleSubmit = async (values) => {
    try {

      // Build payload with only defined values
      const payload = {
        vehicleType: values.vehicleType,
        vehicleNumber: values.vehicleNumber?.toUpperCase(),
        brandId: values.brandId,
      };

      // Add optional fields only if they have values
      if (values.status) {
        payload.status = values.status;
      }
      
      if (values.vehicleRPM !== undefined && values.vehicleRPM !== null && values.vehicleRPM !== '') {
        payload.vehicleRPM = Number(values.vehicleRPM);
      }
      
      if (values.nextServiceRPM !== undefined && values.nextServiceRPM !== null && values.nextServiceRPM !== '') {
        payload.nextServiceRPM = Number(values.nextServiceRPM);
      }
      
      if (values.compressorId) {
        payload.compressorId = values.compressorId;
      }
      


      if (editingId) {
        await api.put(`/api/vehicles/${editingId}`, payload);
        message.success("Vehicle updated successfully");
      } else {
        const res = await api.post("/api/vehicles", payload);
        setVehicles([res.data.data, ...vehicles]);
        message.success("Vehicle created successfully");
      }

      setShowForm(false);
      setEditingId(null);
      form.resetFields();
      fetchVehicles();
    } catch (err) {
      console.error("Error saving vehicle", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to save vehicle";
      message.error(`Error: ${errorMessage}`);
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingId(record.id);
    setShowForm(true);
    form.setFieldsValue({
      vehicleType: record.vehicleType || undefined,
      vehicleNumber: record.vehicleNumber || undefined,
      status: record.status || undefined,
      brandId: record.brandId || record.brand?.id || undefined,
      vehicleRPM: record.vehicleRPM ?? undefined,
      nextServiceRPM: record.nextServiceRPM ?? undefined,
      compressorId: record.compressorId || record.compressor?.id || undefined,
    });
  };

  // Handle hard delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/vehicles/${id}/hard`);
      setVehicles(vehicles.filter((vehicle) => vehicle.id !== id));
    } catch (err) {
      console.error("Error deleting vehicle", {
        status: err.response?.status,
        data: err.response?.data,
      });
    }
  };

  // PDF Export
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Machine List</title>
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
            <h1>Vehicle List</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Machine Type</th>
                <th>Machine Number</th>
                <th>Brand</th>
                <th>Machine RPM</th>
                <th>Next Service RPM</th>
                <th>Compressor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${(vehicles || [])
                .filter((v) =>
                  v.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(
                  (vehicle) => {
                    // Get brand name
                    const brandName = vehicle.brand?.brandName || 
                      brands.find(b => b.id === vehicle.brandId)?.brandName || "-";
                    
                    
                    // Get compressor name
                    const compressorName = vehicle.compressor?.compressorName || 
                      compressors.find(c => c.id === vehicle.compressorId)?.compressorName || "-";
                    
                    return `
                    <tr>
                      <td>${vehicle.vehicleType}</td>
                      <td>${vehicle.vehicleNumber}</td>
                      <td>${brandName}</td>
                      <td>${vehicle.vehicleRPM || '-'}</td>
                      <td>${vehicle.nextServiceRPM || '-'}</td>
                      <td>${compressorName}</td>
                      <td>${vehicle.status}</td>
                    </tr>`;
                  }
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
    { title: "Machine Type", dataIndex: "vehicleType", key: "vehicleType" },
    { title: "Machine Number", dataIndex: "vehicleNumber", key: "vehicleNumber" },
    { 
      title: "Brand", 
      key: "brandName",
      render: (_, record) => {
        // Try different ways to get brand name
        if (record.brand?.brandName) {
          return record.brand.brandName;
        }
        if (record.brandName) {
          return record.brandName;
        }
        // Find brand by ID if we have the ID
        const brand = brands.find(b => b.id === record.brandId);
        return brand ? brand.brandName : "-";
      }
    },
    { title: "Machine RPM", dataIndex: "vehicleRPM", key: "vehicleRPM" },
    { title: "Next Service RPM", dataIndex: "nextServiceRPM", key: "nextServiceRPM", render: (value) => value || "-" },
    { 
      title: "Compressor", 
      key: "compressorName",
      render: (_, record) => {
        // Try different ways to get compressor name
        if (record.compressor?.compressorName) {
          return record.compressor.compressorName;
        }
        if (record.compressorName) {
          return record.compressorName;
        }
        // Find compressor by ID if we have the ID
        const compressor = compressors.find(c => c.id === record.compressorId);
        return compressor ? compressor.compressorName : "-";
      }
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
            onClick={() => navigate(`/reports/vehicle-service/${record.id}`)}
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
        <h1 className="text-2xl font-bold">Machine Management</h1>
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
              {showForm ? "Cancel" : "Add Machine"}
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
                name="vehicleType"
                label="Machine Type"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select vehicle type">
                  <Select.Option value="Truck">Truck</Select.Option>
                  <Select.Option value="Crawler">Crawler</Select.Option>
                  <Select.Option value="Camper">Camper</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="vehicleNumber"
                label="Machine Number"
                rules={[{ required: true }]}
              >
                <Input 
                  placeholder="e.g., TN01AB1234" 
                  onChange={(e) => {
                    const upperValue = e.target.value.toUpperCase();
                    form.setFieldValue('vehicleNumber', upperValue);
                  }}
                />
              </Form.Item>
              <Form.Item
                name="brandId"
                label="Brand"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select brand">
                  {brands.map((brand) => (
                    <Select.Option key={brand.id} value={brand.id}>
                      {brand.brandName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="vehicleRPM"
                label="Machine RPM"
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
              <Form.Item
                name="nextServiceRPM"
                label="Next Service RPM"
                tooltip="Enter the RPM at which the next service is due"
              >
                <InputNumber className="w-full" min={0} placeholder="e.g., 1000" />
              </Form.Item>
              <Form.Item
                name="compressorId"
                label="Compressor"
              >
                <Select placeholder="Select compressor" allowClear>
                  {compressors.map((compressor) => (
                    <Select.Option key={compressor.id} value={compressor.id}>
                      {compressor.compressorName}
                    </Select.Option>
                  ))}
                </Select>
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
            </div>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {editingId ? "Update Machine" : "Add Machine"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Search */}
      <div style={{ marginBottom: 20, display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Input.Search
          placeholder="Search by vehicle number"
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
        dataSource={(vehicles || []).filter((v) =>
          v.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        )}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} vehicles`
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default Vehicle;
