/**
 * zone.service.ts
 * Business logic for hierarchical Zone > Pond management.
 *
 * Database Tables:
 *   - public.zones      → Zone (vùng nuôi) master data
 *   - public.ponds      → Pond (ao nuôi) belongs to a zone via zone_id
 *   - public.user_ponds → M:N user ↔ pond assignment
 *
 * Access Rules:
 *   - Admin: sees ALL zones and ALL ponds
 *   - User:  sees only ponds assigned via user_ponds,
 *            and the parent zones containing those ponds
 */

import { supabaseAdmin as supabase } from '../lib/supabase.client.ts';

// =============================================
// ===== ZONE OPERATIONS =====
// =============================================

/**
 * Lấy danh sách Zone.
 * - Admin: tất cả zones
 * - User:  chỉ zones chứa ít nhất 1 pond được phân quyền
 */
export const listZones = async (userId: string, role?: string) => {
  if (role === 'admin') {
    const { data, error } = await supabase
      .from('zones')
      .select('*, ponds(id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((z: any) => ({
      ...z,
      pond_count: z.ponds?.length ?? 0,
      ponds: undefined, // don't leak the full ponds array
    }));
  }

  // User: zones that contain at least one assigned pond
  // Step 1: get user's assigned pond IDs
  const { data: userPonds, error: upErr } = await supabase
    .from('user_ponds')
    .select('pond_id')
    .eq('user_id', userId);
  if (upErr) throw upErr;
  const pondIds = (userPonds || []).map((r: any) => r.pond_id).filter(Boolean);
  if (pondIds.length === 0) return [];

  // Step 2: get the zone_ids from those ponds
  const { data: ponds, error: pErr } = await supabase
    .from('ponds')
    .select('zone_id')
    .in('id', pondIds);
  if (pErr) throw pErr;
  const zoneIds = [
    ...new Set((ponds || []).map((p: any) => p.zone_id).filter(Boolean)),
  ];
  if (zoneIds.length === 0) return [];

  // Step 3: fetch those zones with pond counts (only assigned ponds count)
  const { data: zones, error: zErr } = await supabase
    .from('zones')
    .select('*')
    .in('id', zoneIds)
    .order('created_at', { ascending: false });
  if (zErr) throw zErr;

  // Count how many assigned ponds per zone
  const pondCountMap: Record<string, number> = {};
  (ponds || []).forEach((p: any) => {
    if (p.zone_id) pondCountMap[p.zone_id] = (pondCountMap[p.zone_id] || 0) + 1;
  });

  return (zones || []).map((z: any) => ({
    ...z,
    pond_count: pondCountMap[z.id] || 0,
  }));
};

/** Lấy chi tiết 1 Zone */
export const getZoneById = async (zoneId: string) => {
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('id', zoneId)
    .single();
  if (error) throw new Error('Không tìm thấy vùng nuôi.');
  return data;
};

/** Tạo Zone (Admin) */
export const createZone = async (dto: {
  name: string;
  location?: string;
  status?: string;
}) => {
  const { data, error } = await supabase
    .from('zones')
    .insert({
      name: dto.name,
      location: dto.location ?? null,
      status: dto.status ?? 'active',
    })
    .select()
    .single();
  if (error) throw new Error(`Tạo vùng nuôi thất bại: ${error.message}`);
  return data;
};

/** Cập nhật Zone (Admin) */
export const updateZoneById = async (
  id: string,
  dto: { name?: string; location?: string; status?: string },
) => {
  const payload: Record<string, any> = {};
  if (dto.name !== undefined) payload.name = dto.name;
  if (dto.location !== undefined) payload.location = dto.location;
  if (dto.status !== undefined) payload.status = dto.status;

  if (Object.keys(payload).length === 0)
    throw new Error('Không có dữ liệu để cập nhật.');

  const { data, error } = await supabase
    .from('zones')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`Cập nhật vùng nuôi thất bại: ${error.message}`);
  return data;
};

/** Xóa Zone (Admin) — cascade sẽ xóa ponds liên quan */
export const deleteZoneById = async (id: string) => {
  const { error } = await supabase.from('zones').delete().eq('id', id);
  if (error) throw new Error(`Xóa vùng nuôi thất bại: ${error.message}`);
};

// =============================================
// ===== POND OPERATIONS =====
// =============================================

/**
 * Lấy danh sách Ponds trong 1 Zone.
 * - Admin: tất cả ponds trong zone
 * - User: chỉ ponds mà user được phân quyền
 */
