/**
 * ActivityLogTable.tsx
 * Paginated table displaying the admin activity / audit log.
 */

import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import type { ActivityLog } from '../../types/user.types';

// ===== ACTION LABEL MAP =====

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE_USER:       { label: 'Tạo tài khoản',       color: 'bg-emerald-100 text-emerald-700' },
  UPDATE_USER:       { label: 'Cập nhật tài khoản',   color: 'bg-blue-100 text-blue-700' },
  DELETE_USER:       { label: 'Xóa tài khoản',        color: 'bg-red-100 text-red-700' },
  UPDATE_USER_ZONES: { label: 'Cập nhật khu vực',     color: 'bg-teal-100 text-teal-700' },
  CREATE_ZONE:       { label: 'Tạo khu vực',          color: 'bg-emerald-100 text-emerald-700' },
  UPDATE_ZONE:       { label: 'Cập nhật khu vực',     color: 'bg-blue-100 text-blue-700' },
  DELETE_ZONE:       { label: 'Xóa khu vực',          color: 'bg-red-100 text-red-700' },
};

const getAction = (action: string) =>
  ACTION_LABELS[action] ?? { label: action, color: 'bg-gray-100 text-gray-600' };

// ===== COMPONENT =====

interface ActivityLogTableProps {
  logs:       ActivityLog[];
  total:      number;
  page:       number;
  limit:      number;
  isLoading:  boolean;
  onPageChange: (page: number) => void;
}

export const ActivityLogTable: React.FC<ActivityLogTableProps> = ({
  logs,
  total,
  page,
  limit,
  isLoading,
  onPageChange,
}) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('vi-VN'),
      time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100">
              {['Thời gian', 'Người thực hiện', 'Hành động', 'Đối tượng', 'Chi tiết'].map((col) => (
                <th
                  key={col}
                  className="px-5 py-3.5 text-left text-gray-500 text-xs font-semibold uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400 text-sm">
                  <Activity size={28} className="mx-auto mb-2 text-gray-200" />
                  Chưa có nhật ký hành động nào
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const { label, color } = getAction(log.action);
                const { date, time }   = formatDate(log.created_at);
                return (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Time */}
                    <td className="px-5 py-3.5">
                      <p className="text-gray-700 text-xs font-medium">{date}</p>
                      <p className="text-gray-400 text-xs">{time}</p>
                    </td>

                    {/* Actor */}
                    <td className="px-5 py-3.5">
                      <p className="text-gray-700 text-xs font-medium truncate max-w-[160px]">
                        {log.actor_email ?? '—'}
                      </p>
                    </td>

                    {/* Action badge */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
                        {label}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="px-5 py-3.5">
                      {log.target_type && (
                        <span className="text-gray-500 text-xs">
                          <span className="text-gray-400">{log.target_type}: </span>
                          <span className="font-mono">{log.target_id?.slice(0, 8) ?? '—'}…</span>
                        </span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-5 py-3.5">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <p className="text-gray-400 text-xs font-mono truncate max-w-[200px]">
                          {JSON.stringify(log.details)}
                        </p>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/40">
          <p className="text-gray-400 text-xs">
            Trang {page} / {totalPages} · {total} bản ghi
          </p>
          <div className="flex items-center gap-1.5">
            <button
              id="log-prev-page"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              id="log-next-page"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
