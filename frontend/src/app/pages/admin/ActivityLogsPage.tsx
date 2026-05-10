/**
 * ActivityLogsPage.tsx
 * Nhật ký hành động — Admin only.
 * Displays paginated audit log from the backend with search and sort.
 */

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Activity,
  AlertCircle,
  Search,
  ArrowUpDown,
} from "lucide-react";

import { ActivityLogTable } from "../../components/admin/ActivityLogTable";
import * as logService from "../../services/logService";
import type { ActivityLog } from "../../types/user.types";

const LIMIT = 20;

export const ActivityLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "actor_email">(
    "created_at",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchLogs = useCallback(
    async (p: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await logService.getLogs(
          p,
          LIMIT,
          searchTerm,
          sortBy,
          sortDirection,
          fromDate || undefined,
          toDate || undefined,
        );
        setLogs(result.data);
        setTotal(result.total);
        setPage(result.page);
      } catch (err: any) {
        setError(err.message ?? "Không thể tải nhật ký. Vui lòng thử lại.");
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, sortBy, sortDirection, fromDate, toDate],
  );

  // Reset to page 1 when search/sort/date changes
  useEffect(() => {
    fetchLogs(1);
  }, [searchTerm, sortBy, sortDirection, fromDate, toDate, fetchLogs]);

  const handlePageChange = (newPage: number) => {
    fetchLogs(newPage);
  };

  const toggleSort = (field: "created_at" | "actor_email") => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
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
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Activity size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-blue-700 text-sm">
          Nhật ký này ghi lại mọi hành động quản trị (tạo, cập nhật, xóa tài
          khoản và khu vực) thực hiện bởi Admin. Dữ liệu chỉ đọc và không thể
          xóa.
        </p>
      </div>

      {/* Search and sort controls */}
      <div className="flex flex-col gap-4 bg-gray-50 rounded-xl border border-gray-100 p-4">
        {/* First row: Search */}
        <div className="flex-1 max-w-sm">
          <label className="block text-gray-600 text-xs font-semibold mb-2">
            Tìm kiếm
          </label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm theo người thực hiện hoặc hành động..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Second row: Date range */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
          <div className="flex-1">
            <label className="block text-gray-600 text-xs font-semibold mb-2">
              Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1">
            <label className="block text-gray-600 text-xs font-semibold mb-2">
              Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>

        {/* Third row: Sort controls */}
        <div className="flex gap-2">
          <button
            onClick={() => toggleSort("created_at")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              sortBy === "created_at"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ArrowUpDown size={14} />
            Thời gian
            {sortBy === "created_at" && (
              <span className="text-xs ml-1">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>

          <button
            onClick={() => toggleSort("actor_email")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              sortBy === "actor_email"
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ArrowUpDown size={14} />
            Người thực hiện
            {sortBy === "actor_email" && (
              <span className="text-xs ml-1">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
        </div>
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
