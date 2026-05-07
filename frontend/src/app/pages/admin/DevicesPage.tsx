/**
 * DevicesPage.tsx
 * Trang Quản Lý Thiết Bị IoT (Adafruit IO)
 * Fully connected to the backend API. No mock data.
 */

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, RefreshCw, Zap } from "lucide-react";

import { DeviceTable } from "../../components/admin/DeviceTable";
import { DeviceFormDialog } from "../../components/admin/DeviceFormDialog";
import * as deviceService from "../../services/deviceService";
import * as zoneService from "../../services/zoneService";
import type {
  Device,
  CreateDeviceDto,
  UpdateDeviceDto,
} from "../../services/deviceService";
import type { Zone } from "../../types/user.types";

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);

  // ===== FETCH =====
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [devicesData, zonesData] = await Promise.all([
        deviceService.getAllDevices(),
        zoneService.getZones(),
      ]);
      // Transform devices to include all required fields
      const formattedDevices = devicesData.map((dev: any) => ({
        id: dev.id,
        name: dev.name,
        type: dev.type as any,
        feed_key: dev.feed_key,
        zone_id: dev.zone_id,
        status: dev.status || "OFF",
        mode: dev.mode || "manual",
        description: dev.description,
        created_at: dev.created_at,
        updated_at: dev.updated_at,
      }));
      setDevices(formattedDevices);
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

  // ===== FILTER =====
  const filtered = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.feed_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          return true;
        }
        alert(result.error || "Cập nhật thiết bị thất bại");
        return false;
      } else {
        const result = await deviceService.createDevice(dto as CreateDeviceDto);
        if (result.success && result.data) {
          setDevices((prev) => [result.data!, ...prev]);
          return true;
        }
        alert(result.error || "Tạo thiết bị thất bại");
        return false;
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
      return false;
    }
  };

  const handleDelete = async (device: Device) => {
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
      }
    } catch (err: any) {
      alert(`Lỗi: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold flex items-center gap-2">
            <Zap size={22} className="text-blue-600" />
            Quản lý thiết bị IoT
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isLoading
              ? "Đang tải..."
              : `${devices.length} thiết bị Adafruit IO`}
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          <button
            id="add-device-btn"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200"
          >
            <Plus size={15} />
            Thêm Thiết Bị
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <Zap size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-blue-700 text-sm">
          Các thiết bị được tạo ở đây sẽ được đồng bộ hóa với Adafruit IO. Đảm
          bảo Feed Key là duy nhất và tương ứng với feed của bạn trên Adafruit
          IO.
        </p>
      </div>

      {/* Device grid */}
      <DeviceTable
        devices={filtered}
        isLoading={isLoading}
        error={error}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onRetry={fetchData}
      />

      {/* Create / Edit Dialog */}
      <DeviceFormDialog
        open={dialogOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        editDevice={editDevice}
        zones={zones}
      />
    </div>
  );
};
