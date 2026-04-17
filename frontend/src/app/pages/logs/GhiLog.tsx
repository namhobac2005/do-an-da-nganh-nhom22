/**
 * GhiLog.tsx
 * Trang Ghi Log - Xem lịch sử hoạt động của thiết bị
 */

import { useState, useEffect } from "react";
import {
  Activity,
  Filter,
  Download,
  Calendar,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Zap,
  Wind,
  Droplets,
  Lightbulb,
  Clock,
  User,
  BarChart3,
} from "lucide-react";
import {
  getAllLogs,
  getDeviceLogs,
  getAllDevices,
} from "../../services/deviceService";

interface DeviceLog {
  id?: string;
  actuator_id?: string;
  device_id?: string;
  action: string;
  status: string;
  user_id?: string;
  created_at?: string;
  timestamp?: string;
  actuators?: {
    name: string;
    type: string;
  };
}

interface Device {
  id: string;
  name: string;
  type: string;
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  pump: <Droplets size={18} />,
  fan: <Wind size={18} />,
  light: <Lightbulb size={18} />,
  servo: <Zap size={18} />,
};

const DEVICE_TYPE_COLORS: Record<string, string> = {
  pump: "bg-blue-100 text-blue-700",
  fan: "bg-teal-100 text-teal-700",
  light: "bg-yellow-100 text-yellow-700",
  servo: "bg-purple-100 text-purple-700",
};

export const GhiLog: React.FC = () => {
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDeviceId, setFilterDeviceId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [limit, setLimit] = useState("100");

  // Load dữ liệu khi component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [logsData, devicesData] = await Promise.all([
          getAllLogs(parseInt(limit) || 100),
          getAllDevices(),
        ]);
        setLogs(logsData);
        setDevices(devicesData);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [limit]);

  const handleLoadByDevice = async () => {
    if (filterDeviceId === "all") {
      // Load all logs
      const logsData = await getAllLogs(parseInt(limit) || 100);
      setLogs(logsData);
    } else {
      // Load logs for specific device
      const logsData = await getDeviceLogs(
        filterDeviceId,
        parseInt(limit) || 100,
        dateFrom,
        dateTo,
      );
      setLogs(logsData);
    }
  };

  const handleReset = () => {
    setFilterDeviceId("all");
    setDateFrom("");
    setDateTo("");
    setLimit("100");
  };

  const handleExport = () => {
    const csv = [
      [
        "Thời gian",
        "Thiết bị",
        "Loại",
        "Hành động",
        "Trạng thái",
        "Người dùng",
      ].join(","),
      ...logs.map((log) =>
        [
          log.created_at || log.timestamp || "N/A",
          log.actuators?.name || "Unknown",
          log.actuators?.type || "N/A",
          log.action,
          log.status,
          log.user_id || "Hệ thống",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `logs_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.click();
  };

  const filteredLogs =
    filterDeviceId === "all"
      ? logs
      : logs.filter(
          (log) =>
            log.actuator_id === filterDeviceId ||
            log.device_id === filterDeviceId,
        );

  const getDeviceName = (deviceId?: string) => {
    return devices.find((d) => d.id === deviceId)?.name || "Unknown Device";
  };

  const getDeviceType = (deviceId?: string) => {
    return devices.find((d) => d.id === deviceId)?.type || "unknown";
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 font-bold" style={{ fontSize: "18px" }}>
            📋 Ghi Chép Hoạt Động
          </h2>
          <p className="text-gray-500 mt-1" style={{ fontSize: "13px" }}>
            Xem lịch sử chi tiết các thao tác trên thiết bị
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          style={{ fontSize: "13px", fontWeight: 600 }}
        >
          <Download size={16} /> Xuất CSV
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Device Filter */}
          <div className="flex-1 min-w-[200px]">
            <label
              className="block text-gray-600 mb-1.5"
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              <Filter size={14} className="inline mr-1" /> Thiết bị
            </label>
            <select
              value={filterDeviceId}
              onChange={(e) => setFilterDeviceId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: "13px" }}
            >
              <option value="all">Tất cả thiết bị</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label
              className="block text-gray-600 mb-1.5"
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              <Calendar size={14} className="inline mr-1" /> Từ ngày
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: "13px" }}
            />
          </div>

          {/* Date To */}
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

          {/* Limit */}
          <div>
            <label
              className="block text-gray-600 mb-1.5"
              style={{ fontSize: "12px", fontWeight: 500 }}
            >
              Số bản ghi
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-emerald-400"
              style={{ fontSize: "13px" }}
            >
              <option value="10">10</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="500">500</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleLoadByDevice}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              🔍 Tìm kiếm
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontSize: "13px", fontWeight: 600 }}
            >
              <RotateCcw size={14} className="inline mr-1" /> Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center">
              <Activity size={20} className="text-emerald-700" />
            </div>
            <div>
              <p className="text-emerald-600 text-sm">Tổng hoạt động</p>
              <p className="text-emerald-900 font-bold text-xl">
                {filteredLogs.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="text-blue-600 text-sm">Thành công</p>
              <p className="text-blue-900 font-bold text-xl">
                {
                  filteredLogs.filter(
                    (l) => l.status === "ON" || l.status === "SUCCESS",
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-200 rounded-lg flex items-center justify-center">
              <XCircle size={20} className="text-red-700" />
            </div>
            <div>
              <p className="text-red-600 text-sm">Lỗi/Cảnh báo</p>
              <p className="text-red-900 font-bold text-xl">
                {
                  filteredLogs.filter(
                    (l) => l.status === "ERROR" || l.status === "OFF",
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Không có bản ghi nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th
                    className="px-6 py-3 text-left"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    Thời gian
                  </th>
                  <th
                    className="px-6 py-3 text-left"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    Thiết bị
                  </th>
                  <th
                    className="px-6 py-3 text-left"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    Hành động
                  </th>
                  <th
                    className="px-6 py-3 text-left"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    Trạng thái
                  </th>
                  <th
                    className="px-6 py-3 text-left"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    Người dùng
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => {
                  const deviceType =
                    log.actuators?.type || getDeviceType(log.actuator_id);
                  const deviceName =
                    log.actuators?.name ||
                    getDeviceName(log.actuator_id || log.device_id);
                  const timestamp = log.created_at || log.timestamp;
                  const displayTime = timestamp
                    ? new Date(timestamp).toLocaleString("vi-VN")
                    : "N/A";

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      {/* Time */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            {displayTime}
                          </span>
                        </div>
                      </td>

                      {/* Device */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-lg ${
                              DEVICE_TYPE_COLORS[deviceType as string] ||
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {DEVICE_ICONS[deviceType as string] || (
                              <Zap size={16} />
                            )}
                          </div>
                          <div>
                            <p
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#333",
                              }}
                            >
                              {deviceName}
                            </p>
                            <p style={{ fontSize: "11px", color: "#999" }}>
                              {deviceType}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-3">
                        <p style={{ fontSize: "13px", color: "#666" }}>
                          {log.action}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {log.status === "ON" || log.status === "SUCCESS" ? (
                            <>
                              <CheckCircle2
                                size={16}
                                className="text-emerald-600"
                              />
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#10b981",
                                }}
                              >
                                {log.status}
                              </span>
                            </>
                          ) : log.status === "OFF" ? (
                            <>
                              <XCircle size={16} className="text-gray-400" />
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#999",
                                }}
                              >
                                {log.status}
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle size={16} className="text-red-600" />
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#dc2626",
                                }}
                              >
                                {log.status}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            {log.user_id || "Hệ thống"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
