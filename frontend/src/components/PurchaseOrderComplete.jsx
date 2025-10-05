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
  DatePicker,
  Row,
  Col,
  Typography,
  Divider,
  message,
  Modal,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import { canEdit, canDelete } from "../service/auth";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

const PurchaseOrderComplete = () => {
  const [form] = Form.useForm();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [showPODetails, setShowPODetails] = useState(false);
  const [dateFilter, setDateFilter] = useState(null);
  const [monthFilter, setMonthFilter] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm] = Form.useForm();
  const [poItems, setPoItems] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm] = Form.useForm();
  const [gstInclude, setGstInclude] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  });

  // Fetch data
  const fetchData = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const [posRes, suppliersRes, addressesRes, itemsRes] = await Promise.all([
        api.get(`/api/pos?page=${page}&limit=${limit}`),
        api.get("/api/suppliers"),
        api.get("/api/address"),
        api.get("/api/items"),
      ]);
      
      setPurchaseOrders(posRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setAddresses(addressesRes.data.data || []);
      setItems(itemsRes.data.data || []);
      
      // Update pagination state
      setPagination(prev => ({
        ...prev,
        current: posRes.data.page || page,
        total: posRes.data.total || 0,
        pageSize: posRes.data.limit || limit,
      }));
    } catch (err) {
      console.error("Error fetching data", err);
      message.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Handle pagination change
  const handleTableChange = (pagination) => {
    fetchData(pagination.current, pagination.pageSize);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync GST state with form values
  useEffect(() => {
    const gstValue = createForm.getFieldValue('gstInclude');
    if (gstValue !== undefined) {
      setGstInclude(gstValue);
    }
  }, [createForm]);

  // Watch for GST include changes to trigger re-render
  const handleGstIncludeChange = (value) => {
    setGstInclude(value);
  };

  // Generate PO number for display
  const generatePONumberForDisplay = async () => {
    try {
      const res = await api.get("/api/pos/generate-ref");
      return res.data.refNo;
    } catch (err) {
      console.error("Error generating PO number for display", err);
      return "VA/25-26/001"; // Fallback
    }
  };

  // Handle form submit (create or update)
  const handleSubmit = async (values) => {
    try {
      const payload = {
        orderNumber: values.orderNumber,
        orderDate: values.orderDate ? values.orderDate.format("YYYY-MM-DD") : null,
        gstInclude: values.gstInclude,
        gstPercent: values.gstInclude ? (values.gstPercent || 18.0) : 0,
        supplierId: values.supplierId,
        addressId: values.addressId,
        shippingAddressId: values.shippingAddressId,
        notes: values.notes,
        createdBy: localStorage.getItem("username"),
        updatedBy: localStorage.getItem("username"),
        items: poItems.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          rate: item.rate
        }))
      };


      if (editingId) {
        await api.put(`/api/pos/${editingId}`, payload);
        message.success("Purchase order updated successfully");
        
      } else {
        const res = await api.post("/api/pos", payload);
        setPurchaseOrders([res.data.data, ...purchaseOrders]);
        message.success("Purchase order created successfully");
      }

      setShowForm(false);
      setShowCreateForm(false);
      setEditingId(null);
      setPoItems([]);
      form.resetFields();
      createForm.resetFields();
      fetchData();
    } catch (err) {
      console.error("Error saving purchase order", err);
      message.error("Error saving purchase order");
    }
  };

  // Handle edit
  // const handleEdit = (record) => {
  //   setEditingId(record.id);
  //   setShowCreateForm(true);
  //   setGstInclude(record.gstInclude);
  //   createForm.setFieldsValue({
  //     ...record,
  //     orderDate: record.orderDate ? dayjs(record.orderDate) : null,
  //     shippingAddressId: record.shippingAddressId || record.addressId, // Default to billing address if no shipping address
  //   });
  //   // Reset GST state when editing
  //   setTimeout(() => {
  //     setGstInclude(record.gstInclude);
  //   }, 100);
  // };

  const handleEdit = (record) => {
  setEditingId(record.id);
  setShowCreateForm(true);
  setGstInclude(record.gstInclude);

  // Pre-fill PO Items
  setPoItems(record.poItems?.map(pi => ({
    id: pi.id,
    itemId: pi.itemId,
    quantity: pi.quantity,
    rate: pi.rate,
    total: pi.total,
    item: pi.item
  })) || []);

  // Pre-fill form fields
  createForm.setFieldsValue({
    orderNumber: record.orderNumber,
    orderDate: record.orderDate ? dayjs(record.orderDate) : null,
    gstInclude: record.gstInclude,
    gstPercent: record.gstPercent,
    supplierId: record.supplierId,
    addressId: record.addressId,
    shippingAddressId: record.shippingAddressId || record.addressId,
    notes: record.notes,
  });

  // Reset GST state after 100ms
  setTimeout(() => {
    setGstInclude(record.gstInclude);
  }, 100);
  };


  // Handle delete
  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/pos/${id}`, { data: {} });
      setPurchaseOrders(purchaseOrders.filter((po) => po.id !== id));
      message.success("Purchase order deleted successfully");
    } catch (err) {
      console.error("Error deleting purchase order", err);
      message.error("Error deleting purchase order");
    }
  };

  const markAsReceived = async (record) => {
    try {
      const res = await api.post(`/api/pos/${record.id}/receive`);
      const updated = res?.data?.data?.po;
      message.success('PO received successfully');
      if (updated) {
        setPurchaseOrders((prev) => prev.map((po) => po.id === updated.id ? { ...po, status: updated.status, receivedBy: updated.receivedBy, receivedAt: updated.receivedAt, updatedBy: updated.updatedBy } : po));
      }
      fetchData();
    } catch (err) {
      console.error("Error receiving PO", err);
      const msg = err?.response?.data?.message || "Error receiving PO";
      message.error(msg);
    }
  };

  // Add item to PO items list
  const addItemToPO = (values) => {
    const selectedItem = items.find(item => item.id === values.itemId);
    const newItem = {
      id: Date.now(), // Temporary ID for frontend
      itemId: values.itemId,
      quantity: Number(values.quantity),
      rate: Number(values.rate),
      total: Number(values.quantity) * Number(values.rate),
      item: selectedItem
    };
    
    setPoItems([...poItems, newItem]);
    setShowItemForm(false);
    itemForm.resetFields();
    message.success("Item added to PO");
  };

  // Remove item from PO items list
  const removeItemFromPO = (itemId) => {
    setPoItems(poItems.filter(item => item.id !== itemId));
    message.success("Item removed from PO");
  };

  // Calculate totals
  const calculateTotals = () => {
    const subTotal = poItems.reduce((sum, item) => sum + item.total, 0);
    const gstPercent = createForm.getFieldValue('gstPercent') || 18;
    const gstIncludeValue = createForm.getFieldValue('gstInclude');
    const taxTotal = gstIncludeValue ? subTotal * (gstPercent / 100) : 0;
    const grandTotal = subTotal + taxTotal;
    
    return { subTotal, taxTotal, grandTotal };
  };

  // Handle edit item
  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setShowItemForm(true);
    itemForm.setFieldsValue({
      itemId: item.itemId,
      quantity: item.quantity,
      rate: item.rate,
    });
  };

  // Handle delete item
  const handleDeleteItem = async (itemId) => {
    try {
      await api.delete(`/api/poItems/${itemId}`, { data: {} });
      message.success("PO item deleted successfully");
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Error deleting PO item", err);
      message.error("Error deleting PO item");
    }
  };

  // View PO details
  const viewPODetails = (record) => {
    const supplier = suppliers.find(s => s.id === record.supplierId);
    const address = addresses.find(a => a.id === record.addressId);
    
    setSelectedPO({
      ...record,
      supplier,
      address,
    });
    setShowPODetails(true);
  };

  // Generate PO PDF - Exact Format Implementation
  const generatePOPDF = (po) => {
    const printWindow = window.open("", "_blank");
    
    // Get supplier and address details
    const supplier = po.supplier;
    const address = po.address;
    
    // Calculate totals
    let subTotal = 0;
    let totalGST = 0;
    let grandTotal = 0;
    
    const itemsWithCalculations = (po.poItems || []).map((poItem, index) => {
      const unitPrice = poItem.rate;
      const amount = poItem.quantity * unitPrice;
      const gstAmount = po.gstInclude && po.gstPercent ? (amount * po.gstPercent) / 100 : 0;
      const totalAmount = amount + gstAmount;
      
      subTotal += amount;
      totalGST += gstAmount;
      grandTotal += totalAmount;
      
      return {
        ...poItem,
        unitPrice,
        amount,
        gstAmount,
        totalAmount,
        serialNumber: index + 1
      };
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order - ${po.orderNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 10px; 
              font-size: 10px;
              line-height: 1.2;
            }
            .document-border {
              border: 2px solid #000;
              padding: 10px;
              min-height: 100vh;
            }
            .company-name { 
              font-size: 20px; 
              font-weight: bold; 
              text-align: center;
              margin-bottom: 3px;
            }
            .contact-row {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .po-title {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              margin: 10px 0;
            }
            .date-po-section {
              text-align: right;
              margin-bottom: 10px;
            }
            .to-section {
              margin: 10px 0;
            }
            .to-section h4 {
              margin: 3px 0;
              font-size: 12px;
            }
            .addresses-section {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
            }
            .address-box {
              width: 48%;
            }
            .address-box h4 {
              margin: 3px 0;
              font-size: 12px;
              text-decoration: underline;
            }
            .subject-section {
              margin: 10px 0;
            }
            .subject-section h4 {
              margin: 3px 0;
              font-size: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
              font-size: 9px;
            }
            table th, table td {
              border: 1px solid #000;
              padding: 4px;
              text-align: left;
            }
            table th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .total-section {
              margin-top: 10px;
              text-align: right;
            }
            .total-section table {
              width: 250px;
              margin-left: auto;
            }
            .footer-section {
              margin-top: 20px;
              text-align: right;
            }
            .signature-line {
              margin-top: 30px;
              border-top: 1px solid #000;
              width: 150px;
              display: inline-block;
            }
            .kind-attention {
              margin: 5px 0;
            }
            .kind-attention h4 {
              margin: 3px 0;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; padding: 8px; }
              .document-border { padding: 8px; }
            }
          </style>
        </head>
        <body>
          <div class="document-border">
            <!-- Company Header -->
            <div class="company-name">VENKATESWARA ASSOCIATES</div>
            <div class="contact-row">
              <span>Email: ${address?.email || 'N/A'}</span>
              <span>Phone: ${address?.phone || 'N/A'}</span>
            </div>

            <!-- Title -->
            <div class="po-title">PURCHASE ORDER</div>

            <!-- Date and PO Number -->
            <div class="date-po-section">
              <strong>DATE: ${new Date(po.orderDate).toLocaleDateString('en-GB')}</strong><br>
              <strong>PO NO: ${po.orderNumber}</strong>
            </div>

            <!-- To Section -->
            <div class="to-section">
              <h4>To:</h4>
              <div><strong>${supplier?.supplierName || 'N/A'}</strong></div>
              <div>${supplier?.address || 'N/A'}</div>
              
              <div class="kind-attention">
                <h4>KIND ATTENTION: ${supplier?.supplierName || 'N/A'}</h4>
                <div><strong>PH No: ${supplier?.phone || 'N/A'}</strong></div>
              </div>
            </div>

            <!-- Addresses Section -->
            <div class="addresses-section">
              <div class="address-box">
                <h4>BILLING ADDRESS</h4>
                <div>${address?.addressBill || 'N/A'}</div>
                <div>GST IN: ${supplier?.gstNumber || 'N/A'}</div>
              </div>
              <div class="address-box">
                <h4>SHIPPING ADDRESS [DOOR DELIVERY]</h4>
                <div>${address?.addressShip || 'N/A'}</div>
                <div>Contact: ${address?.phone || 'N/A'}</div>
              </div>
            </div>

            <!-- Subject Section -->
            <div class="subject-section">
              <h4>Sub: Purchase Order of Parts</h4>
              <h4>Dear Sir/mam</h4>
              <div>Kindly Arrange the parts as per PO as soon as earliest.</div>
            </div>

            <!-- Items Table -->
            <table>
              <thead>
                <tr>
                  <th>SN</th>
                  <th>PRODUCT DESCRIPTION</th>
                  <th>QTY</th>
                  <th>UNIT PRICE</th>
                  <th>AMOUNT</th>
                  ${po.gstInclude ? `<th>GST ${po.gstPercent || 0}%</th>` : ''}
                  <th>TOTAL AMT</th>
                </tr>
              </thead>
              <tbody>
                ${itemsWithCalculations.map(item => `
                  <tr>
                    <td class="text-center">${item.serialNumber}</td>
                    <td>${item.item?.itemName || 'N/A'}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                    <td class="text-right">₹${item.amount.toFixed(2)}</td>
                    ${po.gstInclude ? `<td class="text-right">₹${item.gstAmount.toFixed(2)}</td>` : ''}
                    <td class="text-right">₹${item.totalAmount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- Total Section -->
            <div class="total-section">
              <table>
                <tr>
                  <td><strong>TOTAL: ₹${grandTotal.toFixed(2)}</strong></td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div class="footer-section">
              <div><strong>FOR VENKATESWARA ASSOCIATES</strong></div>
              <div class="signature-line"></div>
              <div><strong>AUTHORIZED SIGNATURE</strong></div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };


  // Filter data based on date/month
  const getFilteredData = () => {
    let filtered = [...purchaseOrders];

    if (dateFilter && dateFilter.length === 2) {
      const [startDate, endDate] = dateFilter;
      filtered = filtered.filter(po => {
        const poDate = dayjs(po.orderDate);
        return poDate.isAfter(dayjs(startDate).subtract(1, 'day')) && 
               poDate.isBefore(dayjs(endDate).add(1, 'day'));
      });
    }

    if (monthFilter) {
      filtered = filtered.filter(po => {
        const poDate = dayjs(po.orderDate);
        return poDate.format('YYYY-MM') === monthFilter;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(po => 
        po.orderNumber.toString().includes(searchTerm) ||
        po.supplier?.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Table columns
  const columns = [
    { 
      title: "PO Number", 
      dataIndex: "orderNumber", 
      key: "orderNumber",
      sorter: (a, b) => a.orderNumber - b.orderNumber,
    },
    {
      title: "Order Date",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (date) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
      sorter: (a, b) => dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix(),
    },
    { 
      title: "Supplier", 
      key: "supplierName",
      render: (_, record) => {
        const supplier = record.supplier || suppliers.find(s => s.id === record.supplierId);
        return supplier?.supplierName || "-";
      }
    },
    {
      title: "GST Include",
      dataIndex: "gstInclude",
      key: "gstInclude",
      render: (include) => (
        <Tag color={include ? "green" : "red"}>
          {include ? "Yes" : "No"}
        </Tag>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "grandTotal",
      key: "grandTotal",
      render: (amount) => `₹${amount?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => (a.grandTotal || 0) - (b.grandTotal || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === 'received' ? 'green' : 'orange'}>
          {status === 'received' ? 'Received' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: "Received By",
      dataIndex: "receivedBy",
      key: "receivedBy",
      render: (receivedBy, record) => {
        if (record.status === 'received') {
          return (
            <div>
              <div>{receivedBy || '-'}</div>
              {record.receivedAt && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {dayjs(record.receivedAt).format('DD/MM/YYYY HH:mm')}
                </div>
              )}
            </div>
          );
        }
        return '-';
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
            size="small" 
            onClick={() => viewPODetails(record)}
            title="View Details"
          >
            View
          </Button>
          <Button 
            size="small" 
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => generatePOPDF(record)}
            title="Export PDF"
          >
            PDF
          </Button>
          
          {record.status === 'pending' ? (
              <Button 
                size="small" 
                type="primary"
                title="Mark as Received"
                style={{ pointerEvents: 'auto' }}
                onClick={() => markAsReceived(record)}
              >
                Receive
              </Button>
          ) : record.status === 'received' ? (
            <Tag color="green">Received</Tag>
          ) : null}
          {canEdit() && (
            <Button 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              title="Edit"
            />
          )}
          {canDelete() && (
            <Popconfirm
              title="Are you sure to delete this purchase order?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button 
                size="small" 
                icon={<DeleteOutlined />} 
                danger
                title="Delete"
              />
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
        <div>
          <Title level={2} className="mb-2">Purchase Order Management</Title>
          <Text type="secondary">Complete PO system with PDF export and email integration</Text>
        </div>
        {canEdit() && (
          <Button
            icon={<PlusOutlined />}
            onClick={async () => {
              if (!showCreateForm) {
                // Opening form - generate PO number
                const poNumber = await generatePONumberForDisplay();
                createForm.setFieldValue('orderNumber', poNumber);
                // Ensure GST defaults to No GST on open
                createForm.setFieldValue('gstInclude', false);
                setGstInclude(false);
              }
              setShowCreateForm(!showCreateForm);
              setEditingId(null);
              setPoItems([]);
              if (showCreateForm) {
                createForm.resetFields();
                setGstInclude(false);
              }
            }}
            type="primary"
            size="large"
          >
            {showCreateForm ? "Cancel" : "Create New PO"}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16} align="middle">
          <Col xs={24} sm={6}>
            <Text strong>Date Range:</Text>
            <DatePicker.RangePicker
              className="w-full mt-1"
              value={dateFilter}
              onChange={setDateFilter}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Text strong>Month:</Text>
            <DatePicker
              picker="month"
              className="w-full mt-1"
              value={monthFilter ? dayjs(monthFilter) : null}
              onChange={(date) => setMonthFilter(date ? date.format('YYYY-MM') : null)}
              placeholder="Select Month"
            />
          </Col>
          <Col xs={24} sm={6}>
            <Text strong>Search:</Text>
            <Input.Search
              className="w-full mt-1"
              placeholder="Search by PO number or supplier"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Button 
              onClick={() => {
                setDateFilter(null);
                setMonthFilter(null);
                setSearchTerm("");
              }}
              className="w-full mt-6"
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Create PO Form */}
      {showCreateForm && (
        <Card className="mb-6" title="Create New Purchase Order">
          <Form layout="vertical" form={createForm} onFinish={handleSubmit}>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="orderNumber"
                  label="PO Number (Auto-generated)"
                >
                  <Input 
                    className="w-full" 
                    placeholder="Will be auto-generated" 
                    disabled 
                    style={{ backgroundColor: '#f5f5f5', color: '#666' }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="orderDate"
                  label="Order Date"
                  rules={[{ required: true, message: "Please select order date" }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="supplierId"
                  label="Supplier"
                  rules={[{ required: true, message: "Please select supplier" }]}
                >
                  <Select placeholder="Select supplier">
                    {suppliers.map((supplier) => (
                      <Select.Option key={supplier.id} value={supplier.id}>
                        {supplier.supplierName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="addressId"
                  label="Billing Address"
                  rules={[{ required: true, message: "Please select billing address" }]}
                >
                  <Select placeholder="Select billing address">
                    {addresses.map((address) => (
                      <Select.Option key={address.id} value={address.id}>
                        {address.addressBill || address.addressLine1} - {address.city}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="shippingAddressId"
                  label="Shipping Address"
                  rules={[{ required: true, message: "Please select shipping address" }]}
                >
                  <Select placeholder="Select shipping address">
                    {addresses.map((address) => (
                      <Select.Option key={address.id} value={address.id}>
                        {address.addressShip || address.addressLine1} - {address.city}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  name="gstInclude"
                  label="GST Included in Item Prices"
                  initialValue={false}
                >
                  <Select onChange={handleGstIncludeChange} value={gstInclude}>
                    <Select.Option value={false}>No GST</Select.Option>
                    <Select.Option value={true}>GST Included in Prices</Select.Option>
                  </Select>
                </Form.Item>
                <div className="text-xs text-gray-500 mt-1">
                  {gstInclude 
                    ? "Item prices include GST. GST amount will be calculated separately."
                    : "Item prices are without GST. No tax will be added."
                  }
                </div>
              </Col>
              {gstInclude && (
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="gstPercent"
                    label="GST Percentage"
                    initialValue={18.0}
                    rules={[
                      { required: true, message: "Please enter GST percentage" },
                      { type: "number", min: 0, max: 100 },
                    ]}
                  >
                    <InputNumber 
                      className="w-full" 
                      min={0} 
                      max={100} 
                      step={0.01} 
                      placeholder="18.00"
                    />
                  </Form.Item>
                </Col>
              )}
              <Col xs={24}>
                <Form.Item
                  name="notes"
                  label="Notes"
                >
                  <TextArea rows={2} placeholder="Enter additional notes" />
                </Form.Item>
              </Col>
            </Row>

            {/* Items Section */}
            <Divider>Items</Divider>
            
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>PO Items</Title>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setShowItemForm(true)}
              >
                Add Item
              </Button>
            </div>

            {poItems.length > 0 ? (
              <Table
                dataSource={poItems}
                columns={[
                  { title: "Item", dataIndex: ["item", "itemName"], key: "itemName" },
                  { title: "Part Number", dataIndex: ["item", "partNumber"], key: "partNumber" },
                  { title: "Quantity", dataIndex: "quantity", key: "quantity" },
                  { title: "Rate", dataIndex: "rate", key: "rate", render: (rate) => `₹${rate}` },
                  { title: "Total", dataIndex: "total", key: "total", render: (total) => `₹${total}` },
                  {
                    title: "Actions",
                    key: "actions",
                    render: (_, record) => (
                      <Button 
                        size="small" 
                        danger
                        onClick={() => removeItemFromPO(record.id)}
                      >
                        Remove
                      </Button>
                    ),
                  },
                ]}
                pagination={false}
                size="small"
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No items added yet. Click "Add Item" to start.</p>
              </div>
            )}

            {/* Totals */}
            {poItems.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <Row gutter={16}>
                  <Col span={8}>
                    <Text strong>Sub Total: ₹{calculateTotals().subTotal.toFixed(2)}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>GST: ₹{calculateTotals().taxTotal.toFixed(2)}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong className="text-lg">Grand Total: ₹{calculateTotals().grandTotal.toFixed(2)}</Text>
                  </Col>
                </Row>
              </div>
            )}

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  disabled={poItems.length === 0}
                >
                  {editingId ? "Update Purchase Order" : "Create Purchase Order"}
                </Button>
                <Button onClick={() => {
                  setShowCreateForm(false);
                  setPoItems([]);
                  createForm.resetFields();
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* Table */}
      <Table
        columns={columns}
        dataSource={getFilteredData()}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />

      {/* PO Details Modal */}
      <Modal
        title={`Purchase Order #${selectedPO?.orderNumber}`}
        open={showPODetails}
        onCancel={() => setShowPODetails(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setShowPODetails(false)}>
            Close
          </Button>,
          <Button 
            key="pdf" 
            type="primary" 
            icon={<FilePdfOutlined />}
            onClick={() => generatePOPDF(selectedPO)}
          >
            Export PDF
          </Button>,
        ]}
      >
        {selectedPO && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Title level={4}>Supplier Details</Title>
                <p><strong>Name:</strong> {selectedPO.supplier?.supplierName}</p>
                <p><strong>Email:</strong> {selectedPO.supplier?.email}</p>
                <p><strong>Phone:</strong> {selectedPO.supplier?.phone}</p>
              </Col>
              <Col span={12}>
                <Title level={4}>Order Details</Title>
                <p><strong>PO Number:</strong> {selectedPO.orderNumber}</p>
                <p><strong>Date:</strong> {selectedPO.orderDate ? dayjs(selectedPO.orderDate).format('DD/MM/YYYY') : '-'}</p>
                <p><strong>GST Include:</strong> {selectedPO.gstInclude ? 'Yes' : 'No'}</p>
              </Col>
            </Row>
            
            <Divider />
            
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>Items</Title>
            </div>
            
            <Table
              dataSource={selectedPO.poItems || []}
              columns={[
                { title: "Item", dataIndex: ["item", "itemName"], key: "itemName" },
                { title: "Part Number", dataIndex: ["item", "partNumber"], key: "partNumber" },
                { title: "Quantity", dataIndex: "quantity", key: "quantity" },
                { title: "Rate", dataIndex: "rate", key: "rate", render: (rate) => `₹${rate}` },
                { title: "Total", dataIndex: "total", key: "total", render: (total) => `₹${total}` },
              ]}
              pagination={false}
              size="small"
            />
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={12}>
                <Title level={4}>Billing Address</Title>
                {selectedPO.address ? (
                  <div>
                    <p>{selectedPO.address.addressBill || selectedPO.address.addressLine1}</p>
                    <p>{selectedPO.address.addressLine2}</p>
                    <p>{selectedPO.address.city}, {selectedPO.address.state} - {selectedPO.address.pincode}</p>
                    <p>Phone: {selectedPO.address.phone}</p>
                    <p>Email: {selectedPO.address.email}</p>
                  </div>
                ) : (
                  <p>No billing address</p>
                )}
              </Col>
              <Col span={12}>
                <Title level={4}>Shipping Address</Title>
                {selectedPO.shippingAddress ? (
                  <div>
                    <p>{selectedPO.shippingAddress.addressShip || selectedPO.shippingAddress.addressLine1}</p>
                    <p>{selectedPO.shippingAddress.addressLine2}</p>
                    <p>{selectedPO.shippingAddress.city}, {selectedPO.shippingAddress.state} - {selectedPO.shippingAddress.pincode}</p>
                    <p>Phone: {selectedPO.shippingAddress.phone}</p>
                    <p>Email: {selectedPO.shippingAddress.email}</p>
                  </div>
                ) : selectedPO.address ? (
                  <div>
                    <p><em>Same as billing address</em></p>
                    <p>{selectedPO.address.addressBill || selectedPO.address.addressLine1}</p>
                    <p>{selectedPO.address.addressLine2}</p>
                    <p>{selectedPO.address.city}, {selectedPO.address.state} - {selectedPO.address.pincode}</p>
                  </div>
                ) : (
                  <p>No shipping address</p>
                )}
              </Col>
            </Row>
            
            <Divider />
            
            <Row gutter={16}>
              <Col span={24}>
                <Title level={4}>Totals</Title>
                <div>
                  <p><strong>Sub Total:</strong> ₹{selectedPO.subTotal?.toFixed(2) || '0.00'}</p>
                  <p><strong>GST ({selectedPO.gstPercent || 18}%):</strong> ₹{selectedPO.taxTotal?.toFixed(2) || '0.00'}</p>
                  <p><strong>Grand Total:</strong> ₹{selectedPO.grandTotal?.toFixed(2) || '0.00'}</p>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Item Form Modal */}
      <Modal
        title={editingItemId ? "Edit PO Item" : "Add PO Item"}
        open={showItemForm}
        onCancel={() => {
          setShowItemForm(false);
          setEditingItemId(null);
          itemForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form layout="vertical" form={itemForm} onFinish={addItemToPO}>
          <Form.Item
            name="itemId"
            label="Select Item"
            rules={[{ required: true, message: "Please select an item" }]}
          >
            <Select 
              placeholder="Select item" 
              showSearch
              onChange={(itemId) => {
                const selectedItem = items.find(item => item.id === itemId);
                if (selectedItem) {
                  // Auto-fill the rate with item's purchase rate
                  itemForm.setFieldValue('rate', selectedItem.purchaseRate || 0);
                  // Auto-calculate total
                  const quantity = itemForm.getFieldValue('quantity') || 0;
                  const total = quantity * (selectedItem.purchaseRate || 0);
                  itemForm.setFieldValue('total', total);
                }
              }}
            >
              {items.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.itemName} ({item.partNumber}) - ₹{item.purchaseRate}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: "Please enter quantity" }]}
              >
                <InputNumber 
                  className="w-full" 
                  min={1} 
                  placeholder="Enter quantity"
                  onChange={(value) => {
                    // Auto-update total when quantity changes
                    const rate = itemForm.getFieldValue('rate') || 0;
                    const total = (value * rate) || 0;
                    itemForm.setFieldValue('total', total);
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="rate"
                label="Rate (₹)"
                rules={[{ required: true, message: "Please enter rate" }]}
              >
                <InputNumber 
                  className="w-full" 
                  min={0} 
                  step={0.01} 
                  placeholder="Enter rate"
                  onChange={(value) => {
                    // Auto-update total when rate changes
                    const quantity = itemForm.getFieldValue('quantity') || 0;
                    const total = (quantity * value) || 0;
                    itemForm.setFieldValue('total', total);
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingItemId ? "Update Item" : "Add Item"}
              </Button>
              <Button onClick={() => {
                setShowItemForm(false);
                setEditingItemId(null);
                itemForm.resetFields();
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

export default PurchaseOrderComplete;
