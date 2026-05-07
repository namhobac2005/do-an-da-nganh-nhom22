/**
 * ZoneTable.tsx
 * Grid of zone cards. Clicking "Xem chi tiết" navigates to /admin/zones/:id.
 */

import { useNavigate } from 'react-router';
import {
  Pencil,
  Trash2,
  Waves,
  MapPin,
  Fish,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { Zone } from '../../types/user.types';

const STATUS_CONFIG = {
  active: {
    label: 'Hoạt động',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  inactive: {
    label: 'Ngưng HĐ',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
  },
  maintenance: {
    label: 'Bảo trì',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
};

interface ZoneTableProps {
  zones: Zone[];
  isLoading: boolean;
  error: string | null;
  onEdit: (zone: Zone) => void;
  onDelete: (zone: Zone) => void;
  onRetry: () => void;
}

export const ZoneTable: React.FC<ZoneTableProps> = ({
  zones,
  isLoading,
  error,
  onEdit,
  onDelete,
  onRetry,
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse"
          >
            <div className="h-24 bg-gradient-to-r from-teal-100 to-emerald-100" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-8 bg-gray-100 rounded mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
        <AlertCircle size={32} className="text-red-400 mb-3" />
        <p className="text-gray-600 text-sm font-medium mb-1">
          Không thể tải danh sách vùng ao
        </p>
        <p className="text-gray-400 text-xs mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <RefreshCw size={13} />
          Thử lại
        </button>
      </div>
    );
  }

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
        <Waves size={36} className="text-gray-200 mb-3" />
        <p className="text-gray-500 text-sm font-medium">Chưa có vùng ao nào</p>
        <p className="text-gray-400 text-xs mt-1">
          Nhấn "Thêm Vùng Ao" để bắt đầu
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {zones.map((zone) => {
        const cfg = STATUS_CONFIG[zone.status];
        return (
          <div
            key={zone.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
          >
            {/* Card header */}
            <div className="bg-gradient-to-br from-teal-800 to-emerald-700 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Waves size={20} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-bold truncate">
                      {zone.name}
                    </p>
                    {zone.location && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin
                          size={10}
                          className="text-emerald-200 shrink-0"
                        />
                        <p className="text-emerald-200 text-xs truncate">
                          {zone.location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-3 flex-1">
              {/* Farming type tag */}
              {zone.farming_type ? (
                <div className="flex items-center gap-1.5">
                  <Fish size={13} className="text-teal-500 shrink-0" />
                  <span className="text-sm text-teal-700 font-medium">
                    {zone.farming_type}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-300 italic">
                  Chưa có loại nuôi
                </p>
              )}

              {/* Created at */}
              <p className="text-xs text-gray-400">
                Tạo ngày {new Date(zone.created_at).toLocaleDateString('vi-VN')}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-auto">
                {/* View detail — primary CTA */}
                <button
                  id={`view-zone-${zone.id}`}
                  onClick={() => navigate(`/admin/zones/${zone.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs font-semibold hover:bg-teal-100 transition-colors"
                >
                  Xem chi tiết
                  <ArrowRight size={12} />
                </button>

                <button
                  id={`edit-zone-${zone.id}`}
                  onClick={() => onEdit(zone)}
                  className="p-2 rounded-lg text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                  title="Chỉnh sửa"
                >
                  <Pencil size={14} />
                </button>

                <button
                  id={`delete-zone-${zone.id}`}
                  onClick={() => onDelete(zone)}
                  className="p-2 rounded-lg text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                  title="Xóa"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
