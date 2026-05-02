/**
 * ActivityLogsPage.tsx
 * Nhật ký hành động — Admin only.
 * Displays paginated audit log from the backend.
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Activity, AlertCircle } from 'lucide-react';

import { ActivityLogTable } from '../../components/admin/ActivityLogTable';
import * as logService      from '../../services/logService';
import type { ActivityLog } from '../../types/user.types';

const LIMIT = 20;

export const ActivityLogsPage: React.FC = () => {
  const [logs,      setLogs]      = useState<ActivityLog[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetchLogs = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await logService.getLogs(p, LIMIT);
      setLogs(result.data);
      setTotal(result.total);
      setPage(result.page);
    } catch (err: any) {
      setError(err.message ?? 'Không thể tải nhật ký. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage);
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 text-xl font-bold">Nhật ký hành động</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Lịch sử các thao tác quản trị trong hệ thống · {total} bản ghi
          </p>
        </div>
        <button
          id="refresh-logs"
          onClick={() => fetchLogs(page)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Activity size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-blue-700 text-sm">
          Nhật ký này ghi lại mọi hành động quản trị (tạo, cập nhật, xóa tài khoản và khu vực) thực hiện bởi Admin.
          Dữ liệu chỉ đọc và không thể xóa.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => fetchLogs(page)}
            className="ml-auto text-red-600 text-xs font-medium underline hover:no-underline"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Log table */}
      <ActivityLogTable
        logs={logs}
        total={total}
        page={page}
        limit={LIMIT}
        isLoading={isLoading}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
