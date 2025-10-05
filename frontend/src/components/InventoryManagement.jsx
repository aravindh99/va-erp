import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Form,
  Select,
  InputNumber,
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import api from "../service/api";

const { Title, Text } = Typography;

const InventoryManagement = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm] = Form.useForm();
  const [itemInstances, setItemInstances] = useState([]);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, instancesRes] = await Promise.all([
        api.get("/api/items"),
        api.get("/api/itemInstances")
      ]);
      
      const items = itemsRes.data.data || [];
      const instances = instancesRes.data.data || [];
      
      setItems(items);
      setItemInstances(instances);
      setStockData(items); // Items now have stock field directly
    } catch (err) {
      console.error("Error fetching inventory data", err);
      message.error("Error fetching inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Handle adding item instance
  const handleAddStock = async (values) => {
    try {
      const { itemId, quantity, nextServiceRPM, notes } = values;

      const payload = {
        itemId,
        quantity,
        nextServiceRPM: nextServiceRPM ? parseInt(nextServiceRPM) : null,
        notes
      };

      const response = await api.post("/api/stockTransactions/add-stock", payload);
      message.success(response.data.message);
      setShowAddForm(false);
      addForm.resetFields();
      fetchData();
    } catch (err) {
      console.error("Error adding stock", err);
      message.error("Error adding stock");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Stock columns
  const stockColumns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.partNumber}
          </Text>
        </div>
      ),
    },
    {
      title: "Stock Available",
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
      title: "Unit Price",
      dataIndex: "purchaseRate",
      key: "purchaseRate",
      render: (value) => `₹${value || 0}`,
    },
    {
      title: "GST %",
      dataIndex: "gst",
      key: "gst",
      render: (value) => `${value || 0}%`,
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
  ];


  // Calculate summary statistics
  const calculateSummary = () => {
    const totalItems = stockData.length;
    const totalStock = stockData.reduce((sum, item) => sum + (item.stock || 0), 0);
    const itemsInStock = stockData.filter(item => (item.stock || 0) > 0).length;
    const itemsOutOfStock = stockData.filter(item => (item.stock || 0) === 0).length;

    return {
      totalItems,
      totalStock,
      itemsInStock,
      itemsOutOfStock,
    };
  };

  const summary = calculateSummary();


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">Inventory Management</Title>
          <Text type="secondary">Track stock levels and transactions</Text>
        </div>
        <Space>
          <Button
            icon={<PlusOutlined />}
            onClick={() => setShowAddForm(true)}
            type="primary"
          >
            Add Stock
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Items"
              value={summary.totalItems}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Stock"
              value={summary.totalStock}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Items In Stock"
              value={summary.itemsInStock}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Items Out of Stock"
              value={summary.itemsOutOfStock}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Stock Table */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Input.Search
              placeholder="Search items..."
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
        </div>
        <Table
          columns={stockColumns}
          dataSource={stockData.filter(item =>
            item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add Stock Modal */}
      <Modal
        title="Add Stock to Inventory"
        open={showAddForm}
        onCancel={() => {
          setShowAddForm(false);
          addForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddStock}
        >
          <Form.Item
            name="itemId"
            label="Select Item"
            rules={[{ required: true, message: "Please select an item" }]}
          >
            <Select
              placeholder="Select item to add stock"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {items.map(item => (
                <Select.Option key={item.id} value={item.id}>
                  {item.itemName} - {item.partNumber} {item.canBeFitted ? '(Can be fitted)' : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber
              className="w-full"
              min={1}
              placeholder="Enter quantity to add"
            />
          </Form.Item>

          <Form.Item
            name="nextServiceRPM"
            label="Next Service RPM (For fitted items only)"
            tooltip="Enter the RPM at which the next service is due"
          >
            <InputNumber className="w-full" min={0} placeholder="e.g., 1000" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <Input.TextArea
              placeholder="Add any notes about this item instance"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Add Stock
              </Button>
              <Button onClick={() => {
                setShowAddForm(false);
                addForm.resetFields();
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

export default InventoryManagement;
