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
import { jsPDF } from "jspdf";
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

const formatDateLabel = (dateValue: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateValue));

const escapeCsv = (value: string | number | null | undefined) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const actuatorTypeLabels: Record<string, string> = {
  all: "Tất cả thiết bị",
  pump: "Máy bơm",
  fan: "Quạt",
  light: "Đèn",
  servo: "Servo",
};

const buildCsvReport = (
  reportData: DashboardReport,
  dateFrom: string,
  dateTo: string,
  actuatorType: string,
) => {
  const lines: string[] = ["\ufeffBáo cáo tổng hợp;Giá trị"];

  lines.push(
    `Từ ngày;${escapeCsv(dateFrom)}`,
    `Đến ngày;${escapeCsv(dateTo)}`,
    `Loại thiết bị;${escapeCsv(actuatorTypeLabels[actuatorType] || actuatorType)}`,
    "",
    "KPI;Giá trị;Đơn vị",
    `Tổng thiết bị;${reportData.kpis.totalDevices};thiết bị`,
    `Thiết bị hoạt động;${reportData.kpis.activeDevices};thiết bị`,
    `Thiết bị OFF;${reportData.kpis.offlineDevices};thiết bị`,
    `Tổng lệnh điều khiển;${reportData.kpis.totalCommands};lệnh`,
    "",
    "Xu hướng cảm biến;Ngày;Nhiệt độ TB (°C);Mực nước TB (%);Ánh sáng TB (%)",
  );

  reportData.sensorTrend.forEach((row) => {
    lines.push(
      [
        "",
        escapeCsv(formatDateLabel(row.day)),
        escapeCsv(row.temperature ?? "-"),
        escapeCsv(row.waterLevel ?? "-"),
        escapeCsv(row.brightness ?? "-"),
      ].join(";"),
    );
  });

  lines.push("", "Phân bố lệnh điều khiển;Tên;Số lượng");

  reportData.logDistribution.forEach((item) => {
    lines.push(`;${escapeCsv(item.name)};${escapeCsv(item.value)}`);
  });

  return lines.join("\n");
};

