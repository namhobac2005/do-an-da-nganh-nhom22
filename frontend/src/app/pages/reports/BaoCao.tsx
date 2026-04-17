/**
 * BaoCao.tsx
 * Trang Báo Cáo & Thống Kê - lọc theo ngày/khu vực + xuất CSV/PDF
 */

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FileSpreadsheet, FileText, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import {
  getSensorReport,
  getAllLogs,
  getAllDevices,
  DeviceLog,
} from "../../services/deviceService";
import { MOCK_ZONES, MOCK_PONDS } from "../../data/mockData";

interface ReportDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isOnline: boolean;
  zoneId?: string;
}

interface AlertStat {
  name: string;
  value: number;
  color: string;
}

interface WeeklyPoint {
  day: string;
  "Nhiệt độ TB (°C)": number;
  "pH TB": number;
  "DO TB (mg/L)": number;
}

interface DeviceZonePoint {
  name: string;
  "Tổng thiết bị": number;
  "Đang hoạt động": number;
  Offline: number;
}

interface SensorReportRow {
  value: number;
  timestamp: string;
  sensors?: {
    type?: string;
  };
}

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const toIsoDay = (date: Date) => date.toISOString().slice(0, 10);

const inRange = (isoDate: string, from: string, to: string) => {
  return isoDate >= from && isoDate <= to;
};

const safeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const aggregateWeeklySensorData = (rows: SensorReportRow[]): WeeklyPoint[] => {
  const dayMap = new Map<
    string,
    {
      label: string;
      temperature: number[];
      ph: number[];
      doValue: number[];
    }
  >();

  rows.forEach((row) => {
    if (!row?.timestamp) return;

    const date = new Date(row.timestamp);
    if (Number.isNaN(date.getTime())) return;

    const key = toIsoDay(date);
    const label = DAY_LABELS[date.getDay()] || key;
    const sensorType = (row.sensors?.type || "").toLowerCase();
    const value = safeNumber(row.value, NaN);
    if (!Number.isFinite(value)) return;

    if (!dayMap.has(key)) {
      dayMap.set(key, {
        label,
        temperature: [],
        ph: [],
        doValue: [],
      });
    }

    const dayEntry = dayMap.get(key)!;
    if (sensorType === "temperature") dayEntry.temperature.push(value);
    if (sensorType === "ph") dayEntry.ph.push(value);
    if (sensorType === "do") dayEntry.doValue.push(value);
  });

  const avg = (values: number[], fallback: number) => {
    if (!values.length) return fallback;
    return Number((values.reduce((sum, cur) => sum + cur, 0) / values.length).toFixed(2));
  };

  return Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, value]) => ({
      day: value.label,
      "Nhiệt độ TB (°C)": avg(value.temperature, 0),
      "pH TB": avg(value.ph, 0),
      "DO TB (mg/L)": avg(value.doValue, 0),
    }));
};

const fallbackWeeklyData: WeeklyPoint[] = [
  { day: "T2", "Nhiệt độ TB (°C)": 27.4, "pH TB": 7.45, "DO TB (mg/L)": 5.2 },
  { day: "T3", "Nhiệt độ TB (°C)": 28.0, "pH TB": 7.5, "DO TB (mg/L)": 5.5 },
  { day: "T4", "Nhiệt độ TB (°C)": 28.3, "pH TB": 7.6, "DO TB (mg/L)": 5.7 },
  { day: "T5", "Nhiệt độ TB (°C)": 27.8, "pH TB": 7.55, "DO TB (mg/L)": 5.6 },
  { day: "T6", "Nhiệt độ TB (°C)": 27.2, "pH TB": 7.48, "DO TB (mg/L)": 5.3 },
  { day: "T7", "Nhiệt độ TB (°C)": 27.0, "pH TB": 7.42, "DO TB (mg/L)": 5.1 },
  { day: "CN", "Nhiệt độ TB (°C)": 26.8, "pH TB": 7.4, "DO TB (mg/L)": 5.0 },
];

