import { useState, useEffect } from "react";
import {
  Button,
  Table,
  Card,
  Typography,
  message,
} from "antd";
import {
  FilePdfOutlined,
} from "@ant-design/icons";
import api from "../service/api";

const { Title, Text } = Typography;

const ItemStockReport = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  // Fetch items and generate report
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/items");
      const items = res.data.data || [];
      setItems(items);
      
      // Auto-generate report with current data
      const reportData = items.map((item) => ({
        id: item.id,
        itemName: item.itemName,
        partNumber: item.partNumber,
        groupName: item.groupName,
        units: item.units,
        openingStock: item.openingStock || 0,
        inwardStock: 0, // This would come from stock transactions
        outwardStock: 0, // This would come from stock transactions
        balanceStock: item.openingStock || 0,
        unitPrice: item.purchaseRate || 0,
        totalValue: (item.openingStock || 0) * (item.purchaseRate || 0),
      }));
      setReportData(reportData);
    } catch (err) {
      console.error("Error fetching items", err);
      message.error("Error fetching items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);


  // PDF Export
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Item Stock Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .total { font-size: 18px; font-weight: bold; color: #1890ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Item Stock Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Part Number</th>
                <th>Group</th>
                <th>Units</th>
                <th>Opening Stock</th>
                <th>Inward</th>
                <th>Outward</th>
                <th>Balance</th>
                <th>Unit Price</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.map(item => `
                <tr>
                  <td>${item.itemName}</td>
                  <td>${item.partNumber || '-'}</td>
                  <td>${item.groupName || '-'}</td>
                  <td>${item.units}</td>
                  <td>${item.openingStock}</td>
                  <td>${item.inwardStock}</td>
                  <td>${item.outwardStock}</td>
                  <td>${item.balanceStock}</td>
                  <td>₹${item.unitPrice}</td>
                  <td>₹${item.totalValue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="total">Total Stock Value: ₹${reportData.reduce((sum, item) => sum + item.totalValue, 0)}</div>
            <p>Total Items: ${reportData.length}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Table columns
  const columns = [
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Part Number",
      dataIndex: "partNumber",
      key: "partNumber",
      render: (text) => text || "-",
    },
    {
      title: "Group",
      dataIndex: "groupName",
      key: "groupName",
      render: (text) => text || "-",
    },
    {
      title: "Units",
      dataIndex: "units",
      key: "units",
    },
    {
      title: "Opening Stock",
      dataIndex: "openingStock",
      key: "openingStock",
    },
    {
      title: "Inward",
      dataIndex: "inwardStock",
      key: "inwardStock",
    },
    {
      title: "Outward",
      dataIndex: "outwardStock",
      key: "outwardStock",
    },
    {
      title: "Balance",
      dataIndex: "balanceStock",
      key: "balanceStock",
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (price) => `₹${price}`,
    },
    {
      title: "Total Value",
      dataIndex: "totalValue",
      key: "totalValue",
      render: (value) => `₹${value}`,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="mb-2">Item Stock Report</Title>
          <Text type="secondary">Current stock levels for all items</Text>
        </div>
        <Button
          icon={<FilePdfOutlined />}
          onClick={exportToPDF}
          type="primary"
          danger
        >
          Export PDF
        </Button>
      </div>

      {/* Report Table */}
      <Card title="Stock Report">
        <Table
          columns={columns}
          dataSource={reportData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1200 }}
        />
        {reportData.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-8">
            <p>No stock data available</p>
            <p className="text-sm">Please select a date range and generate the report</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ItemStockReport;

