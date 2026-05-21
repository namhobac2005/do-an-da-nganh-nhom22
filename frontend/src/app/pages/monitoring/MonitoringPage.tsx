import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ThermometerSun,
  Waves,
  Sun,
  Activity,
} from 'lucide-react';
import { ZonePondSelector } from '../../components/common/ZonePondSelector';
import * as sensorService from '../../services/sensorService';

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
  const [searchParams] = useSearchParams();
  const urlZoneId  = searchParams.get('zoneId');
  const urlPondId  = searchParams.get('pondId');

  const [selectedPond, setSelectedPond] = useState<string>(urlPondId || '');
  const [sensors,      setSensors]      = useState<sensorService.SensorData[]>([]);
  const [history,      setHistory]      = useState<sensorService.HistoryRecord[]>([]);
  const [isLoading,    setIsLoading]    = useState(false);

  // Fetch cảm biến mới nhất + lịch sử cho ao đang chọn
  const loadMonitoringData = useCallback(async (pondId: string) => {
    if (!pondId) return;
    setIsLoading(true);
    try {
      const [latestData, historyData] = await Promise.all([
        sensorService.getLatestSensors(pondId),
        sensorService.getSensorHistory(pondId, 50),
      ]);
      setSensors(latestData);
      setHistory(historyData);
    } catch (err) {
      console.error('[MonitoringPage] Lỗi load dữ liệu giám sát:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tải lại khi ao thay đổi, tự động refresh mỗi 10 giây
  useEffect(() => {
    if (!selectedPond) {
      setSensors([]);
      setHistory([]);
      return;
    }
    loadMonitoringData(selectedPond);
    const interval = setInterval(() => loadMonitoringData(selectedPond), 10_000);
    return () => clearInterval(interval);
  }, [selectedPond, loadMonitoringData]);

  // 4. Xử lý dữ liệu hội tụ cho biểu đồ
  const chartData = useMemo(() => {
    const groups: Record<string, any> = {};
    if (!history || history.length === 0) return [];

    history.forEach((item: any) => {
      const timeDisplay = new Date(item.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      if (!groups[timeDisplay]) {
        groups[timeDisplay] = {
          time: timeDisplay,
          fullTimestamp: new Date(item.timestamp).getTime(),
        };
      }

      const type = item.sensors?.type;
      if (type && SENSOR_META[type]) {
        groups[timeDisplay][SENSOR_META[type].label] = item.value;
      }
    });

    let sortedData = Object.values(groups).sort(
      (a: any, b: any) => a.fullTimestamp - b.fullTimestamp,
    );

    const firstValidIndex = sortedData.findIndex(
      (point) => point[SENSOR_META.temperature.label] !== undefined,
    );

    if (firstValidIndex !== -1) {
      sortedData = sortedData.slice(firstValidIndex);
    }

    return sortedData;
  }, [history]);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* CASCADING ZONE > POND SELECTOR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-slate-900 text-lg font-bold mb-4">Giám Sát Thực Tế</h3>
        <ZonePondSelector
          onPondSelect={(pondId) => setSelectedPond(pondId)}
          initialPondId={urlPondId}
          initialZoneId={urlZoneId}
          className="w-full"
        />
      </div>

      {!selectedPond ? (
        /* TRẠNG THÁI CHƯA CHỌN AO */
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
          <Activity size={64} className="mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-slate-500">Chưa chọn ao nuôi</h3>
          <p className="mt-1 text-sm">Vui lòng chọn <strong>Vùng nuôi</strong> rồi chọn <strong>Ao nuôi</strong> để kết nối dữ liệu từ thiết bị.</p>
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
                {isLoading && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase animate-pulse">
                    Đang tải...
                  </span>
                )}
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
                    axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                    tickLine={false}
                    minTickGap={15}
                    type="category"
                    boundaryGap={false}
                    padding={{ left: 0, right: 0 }}
                  />

                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12, fill: '#f97316', fontWeight: 'bold' }}
                    unit="°C"
                    axisLine={{ stroke: '#f97316', strokeWidth: 2 }}
                    tickLine={true}
                    padding={{ top: 20, bottom: 5 }}
                  />

                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, fill: '#3b82f6', fontWeight: 'bold' }}
                    unit="%"
                    axisLine={{ stroke: '#3b82f6', strokeWidth: 2 }}
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
