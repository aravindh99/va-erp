import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Button,
  Select,
  Typography,
  Space,
  Divider,
  message,
} from "antd";
import {
  FilePdfOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import api from "../service/api";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const ProductionReport = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [productionData, setProductionData] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [sites, setSites] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedSiteName, setSelectedSiteName] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedMachineName, setSelectedMachineName] = useState('');

  // Fetch production data
  const fetchProductionData = async () => {
    setLoading(true);
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      let url = `/api/dailyEntries?startDate=${startDate}&endDate=${endDate}`;
      if (selectedSite) {
        url += `&siteId=${selectedSite}`;
      }
      if (selectedMachine) {
        url += `&vehicleId=${selectedMachine}`;
      }
      
      const res = await api.get(url);
      const entries = res.data.data || [];
      
      // Calculate production metrics
      const calculations = calculateProductionMetrics(entries);
      setProductionData(calculations.dailyData);
      setSummaryData(calculations.summary);
    } catch (err) {
      console.error("Error fetching production data", err);
      message.error("Error fetching production data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate production metrics
  const calculateProductionMetrics = (entries) => {
    let totalHSD = 0;
    let totalMeter = 0;
    let totalCompressorRPM = 0;
    let totalVehicleRPM = 0;
    let totalHoles = 0;
    let crawlerHSD = 0;
    let crawlerRPM = 0;
    let compHSD = 0;
    let compRPM = 0;

    const dailyData = entries.map(entry => {
      const hsd = entry.dieselUsed || 0;
      const meter = entry.meter || 0;
      const vehicleRPM = (entry.vehicleClosingRPM || 0) - (entry.vehicleOpeningRPM || 0);
      const compressorRPM = (entry.compressorClosingRPM || 0) - (entry.compressorOpeningRPM || 0);
      const holes = entry.noOfHoles || 0;

      // Machine type specific calculations based on machine data in entry
      if (entry.vehicle) {
        const machineType = entry.vehicle.vehicleType?.toLowerCase() || '';
        if (machineType.includes('crawler')) {
          crawlerHSD += hsd;
          crawlerRPM += vehicleRPM;
        } else if (machineType.includes('compressor')) {
          compHSD += hsd;
          compRPM += compressorRPM;
        }
      }

      totalHSD += hsd;
      totalMeter += meter;
      totalCompressorRPM += compressorRPM;
      totalVehicleRPM += vehicleRPM;
      totalHoles += holes;

      return {
        ...entry,
        vehicleRPM,
        compressorRPM,
        hsdMtr: meter > 0 ? (hsd / meter).toFixed(2) : 0,
        mtrRPM: compressorRPM > 0 ? (meter / compressorRPM).toFixed(2) : 0,
        hsdRPM: compressorRPM > 0 ? (hsd / compressorRPM).toFixed(2) : 0,
        depthAvg: holes > 0 ? (meter / holes).toFixed(2) : 0,
      };
    });

    const summary = {
      totalHSD,
      totalMeter,
      totalCompressorRPM,
      totalVehicleRPM,
      totalHoles,
      crawlerHSD,
      crawlerRPM,
      compHSD,
      compRPM,
      hsdMtr: totalMeter > 0 ? (totalHSD / totalMeter).toFixed(2) : 0,
      mtrRPM: totalCompressorRPM > 0 ? (totalMeter / totalCompressorRPM).toFixed(2) : 0,
      hsdRPM: totalCompressorRPM > 0 ? (totalHSD / totalCompressorRPM).toFixed(2) : 0,
      depthAvg: totalHoles > 0 ? (totalMeter / totalHoles).toFixed(2) : 0,
      crawlerHsdCrawlerRpm: crawlerRPM > 0 ? (crawlerHSD / crawlerRPM).toFixed(2) : 0,
      compHsdCompRpm: compRPM > 0 ? (compHSD / compRPM).toFixed(2) : 0,
    };

    return { dailyData, summary };
  };

  // (removed duplicate fetchVehicles and invalid selectedVehicle dependency)

  // Table columns
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Ref No",
      dataIndex: "refNo",
      key: "refNo",
    },
    {
      title: "Machine",
      key: "machine",
      render: (_, record) => {
        const machine = machines.find(m => m.id === record.vehicleId);
        return machine ? `${machine.vehicleNumber} (${machine.vehicleType})` : '-';
      },
    },
    {
      title: "HSD (L)",
      dataIndex: "dieselUsed",
      key: "dieselUsed",
      render: (value) => value || 0,
    },
    {
      title: "Meter",
      dataIndex: "meter",
      key: "meter",
      render: (value) => value || 0,
    },
    {
      title: "Machine RPM",
      dataIndex: "vehicleRPM",
      key: "vehicleRPM",
      render: (value) => value || 0,
    },
    {
      title: "Comp RPM",
      dataIndex: "compressorRPM",
      key: "compressorRPM",
      render: (value) => value || 0,
    },
    {
      title: "Holes",
      dataIndex: "noOfHoles",
      key: "noOfHoles",
      render: (value) => value || 0,
    },
    {
      title: "HSD/MTR",
      dataIndex: "hsdMtr",
      key: "hsdMtr",
      render: (value) => `${value} L/m`,
    },
    {
      title: "MTR/RPM",
      dataIndex: "mtrRPM",
      key: "mtrRPM",
      render: (value) => `${value} m/rpm`,
    },
    {
      title: "HSD/RPM",
      dataIndex: "hsdRPM",
      key: "hsdRPM",
      render: (value) => `${value} L/rpm`,
    },
    {
      title: "Depth/Avg",
      dataIndex: "depthAvg",
      key: "depthAvg",
      render: (value) => `${value} m/hole`,
    },
  ];

  // Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Production Report - ${dateRange[0].format("DD/MM/YYYY")} to ${dateRange[1].format("DD/MM/YYYY")}${selectedSiteName ? ` - ${selectedSiteName}` : ''}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; }
            .summary-item { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Production Report${selectedSiteName ? ` - ${selectedSiteName}` : ''}${selectedMachineName ? ` - ${selectedMachineName}` : ''}</h1>
            <p>Period: ${dateRange[0].format("DD/MM/YYYY")} to ${dateRange[1].format("DD/MM/YYYY")}</p>
            ${selectedSiteName ? `<p>Site: ${selectedSiteName}</p>` : ''}
            ${selectedMachineName ? `<p>Machine: ${selectedMachineName}</p>` : ''}
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="summary">
            <h3>Summary</h3>
            <div class="summary-item"><strong>Total HSD:</strong> ${summaryData.totalHSD} L</div>
            <div class="summary-item"><strong>Total Meter:</strong> ${summaryData.totalMeter} m</div>
            <div class="summary-item"><strong>Total Holes:</strong> ${summaryData.totalHoles}</div>
            <div class="summary-item"><strong>HSD/MTR:</strong> ${summaryData.hsdMtr} L/m</div>
            <div class="summary-item"><strong>MTR/RPM:</strong> ${summaryData.mtrRPM} m/rpm</div>
            <div class="summary-item"><strong>HSD/RPM:</strong> ${summaryData.hsdRPM} L/rpm</div>
            <div class="summary-item"><strong>Depth/Avg:</strong> ${summaryData.depthAvg} m/hole</div>
            <div class="summary-item"><strong>Crawler HSD/Crawler RPM:</strong> ${summaryData.crawlerHsdCrawlerRpm} L/rpm</div>
            <div class="summary-item"><strong>Compressor HSD/Compressor RPM:</strong> ${summaryData.compHsdCompRpm} L/rpm</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref No</th>
                <th>Machine</th>
                <th>HSD (L)</th>
                <th>Meter</th>
                <th>Machine RPM</th>
                <th>Comp RPM</th>
                <th>Holes</th>
                <th>HSD/MTR</th>
                <th>MTR/RPM</th>
                <th>HSD/RPM</th>
                <th>Depth/Avg</th>
              </tr>
            </thead>
            <tbody>
              ${productionData.map(entry => `
                <tr>
                  <td>${dayjs(entry.date).format("DD/MM/YYYY")}</td>
                  <td>${entry.refNo}</td>
                  <td>${machines.find(m => m.id === entry.vehicleId)?.vehicleNumber || '-'}</td>
                  <td>${entry.dieselUsed || 0}</td>
                  <td>${entry.meter || 0}</td>
                  <td>${entry.vehicleRPM || 0}</td>
                  <td>${entry.compressorRPM || 0}</td>
                  <td>${entry.noOfHoles || 0}</td>
                  <td>${entry.hsdMtr} L/m</td>
                  <td>${entry.mtrRPM} m/rpm</td>
                  <td>${entry.hsdRPM} L/rpm</td>
                  <td>${entry.depthAvg} m/hole</td>
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

  // Fetch sites and vehicles
  const fetchSites = async () => {
    try {
      const res = await api.get('/api/sites');
      setSites(res.data.data || []);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };
  const fetchMachines = async () => {
    try {
      const res = await api.get('/api/vehicles');
      setMachines(res.data.data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  // Fetch refs on component mount
  useEffect(() => {
    fetchSites();
    fetchMachines();
  }, []);

  // Fetch production data when filters change
  useEffect(() => {
    fetchProductionData();
  }, [dateRange, selectedSite, selectedMachine]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="mb-2">
            Daily Production Report
            {selectedSiteName && ` - ${selectedSiteName}`}
          </Title>
          <Text type="secondary">
            {dateRange[0].format('DD/MM/YYYY')} to {dateRange[1].format('DD/MM/YYYY')}
            {selectedSiteName && ` | Site: ${selectedSiteName}`}
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchProductionData}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={exportToPDF}
            type="primary"
            danger
          >
            Export PDF
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
            <Text strong>Filter by Site:</Text>
            <Select
              className="w-full mt-1"
              placeholder="All sites"
              value={selectedSite}
              onChange={(value) => {
                setSelectedSite(value);
                const site = sites.find(s => s.id === value);
                setSelectedSiteName(site ? site.siteName : '');
              }}
              allowClear
            >
              {sites.map(site => (
                <Select.Option key={site.id} value={site.id}>
                  {site.siteName}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Text strong>Filter by Machine:</Text>
            <Select
              className="w-full mt-1"
              placeholder="All machines"
              value={selectedMachine}
              onChange={(value) => {
                setSelectedMachine(value);
                const machine = machines.find(m => m.id === value);
                setSelectedMachineName(machine ? `${machine.vehicleNumber} (${machine.vehicleType})` : '');
              }}
              allowClear
            >
              {machines.map(machine => (
                <Select.Option key={machine.id} value={machine.id}>
                  {machine.vehicleNumber} ({machine.vehicleType})
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Button
              onClick={() => {
                setDateRange([dayjs().subtract(30, 'days'), dayjs()]);
                setSelectedSite('');
                setSelectedSiteName('');
                setSelectedMachine('');
                setSelectedMachineName('');
              }}
              style={{ marginTop: '24px' }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total HSD"
              value={summaryData.totalHSD || 0}
              suffix="L"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Meter"
              value={summaryData.totalMeter || 0}
              suffix="m"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Holes"
              value={summaryData.totalHoles || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="HSD/MTR"
              value={summaryData.hsdMtr || 0}
              suffix="L/m"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="MTR/RPM"
              value={summaryData.mtrRPM || 0}
              suffix="m/rpm"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="HSD/RPM"
              value={summaryData.hsdRPM || 0}
              suffix="L/rpm"
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Depth/Avg"
              value={summaryData.depthAvg || 0}
              suffix="m/hole"
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Crawler HSD/RPM"
              value={summaryData.crawlerHsdCrawlerRpm || 0}
              suffix="L/rpm"
              valueStyle={{ color: '#2f54eb' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Compressor HSD/RPM"
              value={summaryData.compHsdCompRpm || 0}
              suffix="L/rpm"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Production Data Table */}
      <Card>
        <Title level={4}>Daily Production Data</Title>
        <Table
          columns={columns}
          dataSource={productionData}
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

export default ProductionReport;
