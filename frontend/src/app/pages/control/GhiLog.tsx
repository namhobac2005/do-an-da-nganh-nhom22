import { CheckCircle2 } from "lucide-react";
import type { DeviceLog } from "../../services/deviceService";

interface GhiLogProps {
  commandLogs: DeviceLog[];
}

export const GhiLog: React.FC<GhiLogProps> = ({ commandLogs }) => {
  console.log("[GhiLog] Rendering with logs:", commandLogs);

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
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {commandLogs.map((log) => {
            const isOn = log.status === "ON" || log.action.includes("ON");
            const deviceName =
              log.actuators?.name || log.actuator_id || "Unknown";

            return (
              <div
                key={log.id}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  isOn
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <CheckCircle2
                  size={16}
                  className={`mt-0.5 shrink-0 ${
                    isOn ? "text-emerald-600" : "text-gray-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-gray-800"
                    style={{ fontSize: "13px", fontWeight: 600 }}
                  >
                    {deviceName}
                  </p>
                  <p className="text-gray-600" style={{ fontSize: "12px" }}>
                    {log.action}
                  </p>
                </div>
                <span className="text-gray-400 text-xs shrink-0 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("vi-VN")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
