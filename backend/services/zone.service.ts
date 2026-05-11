/**
 * zone.service.ts
 * Business logic for Zone (Pond) management (UC01).
 * All DB operations use supabaseAdmin to bypass RLS.
 *
 * DB Table: public.ponds
 */

import { supabaseAdmin as supabase } from '../lib/supabase.client.ts';

// ===== TYPES =====

export interface Zone {
  id: string;
  name: string;
  location: string | null;
  farming_type: string | null;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
}

export interface CreateZoneDto {
  name: string;
  location?: string;
  farming_type?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

export interface UpdateZoneDto {
  name?: string;
  location?: string;
  farming_type?: string;
  status?: 'active' | 'inactive' | 'maintenance';
}

// ===== FUNCTIONS =====

/**
 * List ponds visible to a specific user (filtered via user_ponds).
 * For admin users, call listAllZones() instead.
 */
export const listZones = async (userId: string): Promise<Zone[]> => {
  const { data, error } = await supabase
    .from('user_ponds')
    .select(`
      ponds (
        id, name, location, farming_type, status, created_at
      )
    `)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  // Map lại dữ liệu vì kết quả trả về là mảng các object chứa object ponds
  return (data?.map((item: any) => item.ponds).filter(Boolean) || []) as Zone[];
};

/**
 * List ALL ponds (admin view — no user filtering).
 */
export const listAllZones = async (): Promise<Zone[]> => {
  const { data, error } = await supabase
    .from('ponds')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Zone[];
};

export const getZoneById = async (id: string): Promise<Zone> => {
  const { data, error } = await supabase
    .from('ponds')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Zone;
};

export const getZoneByIdForUser = async (
  id: string,
  userId: string,
  role?: string,
): Promise<Zone> => {
  if (!userId || role === 'admin') {
    return getZoneById(id);
  }

  const zones = await listZones(userId);
  const zone = zones.find((item) => item.id === id);

  if (!zone) {
    throw new Error('Bạn không có quyền truy cập zone này.');
  }

  return zone;
};

export const createZone = async (dto: CreateZoneDto): Promise<Zone> => {
  const { data, error } = await supabase
    .from('ponds')
    .insert({
      name: dto.name,
      location: dto.location ?? null,
      farming_type: dto.farming_type ?? null,
      status: dto.status ?? 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Zone;
};

export const updateZone = async (
  id: string,
  dto: UpdateZoneDto,
): Promise<Zone> => {
  const updateData: Record<string, any> = {};
  if (dto.name !== undefined) updateData.name = dto.name;
  if (dto.location !== undefined) updateData.location = dto.location;
  if (dto.farming_type !== undefined) updateData.farming_type = dto.farming_type;
  if (dto.status !== undefined) updateData.status = dto.status;

  const { data, error } = await supabase
    .from('ponds')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Zone;
};

export const deleteZone = async (id: string): Promise<void> => {
  // Application-level cascade: clean up related records first
  // (Ignore individual errors — table may be empty or FK may not exist yet)
  await supabase.from('user_ponds').delete().eq('pond_id', id);
  await supabase.from('alert_logs').delete().eq('zone_id', id);
  await supabase.from('thresholds').delete().eq('target_type', 'zone').eq('target_id', id);

  // Now delete the pond itself
  const { error } = await supabase.from('ponds').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

/**
 * Returns distinct farming_type values from the ponds table.
 * Used to populate the Creatable Combobox on the frontend.
 */
export const listFarmingTypes = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('ponds')
    .select('farming_type')
    .not('farming_type', 'is', null);

  if (error) throw new Error(error.message);

  // Extract unique farming types
  const types = new Set<string>();
  (data ?? []).forEach((row: any) => {
    if (row.farming_type) types.add(row.farming_type);
  });

  return Array.from(types).sort();
};