export const BaoCao: React.FC = () => {
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [selectedZone, setSelectedZone] = useState("all");
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
  const [devices, setDevices] = useState<ReportDevice[]>([]);
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceZonePoint[]>([]);
  const [alertStats, setAlertStats] = useState<AlertStat[]>([
    { name: "Nguy cấp", value: 0, color: "#ef4444" },
    { name: "Cảnh báo", value: 0, color: "#f59e0b" },
    { name: "Thông tin", value: 0, color: "#3b82f6" },
  ]);
  const [deviceStats, setDeviceStats] = useState({
    totalActive: 0,
    totalOnline: 0,
    totalOffline: 0,
  });

  const filteredDevices = useMemo(() => {
    if (selectedZone === "all") return devices;
    return devices.filter((d) => d.zoneId === selectedZone);
  }, [devices, selectedZone]);

  const filteredLogs = useMemo(() => {
    const deviceMap = new Map(devices.map((d) => [d.id, d]));

    return logs.filter((log) => {
      const createdAt = (log.created_at || log.timestamp || "").slice(0, 10);
      if (!createdAt || !inRange(createdAt, dateFrom, dateTo)) return false;

      if (selectedZone === "all") return true;

      const deviceId = log.actuator_id || log.device_id || "";
      const device = deviceMap.get(deviceId);
      return device?.zoneId === selectedZone;
    });
  }, [logs, devices, dateFrom, dateTo, selectedZone]);

  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      try {
        const [devicesData, logsData, sensorReport] = await Promise.all([
          getAllDevices(),
          getAllLogs(500),
          getSensorReport("week"),
        ]);

        setDevices(devicesData as ReportDevice[]);
        setLogs(logsData);

        const rows = Array.isArray(sensorReport)
          ? (sensorReport as SensorReportRow[])
          : [];
        const aggregated = aggregateWeeklySensorData(rows);
        setWeeklyData(aggregated.length ? aggregated : fallbackWeeklyData);
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, []);

  useEffect(() => {
    const active = filteredDevices.filter((d) => d.isActive).length;
    const online = filteredDevices.filter((d) => d.isOnline).length;
    const offline = filteredDevices.length - online;

    setDeviceStats({
      totalActive: active,
      totalOnline: online,
      totalOffline: offline,
    });

    const onCount = filteredLogs.filter((l) => l.status === "ON").length;
    const offCount = filteredLogs.filter((l) => l.status === "OFF").length;
    const errorCount = filteredLogs.filter((l) => l.status === "ERROR").length;

    setAlertStats([
      { name: "Nguy cấp", value: errorCount, color: "#ef4444" },
      { name: "Cảnh báo", value: offCount, color: "#f59e0b" },
      { name: "Thông tin", value: onCount, color: "#3b82f6" },
    ]);

    const zonesToRender =
      selectedZone === "all"
        ? MOCK_ZONES
        : MOCK_ZONES.filter((zone) => zone.id === selectedZone);

    const zoneStats = zonesToRender.map((zone) => {
      const zoneDevices = filteredDevices.filter((d) => d.zoneId === zone.id);
      return {
        name: zone.name.split(" - ")[0],
        "Tổng thiết bị": zoneDevices.length,
        "Đang hoạt động": zoneDevices.filter((d) => d.isActive).length,
        Offline: zoneDevices.filter((d) => !d.isOnline).length,
      };
    });

    setDeviceData(zoneStats);
  }, [filteredDevices, filteredLogs, selectedZone]);

  const handleExport = async (type: "excel" | "pdf") => {
    setIsExporting(type);

    try {
      if (type === "excel") {
        const headers = [
          "Thoi gian",
          "Thiet bi",
          "Loai",
          "Hanh dong",
          "Trang thai",
          "Khu vuc",
        ];

        const deviceMap = new Map(devices.map((d) => [d.id, d]));
        const zoneMap = new Map(MOCK_ZONES.map((z) => [z.id, z.name]));
        const lines = filteredLogs.map((log) => {
          const deviceId = log.actuator_id || log.device_id || "";
          const device = deviceMap.get(deviceId);
          return [
            log.created_at || log.timestamp || "",
            device?.name || log.actuators?.name || "N/A",
            device?.type || log.actuators?.type || "N/A",
            log.action || "N/A",
            log.status || "N/A",
            zoneMap.get(device?.zoneId || "") || "N/A",
          ]
            .map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`)
            .join(",");
        });

        const csvContent = [headers.join(","), ...lines].join("\n");
        const blob = new Blob([`\uFEFF${csvContent}`], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `BaoCao_AoNuoi_${dateFrom}_${dateTo}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }

      if (type === "pdf") {
        const html = `
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Bao Cao Ao Nuoi</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
                h1 { margin: 0 0 8px; font-size: 24px; }
                .meta { margin-bottom: 16px; color: #475569; }
                table { border-collapse: collapse; width: 100%; margin-top: 12px; }
                th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
                th { background: #f1f5f9; }
              </style>
            </head>
            <body>
              <h1>BAO CAO HE THONG AO NUOI</h1>
              <div class="meta">Tu ngay: ${dateFrom} | Den ngay: ${dateTo} | Khu vuc: ${selectedZone === "all" ? "Tat ca" : selectedZone}</div>
              <div>Tong thiet bi: ${filteredDevices.length}</div>
              <div>Thiet bi hoat dong: ${deviceStats.totalActive}</div>
              <div>Thiet bi offline: ${deviceStats.totalOffline}</div>
              <div>Tong su kien log: ${filteredLogs.length}</div>
              <table>
                <thead>
                  <tr>
                    <th>Thoi gian</th>
                    <th>Thiet bi</th>
                    <th>Hanh dong</th>
                    <th>Trang thai</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredLogs
                    .slice(0, 100)
                    .map(
                      (log) =>
                        `<tr><td>${log.created_at || log.timestamp || ""}</td><td>${log.actuators?.name || log.device_id || "N/A"}</td><td>${log.action || "N/A"}</td><td>${log.status || "N/A"}</td></tr>`,
                    )
                    .join("")}
                </tbody>
              </table>
            </body>
          </html>
        `;

        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      }
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label
              className="block text-gray-600 mb-1.5"
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: "13px" }}
            />
          </div>
          <div>
            <label
              className="block text-gray-600 mb-1.5"
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              Đến ngày
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: "13px" }}
            />
          </div>
          <div>
            <label
              className="block text-gray-600 mb-1.5"
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              Khu vực
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: "13px" }}
            >
              <option value="all">Tất cả khu vực</option>
              {MOCK_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExport("excel")}
              disabled={!!isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              {isExporting === "excel" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet size={16} />
              )}
              Xuất Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={!!isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              {isExporting === "pdf" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              Xuất PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng ao hoạt động",
            value: (selectedZone === "all"
              ? MOCK_PONDS
              : MOCK_PONDS.filter((p) => p.zoneId === selectedZone)
            ).filter((p) => p.status === "active").length,
            unit: "ao",
            color: "text-blue-700",
            bg: "bg-blue-50",
            icon: <TrendingUp className="text-blue-600" />,
          },
          {
            label: "Thiết bị hoạt động",
            value: deviceStats.totalActive,
            unit: "thiết bị",
            color: "text-emerald-700",
            bg: "bg-emerald-50",
            icon: <Zap className="text-emerald-600" />,
          },
          {
            label: "Cảnh báo",
            value: alertStats.reduce((sum, a) => sum + a.value, 0),
            unit: "sự kiện",
            color: "text-amber-700",
            bg: "bg-amber-50",
            icon: <AlertTriangle className="text-amber-600" />,
          },
          {
            label: "Thiết bị Offline",
            value: deviceStats.totalOffline,
            unit: "thiết bị",
            color: "text-red-700",
            bg: "bg-red-50",
            icon: (
              <div className="w-5 h-5 rounded-full border-2 border-red-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
              </div>
            ),
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 mb-1" style={{ fontSize: "12px" }}>
                  {kpi.label}
                </p>
                <p
                  className={kpi.color}
                  style={{ fontSize: "26px", fontWeight: 700, lineHeight: 1.2 }}
                >
                  {kpi.value}
                  <span style={{ fontSize: "13px", fontWeight: 400 }}>
                    {" "}
                    {kpi.unit}
                  </span>
                </p>
              </div>
              <div className="opacity-40">{kpi.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3
                className="text-gray-900 mb-4"
                style={{ fontSize: "15px", fontWeight: 600 }}
              >
                Xu Hướng Cảm Biến Trong Tuần
              </h3>
              {weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v: number) => v.toFixed(2)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="Nhiệt độ TB (°C)"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pH TB"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="DO TB (mg/L)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Chưa có dữ liệu</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3
                className="text-gray-900 mb-4"
                style={{ fontSize: "15px", fontWeight: 600 }}
              >
                Phân Bố Cảnh Báo
              </h3>
              {alertStats.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={alertStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                        style={{ fontSize: 10 }}
                      >
                        {alertStats.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {alertStats.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span
                            className="text-gray-600"
                            style={{ fontSize: "12px" }}
                          >
                            {item.name}
                          </span>
                        </div>
                        <span
                          className="text-gray-900"
                          style={{ fontSize: "13px", fontWeight: 600 }}
                        >
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-500">Chưa có dữ liệu</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3
              className="text-gray-900 mb-4"
              style={{ fontSize: "15px", fontWeight: 600 }}
            >
              Thống Kê Thiết Bị Theo Khu Vực
            </h3>
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deviceData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    allowDecimals={false}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="Tổng thiết bị"
                    fill="#e2e8f0"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Đang hoạt động"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar dataKey="Offline" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">Chưa có dữ liệu</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
