import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Space,
  Form,
  Card,
  message,
  Typography,
  Row,
  Col,
} from "antd";
import {
  SaveOutlined,
} from "@ant-design/icons";
import api from "../service/api";

const { TextArea } = Input;
const { Title, Text } = Typography;

const AddressManagement = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [addressData, setAddressData] = useState(null);

  // Fetch address data
  const fetchAddress = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/address");
      const addresses = res.data.data || [];
      
      // If there are addresses, use the first one (assuming only one company address)
      if (addresses.length > 0) {
        const address = addresses[0];
        setAddressData(address);
        form.setFieldsValue({
          addressBill: address.addressBill,
          addressShip: address.addressShip,
          phone: address.phone,
          email: address.email,
        });
      }
    } catch (err) {
      console.error("Error fetching address", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddress();
  }, []);

  // Handle form submit
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        addressBill: values.addressBill.trim(),
        addressShip: values.addressShip.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
      };

      if (addressData) {
        // Update existing address
        await api.put(`/api/address/${addressData.id}`, payload);
        message.success("Company address updated successfully");
      } else {
        // Create new address
        const res = await api.post("/api/address", payload);
        setAddressData(res.data.data);
        message.success("Company address created successfully");
      }

      fetchAddress();
    } catch (err) {
      console.error("Error saving address", err);
      message.error("Error saving address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Title level={2} className="mb-2">Company Address Management</Title>
        <Text type="secondary">Manage your company's billing and shipping addresses for Purchase Orders</Text>
      </div>

      {/* Address Form */}
      <Card title="Company Address Details">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="max-w-4xl"
        >
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Form.Item
                name="addressBill"
                label="Billing Address"
                rules={[
                  { required: true, message: "Billing address is required" },
                  { max: 255, message: "Billing address must be less than 255 characters" }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Enter your company's billing address"
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                name="addressShip"
                label="Shipping Address"
                rules={[
                  { required: true, message: "Shipping address is required" },
                  { max: 255, message: "Shipping address must be less than 255 characters" }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Enter your company's shipping address"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label="Phone Number"
                rules={[
                  { required: true, message: "Phone number is required" },
                  { pattern: /^\d{10}$/, message: "Phone number must be exactly 10 digits" }
                ]}
              >
                <Input
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: "Email address is required" },
                  { type: "email", message: "Please enter a valid email address" },
                  { max: 255, message: "Email must be less than 255 characters" }
                ]}
              >
                <Input
                  placeholder="Enter email address"
                  type="email"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                {addressData ? "Update Address" : "Save Address"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Information Card */}
      <Card title="Information">
        <div className="space-y-2">
          <Text>
            <strong>Note:</strong> This address information will be used in Purchase Orders as your company details.
          </Text>
          <br />
          <Text type="secondary">
            • <strong>Billing Address:</strong> Used for invoicing and billing purposes
          </Text>
          <br />
          <Text type="secondary">
            • <strong>Shipping Address:</strong> Used for delivery and shipping purposes
          </Text>
          <br />
          <Text type="secondary">
            • <strong>Phone & Email:</strong> Contact information for suppliers
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default AddressManagement;