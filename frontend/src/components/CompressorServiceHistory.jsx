import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  Card,
  Tag,
  Typography,
  Button,
  Space,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  ArrowLeftOutlined,
  ToolOutlined,
  CalendarOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const CompressorServiceHistory = () => {
  const { compressorId } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [compressor, setCompressor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompressorServiceHistory();
  }, [compressorId]);

  const fetchCompressorServiceHistory = async () => {
    setLoading(true);
    try {
      // Fetch compressor details directly
      const compressorRes = await api.get(`/api/compressors/${compressorId}`);
      setCompressor(compressorRes.data.data);

      // Fetch service history
      const servicesRes = await api.get(`/api/services?compressorId=${compressorId}&serviceType=compressor`);
      setServices(servicesRes.data.data || []);
    } catch (err) {
      console.error("Error fetching compressor service history", err);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Compressor Service History - ${compressor?.compressorName}</title>
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
            <h1>Service History - ${compressor?.compressorName}</h1>
            <p>Compressor Type: ${compressor?.compressorType}</p>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Service RPM</th>
                <th>Service Date</th>
                <th>Serviced Item</th>
              </tr>
            </thead>
            <tbody>
              ${services.map(service => `
                <tr>
                  <td>${service.serviceRPM}</td>
                  <td>${service.serviceDate ? dayjs(service.serviceDate).format("YYYY-MM-DD") : "-"}</td>
                  <td>${service.serviceType === "vehicle" && service.vehicle ? 
                    `${service.vehicle.vehicleNumber} (${service.vehicle.vehicleType})` : 
                    service.serviceType === "compressor" && service.compressor ? 
                    `${service.compressor.compressorName} (${service.compressor.compressorType})` : 
                    "-"}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const columns = [
    {
      title: "Service RPM",
      dataIndex: "serviceRPM",
      key: "serviceRPM",
      render: (rpm) => <Text strong>{rpm ? Number(rpm).toFixed(1) : '-'}</Text>,
    },
    {
      title: "Service Date",
      dataIndex: "serviceDate",
      key: "serviceDate",
      render: (date) => date ? dayjs(date).format("YYYY-MM-DD") : "-",
    },
    {
      title: "Serviced Item",
      key: "servicedItem",
      render: (_, record) => {
        if (record.serviceType === "vehicle" && record.vehicle) {
          return `${record.vehicle.vehicleNumber} (${record.vehicle.vehicleType})`;
        } else if (record.serviceType === "compressor" && record.compressor) {
          return `${record.compressor.compressorName} (${record.compressor.compressorType})`;
        }
        return "-";
      },
    },
  ];

  const totalServices = services.length;
  const lastService = services[0]; // Assuming sorted by date desc
  const nextServiceRPM = compressor?.nextServiceRPM || 0;
  const currentRPM = compressor?.compressorRPM || 0;
  const remainingRPM = nextServiceRPM ? Math.max(0, nextServiceRPM - currentRPM) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            type="text"
          />
          <div>
            <Title level={2} className="mb-0">
              Service History - {compressor?.compressorName}
            </Title>
            <Text type="secondary">
              {compressor?.compressorType} • {compressor?.brand?.brandName}
            </Text>
          </div>
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

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Services"
              value={totalServices}
              prefix={<ToolOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Current RPM"
              value={currentRPM}
              suffix="RPM"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Next Service Due"
              value={remainingRPM}
              suffix="RPM"
              valueStyle={{ color: remainingRPM <= 100 ? "#f5222d" : "#fa8c16" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Service History Table */}
      <Card title="Service Records">
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "No service records found" }}
        />
      </Card>
    </div>
  );
};

export default CompressorServiceHistory;
