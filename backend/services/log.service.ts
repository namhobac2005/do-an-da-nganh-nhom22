/**
 * log.service.ts
 * Handles audit logging for admin actions in the activity_logs table.
 */

import { supabaseAdmin as supabase } from "../lib/supabase.client.ts";

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface CreateLogDto {
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
}

/** Insert a new activity log entry */
export const createLog = async (dto: CreateLogDto): Promise<void> => {
  const { error } = await supabase.from("activity_logs").insert({
    actor_id: dto.actorId,
    actor_email: dto.actorEmail,
    action: dto.action,
    target_type: dto.targetType,
    target_id: dto.targetId,
    details: dto.details ?? {},
  });

  // Non-fatal: log errors to server console but don't break the primary operation
  if (error) {
    console.error("[LogService] Failed to write activity log:", error.message);
  }
};

/** Paginated list of activity logs with optional search, sort, and date range */
export const listLogs = async (
  page: number = 1,
  limit: number = 20,
  searchTerm?: string,
  sortBy: "created_at" | "actor_email" = "created_at",
  sortDirection: "asc" | "desc" = "desc",
  fromDate?: string,
  toDate?: string,
): Promise<{ data: ActivityLog[]; total: number }> => {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase.from("activity_logs").select("*", { count: "exact" });

  // Apply search filter if provided
  if (searchTerm && searchTerm.trim()) {
    const term = `%${searchTerm.trim()}%`;
    query = query.or(`actor_email.ilike.${term},action.ilike.${term}`);
  }

  // Apply date range filter if provided
  if (fromDate) {
    query = query.gte("created_at", fromDate);
  }
  if (toDate) {
    // Add 1 day to toDate to include all records on that day
    const nextDay = new Date(toDate);
    nextDay.setDate(nextDay.getDate() + 1);
    query = query.lt("created_at", nextDay.toISOString().split("T")[0]);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortDirection === "asc" });

  // Apply pagination
  const { data, error, count } = await query.range(from, to);

  if (error) throw new Error(error.message);

  return { data: data as ActivityLog[], total: count ?? 0 };
};
