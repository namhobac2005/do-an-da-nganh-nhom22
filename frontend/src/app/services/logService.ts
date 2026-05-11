/**
 * logService.ts
 * All API calls for Activity Log reads — uses the central api client.
 */

import { api } from "./api";
import type { ActivityLog, ApiLogsResponse } from "../types/user.types";

export interface LogsResult {
  data: ActivityLog[];
  total: number;
  page: number;
  limit: number;
}

export const getLogs = (
  page = 1,
  limit = 20,
  search?: string,
  sortBy: "created_at" | "actor_email" = "created_at",
  sortDirection: "asc" | "desc" = "desc",
  fromDate?: string,
  toDate?: string,
): Promise<LogsResult> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortDirection,
  });
  if (search) params.append("search", search);
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);

  return api
    .get<ApiLogsResponse>(`/admin/logs?${params.toString()}`)
    .then((r) => ({
      data: r.data,
      total: r.total,
      page: r.page,
      limit: r.limit,
    }));
};