export const listPondsByZone = async (
  zoneId: string,
  userId: string,
  role?: string,
) => {
  if (role === 'admin') {
    const { data, error } = await supabase
      .from('ponds')
      .select(
        'id, name, zone_id, location, farming_type, status, created_at, sensors(id), actuators(id)',
      )
      .eq('zone_id', zoneId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((p: any) => ({
      ...p,
      sensor_count: p.sensors?.length ?? 0,
      actuator_count: p.actuators?.length ?? 0,
      sensors: undefined,
      actuators: undefined,
    }));
  }

  // User: filter by user_ponds
  const { data: userPonds, error: upErr } = await supabase
    .from('user_ponds')
    .select('pond_id')
    .eq('user_id', userId);
  if (upErr) throw upErr;
  const assignedIds = (userPonds || [])
    .map((r: any) => r.pond_id)
    .filter(Boolean);
  if (assignedIds.length === 0) return [];

  const { data, error } = await supabase
    .from('ponds')
    .select(
      'id, name, zone_id, location, farming_type, status, created_at, sensors(id), actuators(id)',
    )
    .eq('zone_id', zoneId)
    .in('id', assignedIds)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    ...p,
    sensor_count: p.sensors?.length ?? 0,
    actuator_count: p.actuators?.length ?? 0,
    sensors: undefined,
    actuators: undefined,
  }));
};

/**
 * Lấy chi tiết 1 Pond kèm thống kê sensors/actuators.
 */
export const getPondDetail = async (pondId: string) => {
  const { data: pond, error } = await supabase
    .from('ponds')
    .select(
      `
      id, name, zone_id, location, farming_type, status, created_at,
      sensors ( id, name, type, status ),
      actuators ( id, name, type, status )
    `,
    )
    .eq('id', pondId)
    .single();

  if (error || !pond) throw new Error('Không tìm thấy ao nuôi.');

  // Fetch zone name for breadcrumb
  const { data: zone } = await supabase
    .from('zones')
    .select('name')
    .eq('id', pond.zone_id)
    .single();

  // Fetch managers
  const { data: managers } = await supabase
    .from('user_ponds')
    .select('users(username)')
    .eq('pond_id', pondId);

  const stats = {
    totalSensors: pond.sensors?.length ?? 0,
    totalActuators: pond.actuators?.length ?? 0,
    managers: (managers || [])
      .map((m: any) => m.users?.username)
      .filter(Boolean),
  };

  return {
    ...pond,
    zone_name: zone?.name ?? null,
    stats,
  };
};

/** Tạo Pond trong Zone (Admin) */
export const createPond = async (
  zoneId: string,
  dto: {
    name: string;
    location?: string;
    farming_type?: string;
    status?: string;
  },
) => {
  const { data, error } = await supabase
    .from('ponds')
    .insert({
      zone_id: zoneId,
      name: dto.name,
      location: dto.location ?? null,
      farming_type: dto.farming_type ?? null,
      status: dto.status ?? 'active',
    })
    .select()
    .single();
  if (error) throw new Error(`Tạo ao nuôi thất bại: ${error.message}`);
  return data;
};

/** Cập nhật Pond (Admin) */
export const updatePond = async (
  pondId: string,
  dto: {
    name?: string;
    location?: string;
    farming_type?: string;
    status?: string;
  },
) => {
  const payload: Record<string, any> = {};
  if (dto.name !== undefined) payload.name = dto.name;
  if (dto.location !== undefined) payload.location = dto.location;
  if (dto.farming_type !== undefined) payload.farming_type = dto.farming_type;
  if (dto.status !== undefined) payload.status = dto.status;

  if (Object.keys(payload).length === 0)
    throw new Error('Không có dữ liệu để cập nhật.');

  const { data, error } = await supabase
    .from('ponds')
    .update(payload)
    .eq('id', pondId)
    .select()
    .single();
  if (error) throw new Error(`Cập nhật ao nuôi thất bại: ${error.message}`);
  return data;
};

/** Xóa Pond (Admin) */
export const deletePond = async (pondId: string) => {
  const { error } = await supabase.from('ponds').delete().eq('id', pondId);
  if (error) throw new Error(`Xóa ao nuôi thất bại: ${error.message}`);
};

// =============================================
// ===== LEGACY COMPAT — used by other services
// =============================================

/** Alias for backward compatibility with dashboard/sensor/device services */
export const getZonesForUser = listZones;
export const getZoneDetail = getPondDetail;
