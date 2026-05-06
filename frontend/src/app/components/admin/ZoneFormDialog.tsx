/**
 * ZoneFormDialog.tsx
 * Radix UI Dialog for creating/editing a zone (UC01).
 * Features:
 *  - React-Hook-Form validation with red error messages
 *  - Creatable combobox for farming_type (select existing OR type new)
 */

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, ChevronDown, Check } from 'lucide-react';
import type { Zone, CreateZoneDto, UpdateZoneDto } from '../../types/user.types';

// ===== TYPES =====

type FormValues = {
  name:         string;
  location:     string;
  farming_type: string;
  status:       'active' | 'inactive' | 'maintenance';
};

interface ZoneFormDialogProps {
  open:          boolean;
  onClose:       () => void;
  onSubmit:      (dto: CreateZoneDto | UpdateZoneDto) => Promise<void>;
  editZone?:     Zone | null;
  farmingTypes:  string[];        // existing types from the API
}

// ===== CREATABLE COMBOBOX =====

interface CreatableComboboxProps {
  value:       string;
  onChange:    (v: string) => void;
  options:     string[];
  placeholder: string;
  id:          string;
}

const CreatableCombobox: React.FC<CreatableComboboxProps> = ({
  value, onChange, options, placeholder, id,
}) => {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Sync search field when parent resets
  useEffect(() => { setSearch(value); }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );
  const canCreate = search.trim() && !options.some(
    (o) => o.toLowerCase() === search.trim().toLowerCase()
  );

  const select = (v: string) => {
    onChange(v);
    setSearch(v);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          value={search}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {open && (filtered.length > 0 || canCreate) && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map((o) => (
            <li
              key={o}
              onMouseDown={() => select(o)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 cursor-pointer"
            >
              {o === value && <Check size={13} className="text-emerald-600 shrink-0" />}
              <span className={o === value ? 'font-medium' : ''}>{o}</span>
            </li>
          ))}
          {canCreate && (
            <li
              onMouseDown={() => select(search.trim())}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-emerald-700 bg-emerald-50/60 hover:bg-emerald-50 cursor-pointer border-t border-gray-100"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Tạo mới:</span>
              <span className="font-medium">"{search.trim()}"</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

// ===== MAIN DIALOG =====

const STATUS_OPTIONS = [
  { value: 'active',      label: 'Hoạt động' },
  { value: 'inactive',    label: 'Ngưng hoạt động' },
  { value: 'maintenance', label: 'Đang bảo trì' },
] as const;

export const ZoneFormDialog: React.FC<ZoneFormDialogProps> = ({
  open, onClose, onSubmit, editZone, farmingTypes,
}) => {
  const isEdit = !!editZone;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name:         '',
      location:     '',
      farming_type: '',
      status:       'active',
    },
  });

  // Reset form when dialog opens/closes or editZone changes
  useEffect(() => {
    reset({
      name:         editZone?.name         ?? '',
      location:     editZone?.location     ?? '',
      farming_type: editZone?.farming_type ?? '',
      status:       editZone?.status       ?? 'active',
    });
  }, [open, editZone, reset]);

  const farmingTypeValue = watch('farming_type');

  const onValid = async (values: FormValues) => {
    const dto = {
      name:         values.name.trim(),
      location:     values.location.trim()     || undefined,
      farming_type: values.farming_type.trim() || undefined,
      status:       values.status,
    };
    await onSubmit(dto);
    onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
            <div>
              <Dialog.Title className="text-gray-900 text-base font-semibold">
                {isEdit ? 'Chỉnh sửa vùng ao' : 'Thêm vùng ao mới'}
              </Dialog.Title>
              <Dialog.Description className="text-gray-400 text-xs mt-0.5">
                {isEdit ? `Cập nhật thông tin cho ${editZone?.name}` : 'Nhập thông tin để tạo vùng ao mới'}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                id="close-zone-dialog"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onValid)} className="px-6 py-5 space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="zone-name" className="block text-xs font-medium text-gray-600 mb-1.5">
                Tên vùng ao <span className="text-red-500">*</span>
              </label>
              <input
                id="zone-name"
                type="text"
                placeholder="VD: Khu A - Tôm Thẻ"
                {...register('name', { required: 'Tên vùng ao là bắt buộc.' })}
                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 focus:border-emerald-400 focus:ring-emerald-100'
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="zone-location" className="block text-xs font-medium text-gray-600 mb-1.5">
                Địa điểm
              </label>
              <input
                id="zone-location"
                type="text"
                placeholder="VD: Phía Bắc, Cà Mau"
                {...register('location')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>

            {/* Farming type — creatable combobox */}
            <div>
              <label htmlFor="zone-farming-type" className="block text-xs font-medium text-gray-600 mb-1.5">
                Loại nuôi
                <span className="ml-1.5 text-gray-400 font-normal">(chọn hoặc nhập mới)</span>
              </label>
              <CreatableCombobox
                id="zone-farming-type"
                value={farmingTypeValue}
                onChange={(v) => setValue('farming_type', v, { shouldDirty: true })}
                options={farmingTypes}
                placeholder="VD: Tôm thẻ chân trắng"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="zone-status" className="block text-xs font-medium text-gray-600 mb-1.5">
                Trạng thái
              </label>
              <select
                id="zone-status"
                {...register('status')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all bg-white"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </Dialog.Close>
            <button
              id="submit-zone-form"
              type="submit"
              form=""
              onClick={handleSubmit(onValid)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo vùng ao'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
