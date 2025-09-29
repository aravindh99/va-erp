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
  Switch,
} from "antd";
import {
  FilePdfOutlined,
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
      const [itemsRes, stockRes, instancesRes] = await Promise.all([
        api.get("/api/items"),
        api.get("/api/stockTransactions"),
        api.get("/api/itemInstances")
      ]);
      
      const items = itemsRes.data.data || [];
      const transactions = stockRes.data.data || [];
      const instances = instancesRes.data.data || [];
      
      setItems(items);
      setItemInstances(instances);
      
      const stockData = items.map(item => {
        const itemTransactions = transactions.filter(t => t.itemId === item.id);
        const inward = itemTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.quantity, 0);
        const outward = itemTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.quantity, 0);
        const balance = (item.openingStock || 0) + inward - outward;
        
        return {
          ...item,
          inward,
          outward,
          balance
        };
      });
      
      setStockData(stockData);
    } catch (err) {
      console.error("Error fetching inventory data", err);
      message.error("Error fetching inventory data");
    } finally {
      setLoading(false);
    }
  };

  // Handle adding item instance
  const handleAddInstance = async (values) => {
    try {
      await api.post("/api/itemInstances", values);
      message.success("Item instance added successfully");
      setShowAddForm(false);
      addForm.resetFields();
      fetchData();
    } catch (err) {
      console.error("Error adding item instance", err);
      message.error("Error adding item instance");
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
      title: "Opening Stock",
      dataIndex: "openingStock",
      key: "openingStock",
      render: (value) => (
        <Text strong>
          {value || 0}
        </Text>
      ),
    },
    {
      title: "Inward",
      dataIndex: "inward",
      key: "inward",
      render: (value) => (
        <Text style={{ color: '#1890ff' }}>
          +{value || 0}
        </Text>
      ),
    },
    {
      title: "Outward",
      dataIndex: "outward",
      key: "outward",
      render: (value) => (
        <Text style={{ color: '#ff4d4f' }}>
          -{value || 0}
        </Text>
      ),
    },
    {
      title: "Balance Quantity",
      dataIndex: "balance",
      key: "balance",
      render: (value) => (
        <Text strong style={{ 
          color: value > 0 ? '#52c41a' : '#ff4d4f' 
        }}>
          {value || 0}
        </Text>
      ),
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
    const totalInward = stockData.reduce((sum, item) => sum + (item.inward || 0), 0);
    const totalOutward = stockData.reduce((sum, item) => sum + (item.outward || 0), 0);

    return {
      totalItems,
      totalInward,
      totalOutward,
    };
  };

  const summary = calculateSummary();

  // Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Inventory Management Report - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Inventory Management Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Items:</strong> ${summary.totalItems}</p>
            <p><strong>Total Inward:</strong> ${summary.totalInward}</p>
            <p><strong>Total Outward:</strong> ${summary.totalOutward}</p>
            <p><strong>Net Balance:</strong> ${summary.totalInward - summary.totalOutward}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Part Number</th>
                <th>Opening Stock</th>
                <th>Inward</th>
                <th>Outward</th>
                <th>Balance Quantity</th>
                <th>Can Be Fitted</th>
              </tr>
            </thead>
            <tbody>
              ${stockData.map(record => `
                <tr>
                  <td>${record.itemName}</td>
                  <td>${record.partNumber || '-'}</td>
                  <td>${record.openingStock || 0}</td>
                  <td>+${record.inward || 0}</td>
                  <td>-${record.outward || 0}</td>
                  <td>${record.balance || 0}</td>
                  <td>${record.canBeFitted ? 'Yes' : 'No'}</td>
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
              title="Total Inward"
              value={summary.totalInward}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Outward"
              value={summary.totalOutward}
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
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => exportToPDF('stock')}
            type="primary"
            danger
          >
            Export PDF
          </Button>
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
        title="Add Item Stock"
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
          onFinish={handleAddInstance}
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
              {items
                .filter(item => item.canBeFitted)
                .map(item => (
                  <Select.Option key={item.id} value={item.id}>
                    {item.itemName} - {item.partNumber}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="instanceNumber"
            label="Instance Number (Optional)"
            tooltip="Leave blank for auto-generation"
          >
            <Input placeholder="e.g., Hammer-001" />
          </Form.Item>

          <Form.Item
            name="currentMeter"
            label="Initial Meter Reading (Optional)"
            rules={[{ type: 'number', min: 0 }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              placeholder="Enter initial meter reading"
            />
          </Form.Item>

          <Form.Item
            name="currentRPM"
            label="Initial RPM Reading (Optional)"
            rules={[{ type: 'number', min: 0 }]}
          >
            <InputNumber
              className="w-full"
              min={0}
              placeholder="Enter initial RPM reading"
            />
          </Form.Item>

          <Form.Item
            name="serviceSchedule"
            label="Service Schedule (RPM values)"
            tooltip="Enter RPM values when service is due, separated by commas"
          >
            <Select
              mode="tags"
              placeholder="Enter RPM values for service schedule"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
              onChange={(values) => {
                const numericValues = values.map(val => {
                  const num = parseInt(val);
                  return isNaN(num) ? 0 : num;
                }).filter(val => val > 0);
                addForm.setFieldValue('serviceSchedule', numericValues);
              }}
            />
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
