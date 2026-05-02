/**
 * log.service.ts
 * Handles audit logging for admin actions in the activity_logs table.
 */

import { supabaseAdmin as supabase } from '../lib/supabase.client.ts';

export interface ActivityLog {
  id:          string;
  actor_id:    string | null;
  actor_email: string | null;
  action:      string;
  target_type: string | null;
  target_id:   string | null;
  details:     Record<string, unknown>;
  created_at:  string;
}

export interface CreateLogDto {
  actorId:    string;
  actorEmail: string;
  action:     string;
  targetType: string;
  targetId:   string;
  details?:   Record<string, unknown>;
}

/** Insert a new activity log entry */
export const createLog = async (dto: CreateLogDto): Promise<void> => {
  const { error } = await supabase.from('activity_logs').insert({
    actor_id:    dto.actorId,
    actor_email: dto.actorEmail,
    action:      dto.action,
    target_type: dto.targetType,
    target_id:   dto.targetId,
    details:     dto.details ?? {},
  });

  // Non-fatal: log errors to server console but don't break the primary operation
  if (error) {
    console.error('[LogService] Failed to write activity log:', error.message);
  }
};

/** Paginated list of activity logs, newest first */
export const listLogs = async (
  page: number = 1,
  limit: number = 20
): Promise<{ data: ActivityLog[]; total: number }> => {
  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  const { data, error, count } = await supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return { data: data as ActivityLog[], total: count ?? 0 };
};
