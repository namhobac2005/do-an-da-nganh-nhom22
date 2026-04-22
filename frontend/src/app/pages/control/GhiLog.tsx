import { CheckCircle2, XCircle } from "lucide-react";
import type { DeviceLog } from "../../services/deviceService";

interface GhiLogProps {
  commandLogs: DeviceLog[];
}

export const GhiLog: React.FC<GhiLogProps> = ({ commandLogs }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3
        className="text-gray-900 mb-3"
        style={{ fontSize: "14px", fontWeight: 700 }}
      >
        Nhật Ký Gửi Lệnh Adafruit IO
      </h3>
      {commandLogs.length === 0 ? (
        <p className="text-gray-400" style={{ fontSize: "12px" }}>
          Chưa có log điều khiển.
        </p>
      ) : (
        <div className="space-y-2">
          {commandLogs.map((log) => (
            <div
              key={log.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${log.status === "OFF" ? "bg-gray-50" : "bg-emerald-50"}`}
            >
              {log.status !== "FAILED" ? (
                <CheckCircle2 size={15} className="text-emerald-600" />
              ) : (
                <XCircle size={15} className="text-red-600" />
              )}
              <span
                className="text-gray-800 flex-1"
                style={{ fontSize: "13px" }}
              >
                <strong>{log.actuators?.name || log.actuator_id}</strong> →{" "}
                {log.action}
              </span>
              <span className="text-gray-400 text-xs">
                {new Date(log.created_at).toLocaleString("vi-VN")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
