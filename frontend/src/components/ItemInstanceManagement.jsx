import { useState, useEffect } from "react";
import {
  Button,
  Table,
  Tag,
  Space,
  Form,
  Input,
  InputNumber,
  Modal,
  message,
  Row,
  Col,
  Typography,
  Card,
  Popconfirm,
  Select,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit, canDelete, canCreate, getUserRole } from "../service/auth";

const { Title } = Typography;

const ItemInstanceManagement = () => {
  const [form] = Form.useForm();
  const [itemInstances, setItemInstances] = useState([]);
  const [items, setItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [instancesRes, itemsRes, vehiclesRes] = await Promise.all([
        api.get("/api/itemInstances?include=item,vehicle"),
        api.get("/api/items?canBeFitted=true"),
        api.get("/api/vehicles"),
      ]);

      setItemInstances(instancesRes.data.data || []);
      setItems(itemsRes.data.data || []);
      setVehicles(vehiclesRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data", err);
      message.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data
  const filteredInstances = itemInstances.filter((instance) => {
    const matchesSearch = 
      instance.instanceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.item?.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instance.item?.partNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || instance.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      const processedValues = {
        ...values,
        nextServiceRPM: values.nextServiceRPM ? parseInt(values.nextServiceRPM) : null
      };


      if (editingId) {
        await api.put(`/api/itemInstances/${editingId}`, processedValues);
        message.success("Item instance updated successfully");
      } else {
        await api.post("/api/itemInstances", processedValues);
        message.success("Item instance created successfully");
      }
      
      setShowForm(false);
      setEditingId(null);
      form.resetFields();
      fetchData();
    } catch (err) {
      console.error("Error saving item instance", err);
      message.error("Error saving item instance");
    }
  };

  // Handle edit
  const handleEdit = (record) => {
    setEditingId(record.id);
    setShowForm(true);
    form.setFieldsValue({
      ...record,
      nextServiceRPM: record.nextServiceRPM ?? undefined,
    });
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/itemInstances/${id}`);
      message.success("Item instance deleted successfully");
      fetchData();
    } catch (err) {
      console.error("Error deleting item instance", err);
      message.error("Error deleting item instance");
    }
  };

  // Handle create new
  const handleCreate = () => {
    setEditingId(null);
    setShowForm(true);
    form.resetFields();
  };


  // Table columns
  const columns = [
    {
      title: "Instance Number",
      dataIndex: "instanceNumber",
      key: "instanceNumber",
      sorter: (a, b) => a.instanceNumber.localeCompare(b.instanceNumber),
    },
    {
      title: "Item Name",
      dataIndex: ["item", "itemName"],
      key: "itemName",
    },
    {
      title: "Part Number",
      dataIndex: ["item", "partNumber"],
      key: "partNumber",
    },
    {
      title: "Current RPM",
      dataIndex: "currentRPM",
      key: "currentRPM",
      render: (rpm) => rpm?.toLocaleString() || "0",
    },
    {
      title: "Next Service RPM",
      dataIndex: "nextServiceRPM",
      key: "nextServiceRPM",
      render: (value) => value || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = status === "fitted" ? "green" : "orange";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Fitted To",
      dataIndex: ["vehicle", "vehicleNumber"],
      key: "vehicleNumber",
      render: (vehicleNumber) => vehicleNumber || "-",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {canEdit() && (
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>
          )}
          {canDelete() && (
            <Popconfirm
              title="Are you sure to delete this item instance?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                size="small"
                icon={<DeleteOutlined />}
                danger
              >
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
      <div className="flex justify-between items-center">
        <Title level={2}>
          <ToolOutlined className="mr-2" />
          Item Instance Management
        </Title>
        {canCreate() && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            disabled={loading}
          >
            Add Item Instance
          </Button>
        )}
        {!canCreate() && (
          <div style={{ color: 'red' }}>
            No edit permission (Role: {getUserRole()})
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Input
              placeholder="Search by instance number, item name, or part number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
            >
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="in_stock">In Stock</Select.Option>
              <Select.Option value="fitted">Fitted</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredInstances}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

      {/* Form Modal */}
      <Modal
        title={editingId ? "Edit Item Instance" : "Add Item Instance"}
        open={showForm}
        onCancel={() => {
          setShowForm(false);
          setEditingId(null);
          form.resetFields();
        }}
        onOk={() => {
          form.submit();
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="itemId"
                label="Item"
                rules={[{ required: true, message: "Please select an item" }]}
              >
                <Select placeholder="Select item">
                  {items.map((item) => (
                    <Select.Option key={item.id} value={item.id}>
                      {item.itemName} ({item.partNumber})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="instanceNumber"
                label="Instance Number"
                rules={[{ required: true, message: "Please enter instance number" }]}
              >
                <Input placeholder="e.g., Hammer-001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="currentRPM"
                label="Current RPM"
                rules={[{ required: true, message: "Please enter current RPM" }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nextServiceRPM"
                label="Next Service RPM"
                help="Enter the RPM at which the next service is due"
              >
                <InputNumber className="w-full" min={0} placeholder="e.g., 1000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} placeholder="Additional notes" />
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default ItemInstanceManagement;
