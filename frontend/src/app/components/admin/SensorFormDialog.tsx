/**
 * SensorFormDialog.tsx
 * CRUD form for Sensor metadata
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import type { Zone } from "../../services/sensorService";

type SensorStatus = "normal" | "warning" | "critical";

type FormValues = {
  name: string;
  type: string;
  unit: string;
  status: SensorStatus;
  zone_id: string;
  pond_id: string;
  feed_key: string;
};

const STATUS_OPTIONS: Array<{ value: SensorStatus; label: string }> = [
  { value: "normal", label: "Bình thường" },
  { value: "warning", label: "Cảnh báo" },
  { value: "critical", label: "Nguy hiểm" },
];

// Sync unit theo type
// (FE tự quyết định để backend không bị lỗi validate unit bắt buộc)
const UNIT_BY_TYPE: Record<string, string> = {
  temperature: "°C",
  "water-level": "%",
  water_level: "%",
  brightness: "lux",
  light: "lux",
};

const normalizeType = (t: string) => t.trim().toLowerCase();

const getAutoUnitByType = (type: string) => {
  const key = normalizeType(type);
  return UNIT_BY_TYPE[key];
};

const isUnitAutoByType = (type: string) => !!getAutoUnitByType(type);

const slugifyFeedKey = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

const buildSuggestedFeedKey = (type: string, name: string) => {
  const baseType = slugifyFeedKey(type);
  const baseName = slugifyFeedKey(name);
  return [baseType, baseName].filter(Boolean).join("_");
};

export const SensorFormDialog = (props: {
  open: boolean;
  onClose: () => void;
  onSubmit: (dto: {
    pond_id: string;
    name: string;
    type: string;
    unit: string;
    status: SensorStatus;
    feed_key?: string;
  }) => Promise<boolean>;
  zones: Zone[];
  editSensor?: null | {
    id: string;
    pond_id: string;
    name: string;
    type: string;
    unit: string;
    status: SensorStatus;
    feed_key?: string | null;
  };
  getPondsByZone: (
    zoneId: string,
  ) => Promise<Array<{ id: string; name: string }>>;
}) => {
  const { open, onClose, onSubmit, zones, editSensor, getPondsByZone } = props;

  const [ponds, setPonds] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingPonds, setIsLoadingPonds] = useState(false);

  const feedKeyAutoValueRef = useRef("");
  const feedKeyManuallyEditedRef = useRef(false);

  const isEdit = !!editSensor;

  const safeZones = useMemo(() => (Array.isArray(zones) ? zones : []), [zones]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      type: "temperature",
      unit: "",
      status: "normal",
      zone_id: "",
      pond_id: "",
      feed_key: "",
    },
  });

  const watchedZoneId = watch("zone_id");
  const watchedName = watch("name");
  const watchedType = watch("type");

  // load ponds when zone changes
  useEffect(() => {
    const run = async () => {
      if (!watchedZoneId) {
        setPonds([]);
        setValue("pond_id", "", { shouldDirty: false, shouldValidate: true });
        return;
      }
      setIsLoadingPonds(true);
      try {
        const data = await getPondsByZone(watchedZoneId);
        setPonds(Array.isArray(data) ? data : []);
      } finally {
        setIsLoadingPonds(false);
      }
    };

    if (open) void run();
  }, [watchedZoneId, open, getPondsByZone, setValue]);

  // reset form when dialog opens
  useEffect(() => {
    if (!open) return;

    reset({
      name: editSensor?.name ?? "",
      type: editSensor?.type ?? "temperature",
      unit: editSensor?.unit ?? "",
      status: (editSensor?.status as SensorStatus) ?? "normal",
      zone_id: "",
      pond_id: editSensor?.pond_id ?? "",
      feed_key: editSensor?.feed_key ?? "",
    });

    // sync unit by type on open (especially when editing)
    const autoUnit = getAutoUnitByType(editSensor?.type ?? "temperature");
    if (autoUnit) {
      setValue("unit", autoUnit, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }

    feedKeyAutoValueRef.current = editSensor?.feed_key ?? "";
    feedKeyManuallyEditedRef.current = !!editSensor?.feed_key;
  }, [open, editSensor, reset, setValue]);

  // suggested feed_key
  useEffect(() => {
    if (!open || isEdit) return;

    const suggested = buildSuggestedFeedKey(watchedType, watchedName);
    if (!suggested) return;

    const current = getValues("feed_key").trim();
    const shouldAutoFill =
      !feedKeyManuallyEditedRef.current ||
      !current ||
      current === feedKeyAutoValueRef.current;

    if (!shouldAutoFill || current === suggested) return;

    feedKeyAutoValueRef.current = suggested;
    setValue("feed_key", suggested, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [open, isEdit, watchedName, watchedType, getValues, setValue]);

  const onValid = async (values: FormValues) => {
    const ok = await onSubmit({
      pond_id: values.pond_id,
      name: values.name.trim(),
      type: values.type.trim(),
      unit: values.unit.trim(),
      status: values.status,
      feed_key: values.feed_key.trim() || undefined,
    });
    if (ok) onClose();
    return ok;
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div>
              <Dialog.Title className="text-gray-900 text-base font-semibold">
                {isEdit ? "Chỉnh sửa sensor" : "Thêm sensor mới"}
              </Dialog.Title>
              <Dialog.Description className="text-gray-400 text-xs mt-0.5">
                {isEdit
                  ? "Cập nhật metadata cảm biến"
                  : "Nhập thông tin cảm biến"}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                type="button"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit(onValid)}
            className="px-6 py-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name", { required: "Tên là bắt buộc" })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="VD: Sensor nhiệt độ khu A"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Loại <span className="text-red-500">*</span>
              </label>
              <select
                {...register("type", { required: "Chọn loại" })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                <option value="">Chọn loại</option>
                {/* Must match FE unit auto mapping + backend expectations */}
                <option value="temperature">temperature</option>
                <option value="water-level">water-level</option>
                <option value="brightness">brightness</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.type.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Đơn vị
                <span
                  className={
                    isUnitAutoByType(watchedType)
                      ? "text-gray-400"
                      : "text-red-500"
                  }
                >
                  {!isUnitAutoByType(watchedType) ? " *" : ""}
                </span>
              </label>
              <input
                {...register("unit", {
                  required: isUnitAutoByType(watchedType)
                    ? false
                    : "Unit là bắt buộc",
                })}
                disabled={isUnitAutoByType(watchedType)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                placeholder="VD: °C / % / m"
              />
              {errors.unit && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.unit.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Trạng thái
              </label>
              <select
                {...register("status")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Khu vực{" "}
                <span className={!isEdit ? "text-red-500" : ""}>
                  {!isEdit ? "*" : ""}
                </span>
              </label>
              <select
                {...register("zone_id", {
                  required: !isEdit ? "Chọn khu vực" : false,
                })}
                disabled={isEdit}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white disabled:opacity-60"
              >
                <option value="">
                  {isEdit ? "(Không đổi khi sửa)" : "Chọn zone"}
                </option>
                {safeZones.map((z) => (
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

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Ao <span className="text-red-500">*</span>
              </label>
              <select
                {...register("pond_id", { required: "Chọn ao" })}
                disabled={isEdit ? false : !watchedZoneId || isLoadingPonds}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 bg-white disabled:opacity-60"
              >
                <option value="">
                  {isLoadingPonds ? "Đang tải" : "Chọn ao"}
                </option>
                {ponds.map((p) => (
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

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Feed Key (tùy chọn)
              </label>
              <input
                {...register("feed_key", {
                  onChange: () => {
                    feedKeyManuallyEditedRef.current = true;
                  },
                })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                placeholder="Hệ thống sẽ tự gợi ý nếu để trống"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                >
                  Hủy
                </button>
              </Dialog.Close>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isEdit ? "Lưu thay đổi" : "Tạo sensor"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