const buildPdfReport = async (
  reportData: DashboardReport,
  dateFrom: string,
  dateTo: string,
  actuatorType: string,
) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.padding = "32px";
  container.style.background = "#ffffff";
  container.style.color = "#0f172a";
  container.style.fontFamily = "Arial, sans-serif";
  container.innerHTML = `
    <div style="border:1px solid #e2e8f0;border-radius:18px;padding:24px;">
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:20px;">
        <div>
          <div style="font-size:22px;font-weight:700;letter-spacing:.02em;">BÁO CÁO THỐNG KÊ AO NUÔI</div>
          <div style="margin-top:8px;color:#475569;font-size:13px;">
            Kỳ báo cáo: ${escapeHtml(dateFrom)} - ${escapeHtml(dateTo)}
          </div>
          <div style="margin-top:4px;color:#475569;font-size:13px;">
            Thiết bị: ${escapeHtml(actuatorTypeLabels[actuatorType] || actuatorType)}
          </div>
        </div>
        <div style="min-width:180px;padding:14px 16px;border-radius:14px;background:#ecfdf5;border:1px solid #a7f3d0;">
          <div style="font-size:12px;color:#059669;text-transform:uppercase;font-weight:700;letter-spacing:.08em;">Tổng lệnh</div>
          <div style="font-size:28px;font-weight:800;color:#047857;margin-top:8px;">${reportData.kpis.totalCommands}</div>
        </div>
      </div>

      <section style="margin-top:18px;">
        <h2 style="font-size:16px;margin:0 0 12px 0;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Tổng quan KPI</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tbody>
            ${[
              ["Tổng thiết bị", reportData.kpis.totalDevices],
              ["Thiết bị hoạt động", reportData.kpis.activeDevices],
              ["Thiết bị OFF", reportData.kpis.offlineDevices],
              ["Tổng lệnh điều khiển", reportData.kpis.totalCommands],
            ]
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#334155;">${escapeHtml(label)}</td>
                    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;">${escapeHtml(value)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </section>

      <section style="margin-top:22px;">
        <h2 style="font-size:16px;margin:0 0 12px 0;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Xu hướng cảm biến theo ngày</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="text-align:left;color:#475569;">
              <th style="padding:8px 0;">Ngày</th>
              <th style="padding:8px 0;">Nhiệt độ TB</th>
              <th style="padding:8px 0;">Mực nước TB</th>
              <th style="padding:8px 0;">Ánh sáng TB</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.sensorTrend
              .map(
                (row) => `
                  <tr>
                    <td style="padding:8px 0;border-top:1px solid #f1f5f9;">${escapeHtml(formatDateLabel(row.day))}</td>
                    <td style="padding:8px 0;border-top:1px solid #f1f5f9;">${escapeHtml(row.temperature?.toFixed(2) ?? "-")}</td>
                    <td style="padding:8px 0;border-top:1px solid #f1f5f9;">${escapeHtml(row.waterLevel?.toFixed(2) ?? "-")}</td>
                    <td style="padding:8px 0;border-top:1px solid #f1f5f9;">${escapeHtml(row.brightness?.toFixed(2) ?? "-")}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </section>

      <section style="margin-top:22px;">
        <h2 style="font-size:16px;margin:0 0 12px 0;padding-bottom:8px;border-bottom:1px solid #e2e8f0;">Phân bố lệnh điều khiển</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tbody>
            ${reportData.logDistribution
              .map(
                (item) => `
                  <tr>
                    <td style="padding:8px 0;border-top:1px solid #f1f5f9;">${escapeHtml(item.name)}</td>
                    <td style="padding:8px 0;border-top:1px solid #f1f5f9;text-align:right;font-weight:700;">${escapeHtml(item.value)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </section>

    </div>
  `;

  document.body.appendChild(container);

  try {
    await new Promise<void>((resolve) => {
      doc.html(container, {
        margin: [24, 24, 24, 24],
        autoPaging: "text",
        width: 552,
        windowWidth: 800,
        callback: (generatedDoc) => {
          generatedDoc.save(`BaoCao_AoNuoi_${dateFrom}_${dateTo}.pdf`);
          resolve();
        },
      });
    });
  } finally {
    document.body.removeChild(container);
  }
};

export const BaoCao: React.FC = () => {
  const [dateFrom, setDateFrom] = useState(
    formatDateInput(new Date(Date.now() - 6 * 24 * 3600 * 1000)),
  );
  const [dateTo, setDateTo] = useState(formatDateInput(new Date()));
  const [actuatorType, setActuatorType] = useState("all");
  const [isExporting, setIsExporting] = useState<"excel" | "pdf" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<DashboardReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDateRangeValid = dateFrom <= dateTo;

  useEffect(() => {
    let isMounted = true;

    const fetchReport = async () => {
      if (!isDateRangeValid) {
        setErrorMessage("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.");
        setReportData(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      const data = await getDashboardReport({
        from: `${dateFrom}T00:00:00.000Z`,
        to: `${dateTo}T23:59:59.999Z`,
        actuatorType,
      });

      if (!isMounted) return;

      setReportData(data);
      if (!data) {
        setErrorMessage(
          "Không tải được dữ liệu báo cáo. Vui lòng thử lại sau.",
        );
      }
      setIsLoading(false);
    };

    fetchReport();

    return () => {
      isMounted = false;
    };
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
    return buildCsvReport(reportData, dateFrom, dateTo, actuatorType);
  };

  const handleExport = async (type: "excel" | "pdf") => {
    if (!reportData) return;

    setIsExporting(type);

    try {
      if (type === "excel") {
        const blob = new Blob([exportTextData()], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BaoCao_AoNuoi_${dateFrom}_${dateTo}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      await buildPdfReport(reportData, dateFrom, dateTo, actuatorType);
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
              disabled={!!isExporting || !reportData || !isDateRangeValid}
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
              disabled={!!isExporting || !reportData || !isDateRangeValid}
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

        {!isDateRangeValid ? (
          <p className="mt-3 text-red-500" style={{ fontSize: "12px" }}>
            Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.
          </p>
        ) : errorMessage ? (
          <p className="mt-3 text-amber-600" style={{ fontSize: "12px" }}>
            {errorMessage}
          </p>
        ) : null}
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
    </div>
  );
};
