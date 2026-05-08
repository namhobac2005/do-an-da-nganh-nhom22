/**
 * DeviceFormDialog.tsx
 * Radix UI Dialog for creating/editing a device (IoT Actuator)
 * Features:
 *  - React-Hook-Form validation with error messages
 *  - Select dropdown for device type (pump, fan, light, servo)
 *  - Dynamic pond selection based on zone
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import type {
  Device,
  CreateDeviceDto,
  UpdateDeviceDto,
} from "../../services/deviceService";
import type { Zone } from "../../types/user.types";
import * as sensorService from "../../services/sensorService";

// ===== TYPES =====

type FormValues = {
  name: string;
  type: "pump" | "fan" | "light" | "servo";
  feed_key: string;
  zone_id: string;
  pond_id: string;
  mode: "auto" | "manual";
  description: string;
};

interface Pond {
  id: string;
  name: string;
}

interface DeviceFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateDeviceDto | UpdateDeviceDto) => Promise<boolean>;
  editDevice?: Device | null;
  zones: Zone[];
}

// ===== CONSTANTS =====

const DEVICE_TYPE_OPTIONS = [
  { value: "pump", label: "Máy Bơm", icon: "💧" },
  { value: "fan", label: "Quạt Sục Khí", icon: "💨" },
  { value: "light", label: "Đèn LED", icon: "💡" },
  { value: "servo", label: "Van/Servo", icon: "🎚️" },
] as const;

const MODE_OPTIONS = [
  { value: "manual", label: "Thủ công" },
  { value: "auto", label: "Tự động" },
] as const;

// ===== MAIN DIALOG =====

export const DeviceFormDialog: React.FC<DeviceFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editDevice,
  zones,
}) => {
  const isEdit = !!editDevice;
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [isLoadingPonds, setIsLoadingPonds] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      type: "pump",
      feed_key: "",
      zone_id: "",
      pond_id: "",
      mode: "manual",
      description: "",
    },
  });

  // Watch zone_id to load ponds
  const watchedZoneId = watch("zone_id");

  // Fetch ponds when zone changes
  useEffect(() => {
    const fetchPonds = async () => {
      if (!watchedZoneId) {
        setPonds([]);
        return;
      }

      setIsLoadingPonds(true);
      try {
        const pondData = await sensorService.getPondsByZone(watchedZoneId);
        setPonds(pondData);
      } catch (err) {
        console.error("Failed to fetch ponds:", err);
        setPonds([]);
      } finally {
        setIsLoadingPonds(false);
      }
    };

    fetchPonds();
  }, [watchedZoneId]);

  // Reset form when dialog opens/closes or editDevice changes
  useEffect(() => {
    reset({
      name: editDevice?.name ?? "",
      type: (editDevice?.type as any) ?? "pump",
      feed_key: editDevice?.feed_key ?? "",
      zone_id: editDevice?.zone_id ?? "",
      pond_id: editDevice?.pond_id ?? "",
      mode: (editDevice?.mode as any) ?? "manual",
      description: editDevice?.description ?? "",
    });
  }, [open, editDevice, reset]);

  const onValid = async (values: FormValues) => {
    const dto = {
      name: values.name.trim(),
      type: values.type,
      feed_key: values.feed_key.trim(),
      pond_id: values.pond_id || undefined,
      mode: values.mode,
      description: values.description.trim() || undefined,
    };
    const ok = await onSubmit(dto);
    if (ok) onClose();
    else {
      // keep dialog open so user can fix errors
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div>
              <Dialog.Title className="text-gray-900 text-base font-semibold">
                {isEdit ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}
              </Dialog.Title>
              <Dialog.Description className="text-gray-400 text-xs mt-0.5">
                {isEdit
                  ? `Cập nhật thông tin cho ${editDevice?.name}`
                  : "Nhập thông tin để tạo thiết bị mới trên Adafruit IO"}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onValid)}
            className="px-6 py-5 space-y-4"
          >
            {/* Name */}
            <div>
              <label
                htmlFor="device-name"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Tên thiết bị <span className="text-red-500">*</span>
              </label>
              <input
                id="device-name"
                type="text"
                placeholder="VD: Máy bơm khu A"
                {...register("name", { required: "Tên thiết bị là bắt buộc." })}
                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-100"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Device Type */}
            <div>
              <label
                htmlFor="device-type"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Loại thiết bị <span className="text-red-500">*</span>
              </label>
              <select
                id="device-type"
                {...register("type", {
                  required: "Loại thiết bị là bắt buộc.",
                })}
                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 transition-all bg-white ${
                  errors.type
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-100"
                }`}
              >
                <option value="">-- Chọn loại thiết bị --</option>
                {DEVICE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.icon} {o.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Feed Key (optional) */}
            <div>
              <label
                htmlFor="device-feed-key"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Adafruit IO Feed Key{" "}
                <span className="text-gray-400 text-xs">(tùy chọn)</span>
              </label>
              <input
                id="device-feed-key"
                type="text"
                placeholder="VD: pump_1 — để trống để tự tạo"
                {...register("feed_key", {
                  pattern: {
                    value: /^[a-z0-9_-]+$/,
                    message:
                      "Feed Key chỉ được chứa chữ thường, số, dấu gạch ngang và gạch dưới",
                  },
                })}
                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 transition-all ${
                  errors.feed_key
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-100"
                }`}
              />
              {errors.feed_key && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.feed_key.message}
                </p>
              )}
              <p className="text-gray-400 text-xs mt-1.5">
                Mã định danh trên Adafruit IO (ví dụ: pump_1). Nếu để trống, hệ
                thống sẽ tạo tự động.
              </p>
            </div>

            {/* Zone */}
            <div>
              <label
                htmlFor="device-zone"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Khu vực <span className="text-red-500">*</span>
              </label>
              <select
                id="device-zone"
                {...register("zone_id", {
                  required: "Vui lòng chọn khu vực",
                })}
                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 transition-all ${
                  errors.zone_id
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-100"
                } bg-white`}
              >
                <option value="">-- Chọn khu vực --</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
              {errors.zone_id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.zone_id.message}
                </p>
              )}
            </div>

            {/* Pond */}
            <div>
              <label
                htmlFor="device-pond"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Ao nuôi{" "}
                {watchedZoneId && <span className="text-red-500">*</span>}
              </label>
              <select
                id="device-pond"
                disabled={!watchedZoneId || isLoadingPonds}
                {...register("pond_id", {
                  required: watchedZoneId ? "Vui lòng chọn ao nuôi" : false,
                })}
                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 transition-all ${
                  errors.pond_id
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-emerald-400 focus:ring-emerald-100"
                } ${!watchedZoneId || isLoadingPonds ? "bg-gray-50" : "bg-white"}`}
              >
                <option value="">
                  {!watchedZoneId
                    ? "-- Chọn khu vực trước --"
                    : isLoadingPonds
                      ? "-- Đang tải --"
                      : "-- Chọn ao nuôi --"}
                </option>
                {!isLoadingPonds &&
                  ponds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
              {errors.pond_id && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.pond_id.message}
                </p>
              )}
            </div>

            {/* Mode */}
            <div>
              <label
                htmlFor="device-mode"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Chế độ hoạt động
              </label>
              <select
                id="device-mode"
                {...register("mode")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
              >
                {MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="device-description"
                className="block text-xs font-medium text-gray-600 mb-1.5"
              >
                Mô tả
              </label>
              <textarea
                id="device-description"
                placeholder="Mô tả chi tiết về thiết bị..."
                {...register("description")}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100 sticky bottom-0 bg-white z-10">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </Dialog.Close>
            <button
              type="submit"
              onClick={handleSubmit(onValid)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Lưu thay đổi" : "Tạo thiết bị"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
