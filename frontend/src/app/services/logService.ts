/**
 * logService.ts
 * All API calls for Activity Log reads — uses the central api client.
 */

import { api } from './api';
import type { ActivityLog, ApiLogsResponse } from '../types/user.types';

export interface LogsResult {
  data:  ActivityLog[];
  total: number;
  page:  number;
  limit: number;
}

export const getLogs = (page = 1, limit = 20): Promise<LogsResult> =>
  api
    .get<ApiLogsResponse>(`/admin/logs?page=${page}&limit=${limit}`)
    .then((r) => ({ data: r.data, total: r.total, page: r.page, limit: r.limit }));
