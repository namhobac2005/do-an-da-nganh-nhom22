import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  RefreshCw,
  Fish,
  Thermometer,
  Search,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

import * as sensorService from "../../services/sensorService";
import type {
  Pond,
  SensorData,
  Zone,
  SensorCreateDto,
  SensorUpdateDto,
  SensorStatus,
} from "../../services/sensorService";
import { SensorTable } from "../../components/admin/SensorTable";
import { SensorFormDialog } from "../../components/admin/SensorFormDialog";

// (formatStatus used only for the legacy card UI)
const formatStatus = (s: SensorData["status"]) => {
  switch (s) {
    case "normal":
      return {
        label: "Bình thường",
        dot: "bg-emerald-500",
        cls: "bg-emerald-50 text-emerald-800",
      };
    case "warning":
      return {
        label: "Cảnh báo",
        dot: "bg-amber-500",
        cls: "bg-amber-50 text-amber-900",
      };
    case "critical":
      return {
        label: "Nguy hiểm",
        dot: "bg-red-500",
        cls: "bg-red-50 text-red-800",
      };
    default:
      return {
        label: String(s),
        dot: "bg-gray-400",
        cls: "bg-gray-50 text-gray-800",
      };
  }
};

// ===== CRUD state =====
export const SensorsPage: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);

  // toàn hệ thống: không cần chọn zone/pond để hiển thị
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSensor, setEditSensor] = useState<SensorData | null>(null);
  const [crudLoading, setCrudLoading] = useState(false);

  const [latestSensors, setLatestSensors] = useState<SensorData[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filteredSensors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return latestSensors;
    return latestSensors.filter((s) => {
      return (
        (s.name ?? "").toLowerCase().includes(q) ||
        (s.type ?? "").toLowerCase().includes(q)
      );
    });
  }, [latestSensors, query]);

  const fetchZones = async () => {
    setLoadingZones(true);
    setError(null);
    try {
      const data = await sensorService.getZones();
      setZones(data);
    } catch (e: any) {
      setError(e?.message ?? "Không thể tải zones");
    } finally {
      setLoadingZones(false);
    }
  };

  const fetchPonds = async (_zoneId: string) => {
    // Page list không dùng filter pond; dialog CRUD vẫn dùng getPondsByZone trực tiếp.
  };

  const fetchLatestAll = async () => {
    setLoadingLatest(true);
    try {
      const data = await sensorService.getLatestSensorsByZoneAll();
      const sensorsArray = Array.isArray(data)
        ? data
        : (data as any)?.data || [];
      setLatestSensors(sensorsArray);
    } catch (e: any) {
      toast.error(e?.message ?? "Không thể tải latest sensors");
      setLatestSensors([]);
    } finally {
      setLoadingLatest(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Toàn hệ thống: load tất cả latest sensors khi vào trang
  useEffect(() => {
    void fetchLatestAll();
  }, []);

  // Không reset/ghi đè latest khi selectedPondId rỗng (toàn hệ thống)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <Thermometer size={22} className="text-blue-600" />
            Quản lý Thiết bị Cảm biến
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {loadingZones ? "Đang tải..." : `${filteredSensors.length} sensor`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="sensor-search"
              type="text"
              placeholder="Tìm sensor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-sm text-gray-700 outline-none focus:border-emerald-400 w-52 transition-colors"
            />
          </div>

          <button
            onClick={() => {
              void fetchLatestAll();
            }}
            disabled={loadingLatest || loadingZones}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            title="Tải lại"
          >
            <RefreshCw
              size={15}
              className={loadingLatest || loadingZones ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <Thermometer size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-blue-700 text-sm">
          Trang này hiển thị dữ liệu cảm biến “latest” của tất cả sensor (theo
          quyền của user).
        </p>
      </div>

      {error && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-sm text-red-700">
          {error}
        </div>
      )}

      {(loadingLatest || loadingZones) && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
            >
              <div className="h-28 bg-gradient-to-r from-teal-100 to-emerald-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingLatest && !loadingZones && (
        <>
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setEditSensor(null);
                setDialogOpen(true);
              }}
              disabled={crudLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200"
            >
              <Plus size={15} />
              Thêm Sensor
            </button>
          </div>

          <SensorTable
            sensors={filteredSensors}
            isLoading={false}
            error={error}
            onEdit={(sensor) => {
              setEditSensor(sensor as any);
              setDialogOpen(true);
            }}
            onDelete={(sensor) => {
              if (!confirm(`Bạn có chắc muốn xóa sensor "${sensor.name}"?`))
                return;

              (async () => {
                setCrudLoading(true);
                try {
                  const result = await sensorService.deleteSensor(sensor.id);
                  if (!result.success) {
                    toast.error(result.error || "Xóa sensor thất bại");
                    return;
                  }

                  toast.success("Đã xóa sensor!");
                  await fetchLatestAll();
                } catch (e: any) {
                  toast.error(e?.message || "Xóa sensor thất bại");
                } finally {
                  setCrudLoading(false);
                }
              })();
            }}
            onRetry={() => {
              void fetchLatestAll();
            }}
          />

          <SensorFormDialog
            open={dialogOpen}
            onClose={() => {
              setDialogOpen(false);
              setEditSensor(null);
            }}
            zones={zones}
            editSensor={editSensor}
            getPondsByZone={sensorService.getPondsByZone}
            onSubmit={async (dto) => {
              try {
                setCrudLoading(true);
                let result: { success: boolean; error?: string } = {
                  success: false,
                };

                // Ensure feed_key is null if empty string
                const payload = {
                  ...dto,
                  feed_key: dto.feed_key === "" ? null : dto.feed_key,
                };

                if (editSensor) {
                  // Update existing sensor
                  result = await sensorService.updateSensor(
                    editSensor.id,
                    payload as SensorUpdateDto,
                  );
                  if (!result.success) {
                    toast.error(result.error || "Cập nhật sensor thất bại");
                    return false;
                  }
                  toast.success("Đã cập nhật sensor!");
                } else {
                  result = await sensorService.createSensor(
                    payload as SensorCreateDto,
                  ); // Create new sensor
                  if (!result.success) {
                    toast.error(result.error || "Tạo sensor thất bại");
                    return false;
                  }
                  toast.success("Đã tạo sensor!");
                }

                await fetchLatestAll();
                return true;
              } catch (e: any) {
                toast.error(e?.message || "Thao tác thất bại");
                return false;
              } finally {
                setCrudLoading(false);
              }
            }}
          />
        </>
      )}

      {!loadingLatest && !loadingZones && latestSensors.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-3">
            <Fish size={26} className="text-emerald-600" />
          </div>
          <p className="text-gray-600 text-sm font-medium">Chưa có sensor</p>
          <p className="text-gray-400 text-xs mt-1">
            Nhấn “Thêm Sensor” để tạo sensor mới.
          </p>
        </div>
      )}

      {/* Placeholder for future history/chart */}
    </div>
  );
};
