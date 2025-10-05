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
  const [totals, setTotals] = useState({});
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
      setTotals(calculations.totals);
    } catch (err) {
      console.error("Error fetching production data", err);
      message.error("Error fetching production data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate production metrics
  const calculateProductionMetrics = (entries) => {
    let totalCrawlerHSD = 0;
    let totalCamperHSD = 0;
    let totalCompressorHSD = 0;
    let totalTotalHSD = 0;
    let totalMeter = 0;
    let totalCrawlerRPM = 0;
    let totalCompressorRPM = 0;
    let totalHoles = 0;

    const dailyData = entries.map(entry => {
      const hsd = entry.dieselUsed || 0;
      const meter = entry.meter || 0;
      const vehicleRPM = (entry.vehicleClosingRPM || 0) - (entry.vehicleOpeningRPM || 0);
      const compressorRPM = (entry.compressorClosingRPM || 0) - (entry.compressorOpeningRPM || 0);
      const holes = entry.noOfHoles || 0;
      const compressorHSD = entry.compressorHSD || 0;

      // Find machine type
      const machine = machines.find(m => m.id === entry.vehicleId);
      const machineType = machine?.vehicleType?.toLowerCase() || '';
      const isCrawler = machineType.includes('crawler');
      const isCamper = machineType.includes('camper') || machineType.includes('truck');

      // Calculate HSD breakdown
      let crawlerHSD = 0;
      let camperHSD = 0;
      let crawlerRPM = 0;

      if (isCrawler) {
        crawlerHSD = hsd;
        crawlerRPM = vehicleRPM;
      } else if (isCamper) {
        camperHSD = hsd;
      }

      const totalHSD = crawlerHSD + camperHSD + compressorHSD;

      // Calculate ratios
      const hsdMtr = meter > 0 ? (hsd / meter).toFixed(2) : 0;
      const mtrRPM = compressorRPM > 0 ? (meter / compressorRPM).toFixed(2) : 0;
      const crawlerHsdPerRpm = crawlerRPM > 0 ? (crawlerHSD / crawlerRPM).toFixed(2) : 0;
      const compHsdPerRpm = compressorRPM > 0 ? (compressorHSD / compressorRPM).toFixed(2) : 0;
      const depthAvg = holes > 0 ? (meter / holes).toFixed(2) : 0;

      // Add to totals
      totalCrawlerHSD += crawlerHSD;
      totalCamperHSD += camperHSD;
      totalCompressorHSD += compressorHSD;
      totalTotalHSD += totalHSD;
      totalMeter += meter;
      totalCrawlerRPM += crawlerRPM;
      totalCompressorRPM += compressorRPM;
      totalHoles += holes;

      return {
        ...entry,
        crawlerHSD,
        camperHSD,
        compressorHSD,
        totalHSD,
        crawlerRPM,
        compressorRPM,
        hsdMtr,
        mtrRPM,
        crawlerHsdPerRpm,
        compHsdPerRpm,
        depthAvg,
      };
    });

    // Calculate totals for summary
    const totals = {
      totalCrawlerHSD,
      totalCamperHSD,
      totalCompressorHSD,
      totalTotalHSD,
      totalMeter,
      totalCrawlerRPM,
      totalCompressorRPM,
      totalHoles,
      totalHsdMtr: totalMeter > 0 ? (totalTotalHSD / totalMeter).toFixed(2) : 0,
      totalMtrRPM: totalCompressorRPM > 0 ? (totalMeter / totalCompressorRPM).toFixed(2) : 0,
      totalCrawlerHsdPerRpm: totalCrawlerRPM > 0 ? (totalCrawlerHSD / totalCrawlerRPM).toFixed(2) : 0,
      totalCompHsdPerRpm: totalCompressorRPM > 0 ? (totalCompressorHSD / totalCompressorRPM).toFixed(2) : 0,
      totalDepthAvg: totalHoles > 0 ? (totalMeter / totalHoles).toFixed(2) : 0,
    };

    return { dailyData, totals };
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
      title: "Crawler HSD",
      dataIndex: "crawlerHSD",
      key: "crawlerHSD",
      render: (value) => value || 0,
    },
    {
      title: "Camper HSD",
      dataIndex: "camperHSD",
      key: "camperHSD",
      render: (value) => value || 0,
    },
    {
      title: "Compressor HSD",
      dataIndex: "compressorHSD",
      key: "compressorHSD",
      render: (value) => value || 0,
    },
    {
      title: "Total HSD",
      dataIndex: "totalHSD",
      key: "totalHSD",
      render: (value) => value || 0,
    },
    {
      title: "Meter",
      dataIndex: "meter",
      key: "meter",
      render: (value) => value || 0,
    },
    {
      title: "Crawler RPM",
      dataIndex: "crawlerRPM",
      key: "crawlerRPM",
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
      render: (value) => value,
    },
    {
      title: "MTR/RPM",
      dataIndex: "mtrRPM",
      key: "mtrRPM",
      render: (value) => value,
    },
    {
      title: "Crawler HSD/Crawler RPM",
      dataIndex: "crawlerHsdPerRpm",
      key: "crawlerHsdPerRpm",
      render: (value) => value > 0 ? value : '-',
    },
    {
      title: "Comp HSD/Comp RPM",
      dataIndex: "compHsdPerRpm",
      key: "compHsdPerRpm",
      render: (value) => value > 0 ? value : '-',
    },
    {
      title: "Depth/Avg",
      dataIndex: "depthAvg",
      key: "depthAvg",
      render: (value) => value,
    },
  ];

  // Export to PDF
  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Daily Production Report${selectedSiteName ? ` - ${selectedSiteName}` : ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; position: relative; }
            .header h1 { margin: 0; font-size: 24px; }
            .header p { margin: 5px 0; }
            .generated-on { position: absolute; top: 0; right: 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f2f2f2; }
            .total-row { background-color: #f9f9f9; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Production Report</h1>
            <p>Period: ${dateRange[0].format("DD/MM/YYYY")} to ${dateRange[1].format("DD/MM/YYYY")}</p>
            <p>Site: ${selectedSiteName || 'All Sites'}</p>
            <p class="generated-on">Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Crawler HSD</th>
                <th>Camper HSD</th>
                <th>Compressor HSD</th>
                <th>Total HSD</th>
                <th>Meter</th>
                <th>Crawler RPM</th>
                <th>Comp RPM</th>
                <th>Holes</th>
                <th>HSD/MTR</th>
                <th>MTR/RPM</th>
                <th>Crawler HSD/Crawler RPM</th>
                <th>Comp HSD/Comp RPM</th>
                <th>Depth/Avg</th>
              </tr>
            </thead>
            <tbody>
              ${productionData.map(entry => `
                <tr>
                  <td>${dayjs(entry.date).format("DD/MM/YYYY")}</td>
                  <td>${entry.crawlerHSD || 0}</td>
                  <td>${entry.camperHSD || 0}</td>
                  <td>${entry.compressorHSD || 0}</td>
                  <td>${entry.totalHSD || 0}</td>
                  <td>${entry.meter || 0}</td>
                  <td>${entry.crawlerRPM || 0}</td>
                  <td>${entry.compressorRPM || 0}</td>
                  <td>${entry.noOfHoles || 0}</td>
                  <td>${entry.hsdMtr}</td>
                  <td>${entry.mtrRPM}</td>
                  <td>${entry.crawlerHsdPerRpm > 0 ? entry.crawlerHsdPerRpm : '-'}</td>
                  <td>${entry.compHsdPerRpm > 0 ? entry.compHsdPerRpm : '-'}</td>
                  <td>${entry.depthAvg}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td>Total</td>
                <td>${totals.totalCrawlerHSD || 0}</td>
                <td>${totals.totalCamperHSD || 0}</td>
                <td>${totals.totalCompressorHSD || 0}</td>
                <td>${totals.totalTotalHSD || 0}</td>
                <td>${totals.totalMeter || 0}</td>
                <td>${totals.totalCrawlerRPM || 0}</td>
                <td>${totals.totalCompressorRPM || 0}</td>
                <td>${totals.totalHoles || 0}</td>
                <td>${totals.totalHsdMtr}</td>
                <td>${totals.totalMtrRPM}</td>
                <td>${totals.totalCrawlerHsdPerRpm > 0 ? totals.totalCrawlerHsdPerRpm : '-'}</td>
                <td>${totals.totalCompHsdPerRpm > 0 ? totals.totalCompHsdPerRpm : '-'}</td>
                <td>${totals.totalDepthAvg}</td>
              </tr>
            </tfoot>
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
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>Total</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>{totals.totalCrawlerHSD || 0}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Text strong>{totals.totalCamperHSD || 0}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <Text strong>{totals.totalCompressorHSD || 0}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <Text strong>{totals.totalTotalHSD || 0}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Text strong>{totals.totalMeter || 0}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <Text strong>{totals.totalCrawlerRPM || 0}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7}>
                  <Text strong>{totals.totalCompressorRPM || 0}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8}>
                  <Text strong>{totals.totalHoles || 0}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9}>
                  <Text strong>{totals.totalHsdMtr}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10}>
                  <Text strong>{totals.totalMtrRPM}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11}>
                  <Text strong>{totals.totalCrawlerHsdPerRpm > 0 ? totals.totalCrawlerHsdPerRpm : '-'}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12}>
                  <Text strong>{totals.totalCompHsdPerRpm > 0 ? totals.totalCompHsdPerRpm : '-'}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13}>
                  <Text strong>{totals.totalDepthAvg}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default ProductionReport;
