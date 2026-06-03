/**
 * DevicesPage.tsx
 * Trang Quản Lý Thiết Bị IoT (Adafruit IO)
 * Fully connected to the backend API. No mock data.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Search, RefreshCw, Zap, Thermometer, Cpu } from "lucide-react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { DeviceTable } from "../../components/admin/DeviceTable";
import { DeviceFormDialog } from "../../components/admin/DeviceFormDialog";
import { SensorTable } from "../../components/admin/SensorTable";
import { SensorFormDialog } from "../../components/admin/SensorFormDialog";
import * as deviceService from "../../services/deviceService";
import * as zoneService from "../../services/zoneService";
import * as sensorService from "../../services/sensorService";
import type {
  Device,
  CreateDeviceDto,
  UpdateDeviceDto,
} from "../../services/deviceService";
import type {
  SensorData,
  SensorCreateDto,
  SensorUpdateDto,
} from "../../services/sensorService";
import type { Zone } from "../../types/user.types";

type DeviceTab = "actuators" | "sensors";

export const DevicesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<DeviceTab>("actuators");

  const [devices, setDevices] = useState<Device[]>([]);
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [filterZones, setFilterZones] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [filterPonds, setFilterPonds] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [selectedPondId, setSelectedPondId] = useState<string>("");
  const [loadingPonds, setLoadingPonds] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [editSensor, setEditSensor] = useState<SensorData | null>(null);
  const [isSensorDialogOpen, setIsSensorDialogOpen] = useState(false);

  // ===== FETCH =====
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resDevices, resSensors, resZones] = await Promise.all([
        deviceService.getAllDevices(),
        sensorService.getLatestSensorsByZoneAll(),
        zoneService.getZones(),
      ]);

      console.log("[Debug 1] API Raw Response - Sensors:", resSensors);
      console.log("[Debug 1] API Raw Response - Zones:", resZones);

      // Đảm bảo dữ liệu luôn là mảng (xử lý cả trường hợp API trả về mảng trực tiếp hoặc { data: [...] })
      const devicesData = Array.isArray(resDevices)
        ? resDevices
        : (resDevices as any)?.data || [];
      const sensorsData = Array.isArray(resSensors)
        ? resSensors
        : (resSensors as any)?.data || [];
      const zonesData = Array.isArray(resZones)
        ? resZones
        : (resZones as any)?.data || [];

      // Tối ưu: Lấy dữ liệu ao song song (Parallel)
      const pondMap: Record<string, any> = {};
      await Promise.all(
        zonesData.map(async (z: any) => {
          try {
            const resPonds = await zoneService.getPondsByZone(z.id);
            const ponds = Array.isArray(resPonds)
              ? resPonds
              : (resPonds as any)?.data || [];
            ponds.forEach((p: any) => {
              pondMap[p.id] = { ...p, zone_id: z.id, zone_name: z.name };
            });
          } catch (e) {
            console.error(`[Debug Error] Lỗi tải ao cho vùng ${z.id}:`, e);
          }
        }),
      );

      console.log(
        "[Debug 2] Pond Map built:",
        Object.keys(pondMap).length,
        "ponds",
      );

      // Transform devices to include names for zone and pond when available
      const formattedDevices = (devicesData || []).map((dev: any) => {
        const pond = dev.pond_id ? pondMap[dev.pond_id] : undefined;
        const zoneName =
          pond?.zone_name ||
          (zonesData.find((z: any) => z.id === dev.zone_id)?.name ?? null);
        return {
          id: dev.id,
          name: dev.name,
          type: dev.type as any,
          feed_key: dev.feed_key,
          pond_id: dev.pond_id,
          zone_id: dev.zone_id ?? pond?.zone_id ?? null,
          pond_name: pond?.name ?? null,
          zone_name: zoneName ?? null,
          status: dev.status || "OFF",
          mode: dev.mode || "manual",
          description: dev.description,
          created_at: dev.created_at,
          updated_at: dev.updated_at,
        } as Device;
      });

      // Chuẩn hóa dữ liệu Sensor để tương thích với bộ lọc (pond_id, pond_name, zone_name)
      const formattedSensors = (sensorsData || []).map((sen: any) => {
        const pId = sen.pond_id || sen.pondId; // Hỗ trợ cả snake_case và camelCase
        const pond = pId && pondMap[pId] ? pondMap[pId] : undefined;

        // Ưu tiên zone_id từ API mới (nếu có join), sau đó đến pondMap
        const zId = sen.zone_id || sen.zoneId || pond?.zone_id || "";
        const zoneName =
          pond?.zone_name ||
          (zonesData.find((z: any) => String(z.id) === String(zId))?.name ??
            null);

        return {
          ...sen,
          pond_id: pId ?? null,
          zone_id: zId,
          pond_name: pond?.name || sen.pond_name || null,
          zone_name: zoneName ?? null,
        } as SensorData;
      });

      console.log("[Debug 3] Formatted Sensors:", formattedSensors);

      setDevices(formattedDevices);
      setSensors(formattedSensors);
      setZones(zonesData);
    } catch (err: any) {
      setError(err.message ?? "Không thể tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const zoneId = searchParams.get("zoneId") ?? "";
    const pondId = searchParams.get("pondId") ?? "";
    setSelectedZoneId(zoneId);
    setSelectedPondId(pondId);
  }, []);

  useEffect(() => {
    const fetchFilterZones = async () => {
      const data = await zoneService.getZones();
      setFilterZones(data);
    };
    fetchFilterZones();
  }, []);

  useEffect(() => {
    if (!selectedZoneId) {
      setFilterPonds([]);
      setSelectedPondId("");
      return;
    }

    const fetchFilterPonds = async () => {
      setLoadingPonds(true);
      const data = await zoneService.getPondsByZone(selectedZoneId);
      setFilterPonds(data);
      setLoadingPonds(false);
    };

    fetchFilterPonds();
  }, [selectedZoneId]);

  useEffect(() => {
    if (!selectedZoneId || loadingPonds) return;

    if (
      selectedPondId &&
      !filterPonds.some((pond) => pond.id === selectedPondId)
    ) {
      setSelectedPondId("");
    }
  }, [filterPonds, loadingPonds, selectedPondId, selectedZoneId]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedZoneId) {
      params.set("zoneId", selectedZoneId);
    } else {
      params.delete("zoneId");
    }

    if (selectedPondId) {
      params.set("pondId", selectedPondId);
    } else {
      params.delete("pondId");
    }

    setSearchParams(params);
  }, [selectedZoneId, selectedPondId, setSearchParams]);

  // ===== FILTER =====
  const filterItems = (items: any[]) =>
    items.filter((d) => {
      const normalized = searchQuery.toLowerCase();

      // Nếu selectedZoneId là chuỗi rỗng (Tất cả vùng), không lọc
      if (selectedZoneId && selectedZoneId !== "") {
        // Kiểm tra xem thiết bị/cảm biến có thuộc vùng đang chọn không (trực tiếp hoặc qua ao)
        const isFromZone = String(d.zone_id) === String(selectedZoneId);
        const isFromPondInZone =
          d.pond_id &&
          filterPonds.some((p) => String(p.id) === String(d.pond_id));

        if (!isFromZone && !isFromPondInZone) return false;
      }

      if (
        selectedPondId &&
        selectedPondId !== "" &&
        String(d.pond_id) !== String(selectedPondId)
      ) {
        return false;
      }

      const feedKey = d.feed_key ?? "";
      const name = d.name ?? "";
      const description = d.description ?? "";
      return (
        name.toLowerCase().includes(normalized) ||
        feedKey.toLowerCase().includes(normalized) ||
        description.toLowerCase().includes(normalized)
      );
    });

  const filteredDevices = useMemo(
    () => filterItems(devices),
    [devices, selectedZoneId, selectedPondId, searchQuery, filterPonds],
  );

  const filteredSensors = useMemo(() => {
    const result = filterItems(sensors);
    console.log("[Debug 4] Final Sensors for render:", result);
    return result;
  }, [sensors, selectedZoneId, selectedPondId, searchQuery, filterPonds]);

  // ===== HANDLERS =====
  const handleOpenCreate = () => {
    setEditDevice(null);
    setDialogOpen(true);
  };
  const handleOpenEdit = (d: Device) => {
    setEditDevice(d);
    setDialogOpen(true);
  };
  const handleClose = () => {
    setDialogOpen(false);
    setEditDevice(null);
  };

  const handleOpenSensorCreate = () => {
    setEditSensor(null);
    setIsSensorDialogOpen(true);
  };
  const handleOpenSensorEdit = (s: SensorData) => {
    setEditSensor(s);
    setIsSensorDialogOpen(true);
  };
  const handleCloseSensor = () => {
    setIsSensorDialogOpen(false);
    setEditSensor(null);
  };

  const handleSubmit = async (dto: CreateDeviceDto | UpdateDeviceDto) => {
    try {
      if (editDevice) {
        const result = await deviceService.updateDevice(
          editDevice.id,
          dto as UpdateDeviceDto,
        );
        if (result.success && result.data) {
          setDevices((prev) =>
            prev.map((d) => (d.id === result.data!.id ? result.data! : d)),
          );
          toast.success("Đã cập nhật thiết bị!");
          return true;
        }
        toast.error(result.error || "Cập nhật thiết bị thất bại");
        return false;
      } else {
        const result = await deviceService.createDevice(dto as CreateDeviceDto);
        if (result.success && result.data) {
          setDevices((prev) => [result.data!, ...prev]);
          toast.success("Đã tạo thiết bị!");
          return true;
        }
        toast.error(result.error || "Tạo thiết bị thất bại");
        return false;
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
      return false;
    }
  };

  const handleSensorSubmit = async (dto: SensorCreateDto | SensorUpdateDto) => {
    try {
      const payload = {
        ...dto,
        feed_key: dto.feed_key === "" ? null : dto.feed_key,
      };

      if (editSensor) {
        const result = await sensorService.updateSensor(
          editSensor.id,
          payload as SensorUpdateDto,
        );
        if (result.success) {
          toast.success("Đã cập nhật cảm biến!");
          await fetchData();
          return true;
        }
        return false;
      } else {
        const result = await sensorService.createSensor(
          payload as SensorCreateDto,
        );
        if (result.success) {
          toast.success("Đã tạo cảm biến!");
          await fetchData();
          return true;
        }
        return false;
      }
    } catch (err: any) {
      return false;
    }
  };

  const handleDeviceDelete = async (device: Device) => {
    if (
      !confirm(
        `Bạn có chắc muốn xóa thiết bị "${device.name}"?\nHành động này không thể hoàn tác.`,
      )
    )
      return;
    try {
      const result = await deviceService.deleteDevice(device.id);
      if (result.success) {
        setDevices((prev) => prev.filter((d) => d.id !== device.id));
        toast.success("Đã xóa thiết bị!");
      } else {
        toast.error(result.error || "Xóa thiết bị thất bại");
      }
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    }
  };

  const handleSensorDelete = async (sensor: SensorData) => {
    if (!confirm(`Xóa cảm biến "${sensor.name}"?`)) return;
    try {
      const result = await sensorService.deleteSensor(sensor.id);
      if (result.success) {
        setSensors((prev) => prev.filter((s) => s.id !== sensor.id));
        toast.success("Đã xóa cảm biến!");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <Cpu size={22} className="text-blue-600" />
            Quản lý Thiết bị Hệ thống
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isLoading
              ? "Đang tải..."
              : `${devices.length} điều khiển, ${sensors.length} cảm biến`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedZoneId}
            onChange={(e) => {
              setSelectedZoneId(e.target.value);
              setSelectedPondId("");
            }}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-400 w-44 transition-colors"
          >
            <option value="">Tất cả vùng</option>
            {filterZones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPondId}
            onChange={(e) => setSelectedPondId(e.target.value)}
            disabled={!selectedZoneId || loadingPonds}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-emerald-400 w-44 transition-colors disabled:opacity-60"
          >
            <option value="">Tất cả ao</option>
            {filterPonds.map((pond) => (
              <option key={pond.id} value={pond.id}>
                {pond.name}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              id="device-search"
              type="text"
              placeholder="Tìm thiết bị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg pl-8 pr-4 py-2 text-sm text-gray-700 outline-none focus:border-emerald-400 w-48 transition-colors"
            />
          </div>

          {/* Refresh */}
          <button
            id="refresh-devices"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            title="Tải lại"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          </button>

          {/* Add */}
          {activeTab === "actuators" ? (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Plus size={15} /> Thêm Thiết Bị
            </button>
          ) : (
            <button
              onClick={handleOpenSensorCreate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus size={15} /> Thêm Cảm Biến
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("actuators")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "actuators"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Zap
            size={15}
            className={activeTab === "actuators" ? "text-emerald-500" : ""}
          />
          Thiết bị điều khiển
        </button>
        <button
          onClick={() => setActiveTab("sensors")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "sensors"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Thermometer
            size={15}
            className={activeTab === "sensors" ? "text-blue-500" : ""}
          />
          Thiết bị cảm biến
        </button>
      </div>

      {/* Table grid */}
      {activeTab === "actuators" ? (
        <DeviceTable
          devices={filteredDevices}
          isLoading={isLoading}
          error={error}
          onEdit={handleOpenEdit}
          onDelete={handleDeviceDelete}
          onRetry={fetchData}
        />
      ) : (
        <SensorTable
          sensors={filteredSensors}
          isLoading={isLoading}
          error={error}
          onEdit={handleOpenSensorEdit}
          onDelete={handleSensorDelete}
          onRetry={fetchData}
        />
      )}

      {/* Create / Edit Dialog */}
      <DeviceFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editDevice={editDevice}
        zones={zones}
      />

      <SensorFormDialog
        open={isSensorDialogOpen}
        onClose={handleCloseSensor}
        onSubmit={handleSensorSubmit}
        editSensor={editSensor}
        zones={zones}
        getPondsByZone={sensorService.getPondsByZone}
      />
    </div>
  );
};
