import { useCallback, useEffect, useState } from "react";
import { Activity, AlertCircle, RefreshCw } from "lucide-react";

import { GhiLog } from "../control/GhiLog";
import { getDeviceLogs, type DeviceLog } from "../../services/deviceService";

const LIMIT = 40;

const toDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoUtc = (value: string) => new Date(value).toISOString();

export const DeviceLogsPage: React.FC = () => {
  const [commandLogs, setCommandLogs] = useState<DeviceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromTime, setFromTime] = useState(
    toDateTimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)),
  );
  const [toTime, setToTime] = useState(toDateTimeLocal(new Date()));

  const fetchLogs = useCallback(async () => {
    if (fromTime && toTime && new Date(fromTime) > new Date(toTime)) {
      setError("Thời gian bắt đầu phải nhỏ hơn hoặc bằng thời gian kết thúc.");
      setCommandLogs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const logs = await getDeviceLogs(
        LIMIT,
        undefined,
        fromTime ? toIsoUtc(fromTime) : undefined,
        toTime ? toIsoUtc(toTime) : undefined,
      );
      setCommandLogs(logs);
    } catch (err: any) {
      setError(err?.message ?? "Không thể tải nhật ký điều khiển.");
    } finally {
      setIsLoading(false);
    }
  }, [fromTime, toTime]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-gray-900 text-xl font-bold">
            Nhật ký điều khiển
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Ghi lại các lệnh đã gửi đến thiết bị · {commandLogs.length} bản ghi
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Activity size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-blue-700 text-sm">
          Trang này tập trung toàn bộ nhật ký gửi lệnh điều khiển thiết bị để
          không còn hiển thị lẫn trong trang Điều Khiển hay Báo Cáo.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500 font-medium">
              Từ thời gian
            </span>
            <input
              type="datetime-local"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500 font-medium">
              Đến thời gian
            </span>
            <input
              type="datetime-local"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={fetchLogs}
            className="ml-auto text-red-600 text-xs font-medium underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-sm text-gray-400">
          Đang tải nhật ký điều khiển...
        </div>
      )}

      {!isLoading && <GhiLog commandLogs={commandLogs} />}
    </div>
  );
};
