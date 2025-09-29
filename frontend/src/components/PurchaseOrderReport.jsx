import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Select,
  DatePicker,
  Space,
  message,
  Table,
} from "antd";
import {
  FilePdfOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const PurchaseOrderReport = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [poData, setPoData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      let url = `/api/pos?startDate=${startDate}&endDate=${endDate}`;
      if (selectedSupplier) {
        url += `&supplierId=${selectedSupplier}`;
      }
      
      const res = await api.get(url);
      const pos = res.data.data || [];
      
      // Fetch related data for each PO
      const enrichedPos = await Promise.all(pos.map(async (po) => {
        try {
          const [supplierRes, addressRes, itemsRes] = await Promise.all([
            api.get(`/api/suppliers/${po.supplierId}`),
            po.addressId ? api.get(`/api/addresses/${po.addressId}`) : Promise.resolve({ data: { data: null } }),
            api.get(`/api/poItems?poId=${po.id}`)
          ]);
          
          return {
            ...po,
            supplier: supplierRes.data.data,
            address: addressRes.data.data,
            items: itemsRes.data.data || []
          };
        } catch (err) {
          console.error(`Error fetching data for PO ${po.id}:`, err);
          return { ...po, supplier: null, address: null, items: [] };
        }
      }));
      
      setPoData(enrichedPos);
    } catch (err) {
      console.error("Error fetching PO data", err);
      message.error("Error fetching PO data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/api/suppliers');
      setSuppliers(res.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/api/addresses');
      setAddresses(res.data.data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchAddresses();
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedSupplier]);

  // Generate PO PDF in the format from the image
  const generatePOPDF = (po) => {
    const printWindow = window.open("", "_blank");
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${po.orderNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              font-size: 12px;
              line-height: 1.4;
            }
            .header { 
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 10px;
            }
            .company-details { 
              font-size: 12px; 
              color: #666;
            }
            .po-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .po-info {
              width: 48%;
            }
            .po-info h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 14px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .po-info p {
              margin: 2px 0;
              color: #666;
            }
            .addresses { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 30px;
            }
            .address-section { 
              width: 45%; 
            }
            .address-section h3 { 
              margin: 0 0 10px 0; 
              color: #333; 
              font-size: 14px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .address-section p { 
              margin: 2px 0; 
              color: #666;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .items-table th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .items-table .text-right {
              text-align: right;
            }
            .totals {
              margin-left: auto;
              width: 300px;
            }
            .totals table {
              width: 100%;
              border-collapse: collapse;
            }
            .totals td {
              padding: 5px 10px;
              border: 1px solid #ddd;
            }
            .totals .label {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .totals .amount {
              text-align: right;
            }
            .notes {
              margin-top: 30px;
              padding: 15px;
              background-color: #f8f9fa;
              border: 1px solid #ddd;
            }
            .notes h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 14px;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 200px;
              text-align: center;
            }
            .signature-line {
              border-bottom: 1px solid #333;
              height: 40px;
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">VA CONSTRUCTION</div>
            <div class="company-details">
              <p>Address: 123 Construction Street, Building City, BC 12345</p>
              <p>Phone: (555) 123-4567 | Email: info@vaconstruction.com</p>
              <p>GST: 12ABCDE1234F1Z5</p>
            </div>
          </div>

          <div class="po-details">
            <div class="po-info">
              <h3>Purchase Order Details</h3>
              <p><strong>PO Number:</strong> ${po.orderNumber}</p>
              <p><strong>PO Date:</strong> ${dayjs(po.orderDate).format('DD/MM/YYYY')}</p>
              <p><strong>Status:</strong> ${po.status === 'received' ? 'Received' : 'Pending'}</p>
              ${po.receivedAt ? `<p><strong>Received Date:</strong> ${dayjs(po.receivedAt).format('DD/MM/YYYY')}</p>` : ''}
              ${po.receivedBy ? `<p><strong>Received By:</strong> ${po.receivedBy}</p>` : ''}
            </div>
            <div class="po-info">
              <h3>Supplier Information</h3>
              <p><strong>Supplier:</strong> ${po.supplier?.supplierName || 'N/A'}</p>
              <p><strong>GST:</strong> ${po.supplier?.gstNumber || 'N/A'}</p>
              <p><strong>Phone:</strong> ${po.supplier?.phone || 'N/A'}</p>
              <p><strong>Email:</strong> ${po.supplier?.email || 'N/A'}</p>
            </div>
          </div>

          <div class="addresses">
            <div class="address-section">
              <h3>Billing Address</h3>
              <p>${po.address?.addressBill || 'N/A'}</p>
            </div>
            <div class="address-section">
              <h3>Shipping Address</h3>
              <p>${po.address?.addressShip || 'N/A'}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Item Name</th>
                <th>Part Number</th>
                <th>Group</th>
                <th>Units</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.itemName || 'N/A'}</td>
                  <td>${item.partNumber || 'N/A'}</td>
                  <td>${item.groupName || 'N/A'}</td>
                  <td>${item.units || 'N/A'}</td>
                  <td class="text-right">${item.quantity || 0}</td>
                  <td class="text-right">₹${(item.rate || 0).toFixed(2)}</td>
                  <td class="text-right">₹${(item.amount || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td class="label">Sub Total:</td>
                <td class="amount">₹${(po.subTotal || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label">GST (${po.gstPercent || 0}%):</td>
                <td class="amount">₹${(po.taxTotal || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td class="label"><strong>Grand Total:</strong></td>
                <td class="amount"><strong>₹${(po.grandTotal || 0).toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>

          ${po.notes ? `
            <div class="notes">
              <h3>Notes:</h3>
              <p>${po.notes}</p>
            </div>
          ` : ''}

          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>Authorized Signature</p>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>Supplier Signature</p>
            </div>
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
      title: "PO Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
    },
    {
      title: "Date",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Supplier",
      key: "supplier",
      render: (_, record) => record.supplier?.supplierName || 'N/A',
    },
    {
      title: "Items Count",
      key: "itemsCount",
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: "Sub Total",
      dataIndex: "subTotal",
      key: "subTotal",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
    },
    {
      title: "GST",
      dataIndex: "taxTotal",
      key: "taxTotal",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
    },
    {
      title: "Grand Total",
      dataIndex: "grandTotal",
      key: "grandTotal",
      render: (value) => `₹${(value || 0).toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span style={{ 
          color: status === 'received' ? '#52c41a' : '#faad14',
          fontWeight: 'bold'
        }}>
          {status === 'received' ? 'Received' : 'Pending'}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={() => generatePOPDF(record)}
          size="small"
        >
          Export PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">
            Purchase Order Report
            {selectedSupplierName && ` - ${selectedSupplierName}`}
          </Title>
          <Text type="secondary">
            {dateRange[0].format('DD/MM/YYYY')} to {dateRange[1].format('DD/MM/YYYY')}
            {selectedSupplierName && ` | Supplier: ${selectedSupplierName}`}
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <Text strong>Date Range:</Text>
            <DatePicker.RangePicker
              className="w-full mt-1"
              value={dateRange}
              onChange={setDateRange}
              format="DD/MM/YYYY"
            />
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>Filter by Supplier:</Text>
            <Select
              className="w-full mt-1"
              placeholder="All suppliers"
              value={selectedSupplier}
              onChange={(value) => {
                setSelectedSupplier(value);
                const supplier = suppliers.find(s => s.id === value);
                setSelectedSupplierName(supplier ? supplier.supplierName : '');
              }}
              allowClear
            >
              {suppliers.map(supplier => (
                <Select.Option key={supplier.id} value={supplier.id}>
                  {supplier.supplierName}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Button
              onClick={() => {
                setDateRange([dayjs().subtract(30, 'days'), dayjs()]);
                setSelectedSupplier('');
                setSelectedSupplierName('');
              }}
              style={{ marginTop: '24px' }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* PO Data Table */}
      <Card>
        <Title level={4}>Purchase Orders</Title>
        <Table
          columns={columns}
          dataSource={poData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default PurchaseOrderReport;
