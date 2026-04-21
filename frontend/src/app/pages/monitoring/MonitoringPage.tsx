import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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
} from 'recharts';
import {
  ThermometerSun,
  Waves,
  Sun,
  MapPin,
  Fish,
  Activity,
  RefreshCw,
  Wifi,
} from 'lucide-react';

// Cấu hình Base URL của Backend
const API_BASE_URL = 'http://localhost:5000/sensors';

const SENSOR_META: Record<string, any> = {
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
  const [dbZones, setDbZones] = useState<any[]>([]);
  const [dbPonds, setDbPonds] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPond, setSelectedPond] = useState<string>('');

  const [sensors, setSensors] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Lấy danh sách Vùng nuôi khi load trang
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/zones`);
        // SẮP XẾP Ở FRONTEND THEO TÊN (A-Z)
        const sortedZones = (res.data || []).sort((a: any, b: any) =>
          a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }),
        );
        setDbZones(sortedZones);
      } catch (err) {
        console.error('Lỗi lấy Zone:', err);
      }
    };
    fetchZones();
  }, []);

  // 2. Lấy danh sách Ao khi chọn Vùng
  useEffect(() => {
    const fetchPonds = async () => {
      if (!selectedZone) {
        setDbPonds([]);
        return;
      }
      try {
        const res = await axios.get(
          `${API_BASE_URL}/zones/${selectedZone}/ponds`,
        );
        // SẮP XẾP AO THEO TÊN (A-Z)
        const sortedPonds = (res.data || []).sort((a: any, b: any) =>
          a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }),
        );
        setDbPonds(sortedPonds);
      } catch (err) {
        console.error('Lỗi lấy Pond:', err);
      }
    };
    fetchPonds();
  }, [selectedZone]);

  // 3. Hàm fetch dữ liệu cảm biến (Latest & History)
  const loadMonitoringData = async () => {
    if (!selectedPond) return;
    setIsLoading(true);
    try {
      const [resLatest, resHistory] = await Promise.all([
        axios.get(`${API_BASE_URL}/latest`, {
          params: { pondId: selectedPond },
        }),
        axios.get(`${API_BASE_URL}/history`, {
          params: { pondId: selectedPond, limit: 50 },
        }),
      ]);
      setSensors(resLatest.data || []);
      setHistory(resHistory.data || []);
    } catch (err) {
      console.error('Lỗi load dữ liệu giám sát:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động reload sau mỗi 10 giây
  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 10000);
    return () => clearInterval(interval);
  }, [selectedPond]);

  // 4. Xử lý dữ liệu hội tụ cho biểu đồ
  const chartData = useMemo(() => {
    const groups: Record<string, any> = {};

    if (!history || history.length === 0) return [];

    history.forEach((item: any) => {
      // 1. CHUYỂN TIMESTAMP VỀ CHUỖI HIỂN THỊ ĐỒNG NHẤT (Ví dụ: "22:05:01")
      // Dùng cái này làm KEY để các cảm biến "nhập" vào chung 1 cột dọc
      const timeDisplay = new Date(item.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Nếu chưa có mốc thời gian này trong groups thì tạo mới
      if (!groups[timeDisplay]) {
        groups[timeDisplay] = {
          time: timeDisplay,
          fullTimestamp: new Date(item.timestamp).getTime(), // Dùng để sắp xếp chuẩn
        };
      }

      const type = item.sensors?.type;
      if (type && SENSOR_META[type]) {
        // Đưa giá trị của sensor vào đúng nhãn (Nhiệt độ, Mực nước,...) của mốc thời gian đó
        groups[timeDisplay][SENSOR_META[type].label] = item.value;
      }
    });

    // 2. Chuyển từ Object sang Array và SORT theo thời gian thực tế (tránh biểu đồ nhảy lộn xộn)
    const sortedData = Object.values(groups).sort(
      (a: any, b: any) => a.fullTimestamp - b.fullTimestamp,
    );

    return sortedData;
  }, [history]);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* THANH CHỌN KHU VỰC */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <MapPin className="text-slate-400" size={20} />
          <select
            className="w-full bg-transparent font-semibold text-slate-700 outline-none"
            value={selectedZone}
            onChange={(e) => {
              setSelectedZone(e.target.value);
              setSelectedPond('');
            }}
          >
            <option value="">-- Chọn Vùng Nuôi --</option>
            {dbZones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
          <Fish className="text-slate-400" size={20} />
          <select
            className="w-full bg-transparent font-semibold text-slate-700 outline-none"
            disabled={!selectedZone}
            value={selectedPond}
            onChange={(e) => setSelectedPond(e.target.value)}
          >
            <option value="">-- Chọn Ao Nuôi --</option>
            {dbPonds.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedPond ? (
        /* TRẠNG THÁI TRỐNG */
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
          <Activity size={64} className="mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-slate-500">
            Hệ thống giám sát thực tế
          </h3>
          <p>Vui lòng chọn Vùng và Ao để kết nối dữ liệu từ thiết bị.</p>
        </div>
      ) : (
        /* TRẠNG THÁI CÓ DỮ LIỆU */
        <div className="space-y-6 animate-in fade-in duration-700">
          {/* CÁC THẺ SENSOR (CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.keys(SENSOR_META).map((type) => {
              const sensorData = sensors.find((s) => s.type === type);
              const meta = SENSOR_META[type];
              return (
                <div
                  key={type}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          backgroundColor: `${meta.color}15`,
                          color: meta.color,
                        }}
                      >
                        {meta.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-800">
                      {sensorData?.value ?? '--'}
                    </span>
                    <span className="text-slate-400 font-bold">
                      {meta.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BIỂU ĐỒ DIỄN BIẾN (CHART) */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Diễn biến môi trường hồ nuôi
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Dữ liệu được thu thập từ các trạm cảm biến IoT
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase">
                  Real-time
                </span>
              </div>
            </div>

            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />

                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }} // Đường ngang ở dưới
                    tickLine={false}
                    minTickGap={15}
                    type="category"
                    boundaryGap={false}
                    padding={{ left: 0, right: 0 }}
                  />

                  {/* Trục Y trái: Có đường kẻ dọc màu Cam */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: '#f97316', fontWeight: 'bold' }}
                    unit="°C"
                    axisLine={{ stroke: '#f97316', strokeWidth: 2 }} // ĐƯỜNG KẺ DỌC MÀU CAM
                    tickLine={true}
                    padding={{ top: 20, bottom: 5 }}
                  />

                  {/* Trục Y phải: Có đường kẻ dọc màu Xanh */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#3b82f6', fontWeight: 'bold' }}
                    unit="%"
                    axisLine={{ stroke: '#3b82f6', strokeWidth: 2 }} // ĐƯỜNG KẺ DỌC MÀU XANH
                    tickLine={true}
                    padding={{ top: 20, bottom: 5 }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                  />

                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: '30px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  />

                  {Object.entries(SENSOR_META).map(([key, meta]) => (
                    <Line
                      key={key}
                      yAxisId={meta.yAxisId}
                      type="monotone"
                      dataKey={meta.label}
                      stroke={meta.color}
                      strokeWidth={4}
                      dot={{
                        r: 5,
                        fill: '#fff',
                        stroke: meta.color,
                        strokeWidth: 3,
                      }}
                      activeDot={{ r: 8, fill: meta.color, strokeWidth: 0 }}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
