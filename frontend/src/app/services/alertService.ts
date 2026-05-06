/**
 * alertService.ts
 * All API calls for UC15 (Thresholds) & UC16 (Alert Logs).
 */

import { api } from './api';

// ===== TYPES =====

export type TargetType = 'zone' | 'farming_type';
export type Metric     = 'pH' | 'temperature' | 'DO';
export type AlertStatus = 'unread' | 'resolved';

export interface Threshold {
  id:          string;
  target_type: TargetType;
  target_id:   string;
  metric:      Metric;
  min_value:   number;
  max_value:   number;
  created_at:  string;
}

export interface AlertLog {
  id:             string;
  zone_id:        string | null;
  metric:         string;
  recorded_value: number;
  reason:         string;
  status:         AlertStatus;
  created_at:     string;
}

interface UpsertThresholdDto {
  target_type: TargetType;
  target_id:   string;
  metric:      Metric;
  min_value:   number;
  max_value:   number;
}

interface AlertLogsPage {
  data:  AlertLog[];
  total: number;
  page:  number;
  limit: number;
}

// ===== THRESHOLDS =====

export const getThresholds = (): Promise<Threshold[]> =>
  api.get<{ success: boolean; data: Threshold[] }>('/admin/alerts/thresholds')
     .then((r) => r.data);

export const upsertThreshold = (dto: UpsertThresholdDto): Promise<Threshold> =>
  api.post<{ success: boolean; data: Threshold }>('/admin/alerts/thresholds', dto)
     .then((r) => r.data);

export const deleteThreshold = (id: string): Promise<void> =>
  api.delete<{ success: boolean }>(`/admin/alerts/thresholds/${id}`)
     .then(() => undefined);

// ===== ALERT LOGS =====

export const getAlertLogs = (
  params: { status?: AlertStatus; zoneId?: string; page?: number; limit?: number } = {}
): Promise<AlertLogsPage> => {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.zoneId) qs.set('zoneId', params.zoneId);
  if (params.page)   qs.set('page',   String(params.page));
  if (params.limit)  qs.set('limit',  String(params.limit));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return api.get<{ success: boolean } & AlertLogsPage>(`/admin/alerts/logs${query}`)
            .then((r) => ({ data: r.data, total: r.total, page: r.page, limit: r.limit }));
};

export const getUnreadCount = (): Promise<number> =>
  api.get<{ success: boolean; count: number }>('/admin/alerts/unread-count')
     .then((r) => r.count);

export const resolveAlert = (id: string): Promise<AlertLog> =>
  api.patch<{ success: boolean; data: AlertLog }>(`/admin/alerts/logs/${id}/resolve`)
     .then((r) => r.data);
