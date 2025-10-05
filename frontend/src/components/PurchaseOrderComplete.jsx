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
  const [sites, setSites] = useState([]);
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
  const [gstInclude, setGstInclude] = useState(true);
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
      const [posRes, suppliersRes, addressesRes, sitesRes, itemsRes] = await Promise.all([
        api.get(`/api/pos?page=${page}&limit=${limit}`),
        api.get("/api/suppliers"),
        api.get("/api/address"),
        api.get("/api/sites"),
        api.get("/api/items"),
      ]);
      
      setPurchaseOrders(posRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setAddresses(addressesRes.data.data || []);
      setSites(sitesRes.data.data || []);
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
      console.log("Submitting payload:", payload);


      if (editingId) {
        await api.put(`/api/pos/${editingId}`, payload);
        message.success("Purchase order updated successfully");
        
      } else {
        const res = await api.post("/api/pos", payload);
        setPurchaseOrders([res.data.data, ...purchaseOrders]);
        message.success("Purchase order created successfully");
        console.log("Response from server purchase order:", res.data.data);
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
    siteIds: record.sites?.map(site => site.id) || [], // if PO has sites association
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

  const markAsReceived = async (id) => {
    try {
      await api.post(`/api/pos/${id}/received`);
      message.success("PO marked as received and stock updated!");
      fetchPurchaseOrders();
    } catch (err) {
      console.error("Error marking PO as received", err);
      message.error("Error marking PO as received");
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

  // Generate PO PDF
  const generatePOPDF = (po) => {
    const printWindow = window.open("", "_blank");
    const subTotal = po.subTotal || 0;
    const taxTotal = po.taxTotal || 0;
    const grandTotal = po.grandTotal || 0;

    // Get billing and shipping addresses
    const billingAddress = addresses.find(addr => addr.id === po.addressId);
    const shippingAddress = addresses.find(addr => addr.id === po.shippingAddressId);

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
              font-size: 28px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 10px;
            }
            .company-details { 
              font-size: 14px; 
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
            .kind-attention {
              text-align: center;
              margin: 20px 0;
              padding: 15px;
              background-color: #f8f9fa;
              border: 1px solid #ddd;
            }
            .kind-attention h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 18px;
            }
            .kind-attention p {
              margin: 5px 0;
              color: #666;
            }
            .po-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .po-info {
              flex: 1;
            }
            .po-info h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 16px;
            }
            .po-info p {
              margin: 5px 0;
              color: #666;
              font-size: 14px;
            }
            .supplier-info {
              flex: 1;
              text-align: right;
            }
            .supplier-info h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 16px;
            }
            .supplier-info p {
              margin: 5px 0;
              color: #666;
              font-size: 14px;
            }
            .greeting {
              margin: 20px 0;
              font-size: 16px;
              color: #333;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
            }
            .items-table th, .items-table td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left;
            }
            .items-table th { 
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            .items-table .text-right { 
              text-align: right;
            }
            .totals { 
              float: right; 
              width: 300px; 
              margin-top: 20px;
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
              background-color: #f5f5f5; 
              font-weight: bold;
            }
            .totals .grand-total { 
              background-color: #1890ff; 
              color: white; 
              font-weight: bold;
              font-size: 14px;
            }
            .notes { 
              margin-top: 30px; 
              clear: both;
            }
            .notes h3 { 
              margin: 0 0 10px 0; 
              color: #333;
            }
            .notes p { 
              margin: 5px 0; 
              color: #666;
            }
            .footer { 
              margin-top: 50px; 
              text-align: center; 
              color: #666; 
              font-size: 14px;
            }
            .signature-section {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .signature-box {
              width: 200px;
              height: 80px;
              border: 1px solid #ddd;
              margin-top: 20px;
            }
            .authorized-signature {
              text-align: center;
              margin-top: 10px;
              font-weight: bold;
              color: #333;
            }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">VEKATESWARA ASSOCIATES</div>
            <div class="company-details">
              <p>Email: ${billingAddress?.email || 'info@vekateswara.com'} | Phone: ${billingAddress?.phone || '+91 9876543210'}</p>
            </div>
          </div>

          <div class="addresses">
            <div class="address-section">
              <h3>BILL TO:</h3>
              <p><strong>VEKATESWARA ASSOCIATES</strong></p>
              <p>${billingAddress?.addressBill || billingAddress?.addressLine1 || '123 Business Street'}</p>
              <p>${billingAddress?.city || 'City'}, ${billingAddress?.state || 'State'} - ${billingAddress?.pincode || '123456'}</p>
              <p>Email: ${billingAddress?.email || 'info@vekateswara.com'}</p>
              <p>Phone: ${billingAddress?.phone || '+91 9876543210'}</p>
            </div>
            <div class="address-section">
              <h3>SHIP TO:</h3>
              <p><strong>${po.supplier?.supplierName || 'Supplier Name'}</strong></p>
              <p>${shippingAddress?.addressShip || shippingAddress?.addressLine1 || 'Supplier Address'}</p>
              <p>${shippingAddress?.city || 'City'}, ${shippingAddress?.state || 'State'} - ${shippingAddress?.pincode || '123456'}</p>
              <p>Email: ${po.supplier?.email || 'supplier@email.com'}</p>
              <p>Phone: ${po.supplier?.phone || '+91 9876543210'}</p>
              <p>GST: ${po.supplier?.gstNumber || 'GST Number'}</p>
            </div>
          </div>

          <div class="kind-attention">
            <h3>KIND ATTENTION</h3>
            <p><strong>${po.supplier?.supplierName || 'Supplier Name'}</strong></p>
            <p>Phone: ${po.supplier?.phone || '+91 9876543210'}</p>
          </div>

          <div class="po-details">
            <div class="po-info">
              <h3>Purchase Order Details</h3>
              <p><strong>PO Number:</strong> ${po.orderNumber}</p>
              <p><strong>Date:</strong> ${po.orderDate ? dayjs(po.orderDate).format('DD/MM/YYYY') : '-'}</p>
            </div>
            <div class="supplier-info">
              <h3>Supplier Details</h3>
              <p><strong>Name:</strong> ${po.supplier?.supplierName || '-'}</p>
              <p><strong>Email:</strong> ${po.supplier?.email || '-'}</p>
              <p><strong>Phone:</strong> ${po.supplier?.phone || '-'}</p>
              <p><strong>GST:</strong> ${po.supplier?.gstNumber || '-'}</p>
            </div>
          </div>

          <div class="greeting">
            <p><strong>Dear Sir/Ma'am,</strong></p>
            <p>Kindly arrange the following parts:</p>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 15%;">Item Code</th>
                <th style="width: 35%;">Description</th>
                <th style="width: 10%;">Qty</th>
                <th style="width: 15%;">Rate</th>
                <th style="width: 20%;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(po.poItems || []).map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.item?.partNumber || '-'}</td>
                  <td>${item.item?.itemName || '-'}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">₹${item.rate}</td>
                  <td class="text-right">₹${item.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td class="label">Sub Total:</td>
                <td class="text-right">₹${subTotal.toFixed(2)}</td>
              </tr>
              ${po.gstInclude ? `
                <tr>
                  <td class="label">GST (${po.gstPercent || 18}%):</td>
                  <td class="text-right">₹${taxTotal.toFixed(2)}</td>
                </tr>
              ` : ''}
              <tr>
                <td class="label grand-total">Grand Total:</td>
                <td class="text-right grand-total">₹${grandTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="notes">
            <h3>Notes:</h3>
            <p>${po.notes || 'No additional notes.'}</p>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <div class="signature-section">
              <div>
                <div class="signature-box"></div>
                <div class="authorized-signature">Authorized Signature</div>
              </div>
              <div>
                <p><strong>For VEKATESWARA ASSOCIATES</strong></p>
              </div>
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
          
          {record.status !== 'received' && canEdit() && (
            <Button 
              size="small" 
              type="primary"
              onClick={() => markAsReceived(record.id)}
              title="Mark as Received"
            >
              Checking
            </Button>
          )}
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
              }
              setShowCreateForm(!showCreateForm);
              setEditingId(null);
              setPoItems([]);
              if (showCreateForm) {
                createForm.resetFields();
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
                  name="siteIds"
                  label="Sites"
                  rules={[{ required: true, message: "Please select at least one site" }]}
                >
                  <Select 
                    mode="multiple" 
                    placeholder="Select sites"
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {sites.map((site) => (
                      <Select.Option key={site.id} value={site.id}>
                        {site.siteName}
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
                  <Select onChange={(value) => setGstInclude(value)}>
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
                  Create Purchase Order
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
              {canEdit() && (
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => {
                    setEditingItemId(selectedPO.id);
                    setShowItemForm(true);
                    itemForm.resetFields();
                  }}
                >
                  Add Item
                </Button>
              )}
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
