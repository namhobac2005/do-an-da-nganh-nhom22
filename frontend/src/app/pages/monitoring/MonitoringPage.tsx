import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Area,
  AreaChart,
} from 'recharts';
import {
  ThermometerSun,
  Waves,
  Sun,
  RefreshCw,
  Wifi,
  Activity,
} from 'lucide-react';
import * as sensorService from '../../services/sensorService';

const SENSOR_META: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ReactNode;
    unit: string;
    yAxisId: string;
  }
> = {
  temperature: {
    label: 'Nhiệt độ',
    color: '#f97316',
    icon: <ThermometerSun size={18} />,
    unit: '°C',
    yAxisId: 'left',
  },
  'water-level': {
    label: 'Mực nước',
    color: '#3b82f6',
    icon: <Waves size={18} />,
    unit: '%',
    yAxisId: 'right',
  },
  brightness: {
    label: 'Ánh sáng',
    color: '#eab308',
    icon: <Sun size={18} />,
    unit: '%',
    yAxisId: 'right',
  },
};

export const MonitoringPage: React.FC = () => {
  const [sensors, setSensors] = useState<sensorService.SensorData[]>([]);
  const [history, setHistory] = useState<sensorService.HistoryRecord[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const loadAllData = async () => {
    setIsLoading(true);
    const [latest, hist] = await Promise.all([
      sensorService.getLatestSensors(),
      sensorService.getSensorHistory(30),
    ]);
    setSensors(latest.filter((s) => SENSOR_META[s.type]));
    setHistory(hist);
    setLastUpdated(new Date());
    setIsLoading(false);
  };

  useEffect(() => {
    loadAllData();
    const timer = setInterval(loadAllData, 5000);
    return () => clearInterval(timer);
  }, []);

  const chartData = useMemo(() => {
    const groups: Record<string, any> = {};
    const reversedHistory = [...history].reverse();
    if (reversedHistory.length === 0) return [];

    reversedHistory.forEach((item, index) => {
      const timeStr = new Date(item.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      if (!groups[timeStr]) groups[timeStr] = { time: timeStr };
      const type = item.sensors?.type;
      if (type && SENSOR_META[type]) {
        groups[timeStr][SENSOR_META[type].label] = item.value;
        if (index === reversedHistory.length - 1) {
          groups[timeStr][`${SENSOR_META[type].label}_isLast`] = true;
        }
      }
    });
    return Object.values(groups);
  }, [history]);

  const renderCustomizedLabel = (props: any) => {
    const { x, y, value, index, data, dataKey } = props;
    if (!data || !data[index] || !data[index][`${dataKey}_isLast`]) return null;
    return (
      <g>
        <rect
          x={x - 15}
          y={y - 28}
          width={30}
          height={18}
          rx={4}
          fill="white"
          stroke="#e2e8f0"
          strokeWidth={1}
        />
        <text
          x={x}
          y={y}
          dy={-15}
          fill="#1e293b"
          fontSize={11}
          fontWeight="bold"
          textAnchor="middle"
        >
          {value}
        </text>
      </g>
    );
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Wifi size={20} className="text-emerald-500 animate-pulse" />
          <h1 className="text-base font-bold text-gray-800 tracking-tight">
            Hệ Thống Giám Sát Real-time
          </h1>
        </div>
        <button
          onClick={loadAllData}
          className="p-2 hover:bg-gray-100 rounded-xl transition-all"
        >
          <RefreshCw
            size={18}
            className={`${isLoading ? 'animate-spin' : ''} text-gray-500`}
          />
        </button>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.keys(SENSOR_META).map((type) => {
          const sensorData = sensors.find((s) => s.type === type);
          const meta = SENSOR_META[type];
          return (
            <div
              key={type}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${meta.color}15`,
                    color: meta.color,
                  }}
                >
                  {meta.icon}
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {meta.label}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-800">
                  {sensorData?.value ?? '--'}
                </span>
                <span className="text-gray-400 font-bold text-sm">
                  {meta.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={18} className="text-blue-500" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-tight">
            Biểu đồ lịch sử chi tiết
          </h2>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 30, right: 40, left: 10, bottom: 10 }}
            >
              {/* Guild: Tăng độ đậm của lưới (strokeOpacity) và dùng màu xám đậm hơn (#cbd5e1) */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#cbd5e1"
                vertical={true}
                strokeOpacity={0.5}
              />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#94a3b8' }}
                tickLine={true}
              />

              {/* Trục Y trái: Nhiệt độ (Màu cam đậm) */}
              <YAxis
                yAxisId="left"
                orientation="left"
                unit="°C"
                tick={{ fontSize: 10, fill: '#f97316', fontWeight: 700 }}
                axisLine={{ stroke: '#f97316' }}
              />

              {/* Trục Y phải: % (Màu xanh đậm) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                unit="%"
                tick={{ fontSize: 10, fill: '#2563eb', fontWeight: 700 }}
                axisLine={{ stroke: '#2563eb' }}
              />

              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                }}
              />

              <Legend
                iconType="circle"
                wrapperStyle={{
                  fontSize: '12px',
                  paddingTop: '20px',
                  fontWeight: 600,
                }}
              />

              {Object.entries(SENSOR_META).map(([key, m]) => (
                <Line
                  key={m.label}
                  yAxisId={m.yAxisId}
                  type="monotone"
                  dataKey={m.label}
                  stroke={m.color}
                  strokeWidth={4} // Tăng độ đậm đường Line lên 4 (rất rõ)
                  connectNulls={true}
                  animationDuration={500}
                  // FIX LỖI DOT: Kiểm tra chính xác điểm cuối cho từng đường
                  dot={(props: any) => {
                    const { cx, cy, index, dataKey } = props;
                    // Kiểm tra flag isLast dựa trên dataKey tương ứng
                    const isLast =
                      chartData[index] && chartData[index][`${dataKey}_isLast`];

                    return (
                      <circle
                        key={`${dataKey}-dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={isLast ? 6 : 3.5}
                        fill={isLast ? m.color : '#fff'}
                        stroke={m.color}
                        strokeWidth={isLast ? 0 : 2.5} // Điểm thường có viền đậm, điểm cuối fill đặc
                      />
                    );
                  }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                >
                  <LabelList
                    dataKey={m.label}
                    content={(p) =>
                      renderCustomizedLabel({ ...p, data: chartData })
                    }
                  />
                </Line>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
