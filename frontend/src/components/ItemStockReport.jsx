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

  // Fetch items and generate comprehensive report
  const fetchItems = async () => {
    setLoading(true);
    try {
      const [itemsRes, instancesRes] = await Promise.all([
        api.get("/api/items"),
        api.get("/api/itemInstances")
      ]);
      
      const items = itemsRes.data.data || [];
      const instances = instancesRes.data.data || [];
      setItems(items);
      
      // Auto-generate comprehensive report with current data
      const reportData = items.map((item) => {
        const itemInstances = instances.filter(instance => instance.itemId === item.id);
        const fittedInstances = itemInstances.filter(instance => instance.status === 'fitted');
        const inStockInstances = itemInstances.filter(instance => instance.status === 'in_stock');
        
        return {
          id: item.id,
          itemName: item.itemName,
          partNumber: item.partNumber,
          groupName: item.groupName,
          units: item.units,
          stock: item.stock || 0,
          unitPrice: item.purchaseRate || 0,
          totalValue: (item.stock || 0) * (item.purchaseRate || 0),
          gst: item.gst || 0,
          canBeFitted: item.canBeFitted || false,
          totalInstances: itemInstances.length,
          fittedInstances: fittedInstances.length,
          inStockInstances: inStockInstances.length,
          instances: itemInstances,
        };
      });
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
                <th>Stock Available</th>
                <th>Unit Price</th>
                <th>GST %</th>
                <th>Can Be Fitted</th>
                <th>Instances</th>
                <th>Fitted</th>
                <th>In Stock</th>
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
                  <td style="color: ${item.stock > 0 ? 'green' : 'red'}; font-weight: bold;">${item.stock}</td>
                  <td>₹${item.unitPrice}</td>
                  <td>${item.gst}%</td>
                  <td>${item.canBeFitted ? 'Yes' : 'No'}</td>
                  <td>${item.totalInstances}</td>
                  <td style="color: ${item.fittedInstances > 0 ? 'blue' : 'gray'}; font-weight: bold;">${item.fittedInstances}</td>
                  <td style="color: ${item.inStockInstances > 0 ? 'green' : 'gray'}; font-weight: bold;">${item.inStockInstances}</td>
                  <td>₹${item.totalValue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h3>Detailed Item Instances</h3>
          ${reportData.filter(item => item.canBeFitted && item.instances.length > 0).map(item => `
            <div class="item-detail">
              <h4>${item.itemName} (${item.partNumber || 'No Part Number'})</h4>
              <p><strong>Total Instances:</strong> ${item.totalInstances} | <strong>Fitted:</strong> ${item.fittedInstances} | <strong>In Stock:</strong> ${item.inStockInstances}</p>
              ${item.instances.length > 0 ? `
                <table style="width: 100%; margin-top: 10px; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f5f5f5;">
                      <th style="border: 1px solid #ddd; padding: 8px;">Instance Number</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">Current RPM</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">Next Service RPM</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">Fitted To</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${item.instances.map(instance => `
                      <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${instance.instanceNumber}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; color: ${instance.status === 'fitted' ? 'blue' : 'green'}; font-weight: bold;">${instance.status}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${instance.currentRPM || 0}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${instance.nextServiceRPM || 'Not set'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${instance.fittedToVehicle ? instance.fittedToVehicle.vehicleNumber || 'Unknown' : '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : ''}
            </div>
          `).join('')}
          
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
      title: "Stock Available",
      dataIndex: "stock",
      key: "stock",
      render: (value) => (
        <span style={{ 
          color: value > 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          {value}
        </span>
      ),
    },
    {
      title: "Unit Price",
      dataIndex: "unitPrice",
      key: "unitPrice",
      render: (price) => `₹${price}`,
    },
    {
      title: "GST %",
      dataIndex: "gst",
      key: "gst",
      render: (gst) => `${gst}%`,
    },
    {
      title: "Can Be Fitted",
      dataIndex: "canBeFitted",
      key: "canBeFitted",
      render: (value) => (
        <span style={{ 
          color: value ? '#1890ff' : '#8c8c8c',
          fontWeight: 'bold'
        }}>
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      title: "Total Instances",
      dataIndex: "totalInstances",
      key: "totalInstances",
      render: (value) => value || 0,
    },
    {
      title: "Fitted",
      dataIndex: "fittedInstances",
      key: "fittedInstances",
      render: (value) => (
        <span style={{ 
          color: value > 0 ? '#1890ff' : '#8c8c8c',
          fontWeight: 'bold'
        }}>
          {value || 0}
        </span>
      ),
    },
    {
      title: "In Stock",
      dataIndex: "inStockInstances",
      key: "inStockInstances",
      render: (value) => (
        <span style={{ 
          color: value > 0 ? '#52c41a' : '#8c8c8c',
          fontWeight: 'bold'
        }}>
          {value || 0}
        </span>
      ),
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

