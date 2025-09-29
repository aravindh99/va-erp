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
  const [sites, setSites] = useState([]);
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
      console.log("Vehicles API response:", res.data.data); // Debug log
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
      console.log("Brands API response:", res.data.data); // Debug log
      setBrands(res.data.data || []);
    } catch (err) {
      console.error("Error fetching brands", err);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await api.get("/api/sites");
      console.log("Sites API response:", res.data.data); // Debug log
      setSites(res.data.data || []);
    } catch (err) {
      console.error("Error fetching sites", err);
    }
  };

  const fetchCompressors = async () => {
    try {
      const res = await api.get("/api/compressors");
      console.log("Compressors API response:", res.data.data); // Debug log
      setCompressors(res.data.data || []);
    } catch (err) {
      console.error("Error fetching compressors", err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    fetchBrands();
    fetchSites();
    fetchCompressors();
  }, []);

  // Handle form submit (create or update)
  const handleSubmit = async (values) => {
    try {
      // Normalize schedule inputs (accept string like "500,1000,2000" or array)
      const normalizeSchedule = (val) => {
        if (Array.isArray(val)) return val.map((n) => Number(n)).filter((n) => !isNaN(n));
        if (typeof val === "string") {
          return val
            .split(',')
            .map((s) => Number(s.trim()))
            .filter((n) => !isNaN(n));
        }
        return [];
      };

      // Build payload with only defined values
      const payload = {
        vehicleType: values.vehicleType,
        vehicleNumber: values.vehicleNumber?.toUpperCase(),
        brandId: values.brandId,
        siteId: values.siteId,
      };

      // Add optional fields only if they have values
      if (values.status) {
        payload.status = values.status;
      }
      
      if (values.vehicleRPM !== undefined && values.vehicleRPM !== null && values.vehicleRPM !== '') {
        payload.vehicleRPM = Number(values.vehicleRPM);
      }
      
      const vehicleSchedule = normalizeSchedule(values.vehicleServiceSchedule);
      if (vehicleSchedule.length > 0) {
        payload.vehicleServiceSchedule = vehicleSchedule;
      }
      
      if (values.compressorId) {
        payload.compressorId = values.compressorId;
      }
      
      if (values.compressorRPM !== undefined && values.compressorRPM !== null && values.compressorRPM !== '') {
        payload.compressorRPM = Number(values.compressorRPM);
      }
      
      const compressorSchedule = normalizeSchedule(values.compressorServiceSchedule);
      if (compressorSchedule.length > 0) {
        payload.compressorServiceSchedule = compressorSchedule;
      }

      // Debug: Log the payload being sent
      console.log("Payload being sent to backend:", payload);

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
      siteId: record.siteId || record.site?.id || undefined,
      vehicleRPM: record.vehicleRPM ?? undefined,
      vehicleServiceSchedule: Array.isArray(record.vehicleServiceSchedule)
        ? record.vehicleServiceSchedule.join(',')
        : (record.vehicleServiceSchedule || ''),
      compressorId: record.compressorId || record.compressor?.id || undefined,
      compressorRPM: record.compressorRPM ?? undefined,
      compressorServiceSchedule: Array.isArray(record.compressorServiceSchedule)
        ? record.compressorServiceSchedule.join(',')
        : (record.compressorServiceSchedule || ''),
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
          <title>Vehicle List</title>
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
                <th>Vehicle Type</th>
                <th>Vehicle Number</th>
                <th>Brand</th>
                <th>Site</th>
                <th>Vehicle RPM</th>
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
                    
                    // Get site name
                    const siteName = vehicle.site?.siteName || 
                      sites.find(s => s.id === vehicle.siteId)?.siteName || "-";
                    
                    // Get compressor name
                    const compressorName = vehicle.compressor?.compressorName || 
                      compressors.find(c => c.id === vehicle.compressorId)?.compressorName || "-";
                    
                    return `
                    <tr>
                      <td>${vehicle.vehicleType}</td>
                      <td>${vehicle.vehicleNumber}</td>
                      <td>${brandName}</td>
                      <td>${siteName}</td>
                      <td>${vehicle.vehicleRPM}</td>
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
    { title: "Vehicle Type", dataIndex: "vehicleType", key: "vehicleType" },
    { title: "Vehicle Number", dataIndex: "vehicleNumber", key: "vehicleNumber" },
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
    { 
      title: "Site", 
      key: "siteName",
      render: (_, record) => {
        // Try different ways to get site name
        if (record.site?.siteName) {
          return record.site.siteName;
        }
        if (record.siteName) {
          return record.siteName;
        }
        // Find site by ID if we have the ID
        const site = sites.find(s => s.id === record.siteId);
        return site ? site.siteName : "-";
      }
    },
    { title: "Vehicle RPM", dataIndex: "vehicleRPM", key: "vehicleRPM" },
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
        <h1 className="text-2xl font-bold">Vehicle Management</h1>
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
              {showForm ? "Cancel" : "Add Vehicle"}
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
                label="Vehicle Type"
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
                label="Vehicle Number"
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
                name="siteId"
                label="Site"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select site">
                  {sites.map((site) => (
                    <Select.Option key={site.id} value={site.id}>
                      {site.siteName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="vehicleRPM"
                label="Vehicle RPM"
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
              <Form.Item
                name="vehicleServiceSchedule"
                label="Vehicle Service Schedule (RPM)"
                tooltip="Enter comma-separated RPM values (e.g., 500,1000,2000)"
              >
                <Input placeholder="e.g., 500,1000,2000" />
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
                name="compressorRPM"
                label="Compressor RPM"
              >
                <InputNumber className="w-full" min={0} />
              </Form.Item>
              <Form.Item
                name="compressorServiceSchedule"
                label="Compressor Service Schedule (RPM)"
                tooltip="Enter comma-separated RPM values (e.g., 500,1000,2000)"
              >
                <Input placeholder="e.g., 500,1000,2000" />
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
                {editingId ? "Update Vehicle" : "Add Vehicle"}
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
