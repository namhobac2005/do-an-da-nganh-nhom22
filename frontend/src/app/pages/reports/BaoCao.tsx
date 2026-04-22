import { useEffect, useMemo, useState } from "react";
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
import { FileSpreadsheet, FileText } from "lucide-react";
import {
  getDashboardReport,
  type DashboardReport,
} from "../../services/reportService";

const DEVICE_TYPES = [
  { value: "all", label: "Tất cả thiết bị" },
  { value: "pump", label: "Máy bơm" },
  { value: "fan", label: "Quạt" },
  { value: "light", label: "Đèn" },
  { value: "servo", label: "Servo" },
];

const PIE_COLORS = ["#10b981", "#3b82f6", "#f97316", "#ef4444", "#a855f7"];

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

export const BaoCao: React.FC = () => {
  const [dateFrom, setDateFrom] = useState(
    formatDateInput(new Date(Date.now() - 6 * 24 * 3600 * 1000)),
  );
  const [dateTo, setDateTo] = useState(formatDateInput(new Date()));
  const [actuatorType, setActuatorType] = useState("all");
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<DashboardReport | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      const data = await getDashboardReport({
        from: `${dateFrom}T00:00:00.000Z`,
        to: `${dateTo}T23:59:59.999Z`,
        actuatorType,
      });
      setReportData(data);
      setIsLoading(false);
    };

    fetchReport();
  }, [dateFrom, dateTo, actuatorType]);

  const chartData = useMemo(
    () =>
      (reportData?.sensorTrend || []).map((row) => ({
        day: new Date(row.day).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        }),
        "Nhiệt độ TB (°C)": row.temperature
          ? Number(row.temperature.toFixed(2))
          : null,
        "Mực nước TB (%)": row.waterLevel
          ? Number(row.waterLevel.toFixed(2))
          : null,
        "Ánh sáng TB (%)": row.brightness
          ? Number(row.brightness.toFixed(2))
          : null,
      })),
    [reportData],
  );

  const exportTextData = () => {
    if (!reportData) return "";

    const lines = [
      `Bao cao tu ${dateFrom} den ${dateTo}`,
      `Tong thiet bi: ${reportData.kpis.totalDevices}`,
      `Dang hoat dong: ${reportData.kpis.activeDevices}`,
      `Dang tat/offline: ${reportData.kpis.offlineDevices}`,
      `Tong lenh dieu khien: ${reportData.kpis.totalCommands}`,
      "",
      "Nhat ky gan day:",
      ...(reportData.latestLogs || []).map(
        (log) =>
          `${new Date(log.created_at).toLocaleString("vi-VN")} | ${log.actuators?.name || "N/A"} | ${log.action} | ${log.status}`,
      ),
    ];

    return lines.join("\n");
  };

  const handleExport = async (type: "excel" | "pdf") => {
    setIsExporting(type);

    const blob = new Blob([exportTextData()], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BaoCao_AoNuoi_${dateFrom}_${dateTo}.${type === "excel" ? "csv" : "txt"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExporting(null);
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
              Loại thiết bị
            </label>
            <select
              value={actuatorType}
              onChange={(e) => setActuatorType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: "13px" }}
            >
              {DEVICE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => handleExport("excel")}
              disabled={!!isExporting || !reportData}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              {isExporting === "excel" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet size={16} />
              )}
              Xuất dữ liệu
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={!!isExporting || !reportData}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              {isExporting === "pdf" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileText size={16} />
              )}
              Xuất nhanh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng thiết bị",
            value: reportData?.kpis.totalDevices || 0,
            unit: "thiết bị",
            color: "text-blue-700",
            bg: "bg-blue-50",
          },
          {
            label: "Thiết bị hoạt động",
            value: reportData?.kpis.activeDevices || 0,
            unit: "thiết bị",
            color: "text-emerald-700",
            bg: "bg-emerald-50",
          },
          {
            label: "Thiết bị OFF",
            value: reportData?.kpis.offlineDevices || 0,
            unit: "thiết bị",
            color: "text-amber-700",
            bg: "bg-amber-50",
          },
          {
            label: "Lệnh điều khiển",
            value: reportData?.kpis.totalCommands || 0,
            unit: "lệnh",
            color: "text-purple-700",
            bg: "bg-purple-50",
          },
        ].map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl p-5`}>
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
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3
            className="text-gray-900 mb-4"
            style={{ fontSize: "15px", fontWeight: 600 }}
          >
            Xu Hướng Cảm Biến Theo Ngày
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
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
                dataKey="Mực nước TB (%)"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Ánh sáng TB (%)"
                stroke="#eab308"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3
            className="text-gray-900 mb-4"
            style={{ fontSize: "15px", fontWeight: 600 }}
          >
            Phân Bố Lệnh Điều Khiển
          </h3>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie
                data={reportData?.logDistribution || []}
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
                {(reportData?.logDistribution || []).map((entry, i) => (
                  <Cell
                    key={`${entry.name}-${i}`}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {(reportData?.logDistribution || []).map((item, i) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-gray-600" style={{ fontSize: "12px" }}>
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
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3
          className="text-gray-900 mb-4"
          style={{ fontSize: "15px", fontWeight: 600 }}
        >
          Nhật Ký Điều Khiển Gần Đây
        </h3>
        {isLoading ? (
          <p className="text-gray-400" style={{ fontSize: "12px" }}>
            Đang tải dữ liệu báo cáo...
          </p>
        ) : reportData?.latestLogs?.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={reportData.latestLogs.slice(0, 12).map((log, index) => ({
                name: log.actuators?.name || `Thiết bị ${index + 1}`,
                value: 1,
              }))}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                allowDecimals={false}
              />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar
                dataKey="value"
                name="Số lệnh"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400" style={{ fontSize: "12px" }}>
            Không có dữ liệu log trong khoảng thời gian đã chọn.
          </p>
        )}
      </div>
    </div>
  );
};
