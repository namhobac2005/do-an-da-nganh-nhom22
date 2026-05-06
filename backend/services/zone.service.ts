/**
 * zone.service.ts
 * Business logic for Zone management (UC01).
 * All DB operations use supabaseAdmin to bypass RLS.
 */

import { supabaseAdmin as supabase } from '../lib/supabase.client.ts';

// ===== TYPES =====

export interface Zone {
  id:           string;
  name:         string;
  location:     string | null;
  farming_type: string | null;
  status:       'active' | 'inactive' | 'maintenance';
  created_at:   string;
}

export interface CreateZoneDto {
  name:          string;
  location?:     string;
  farming_type?: string;
  status?:       'active' | 'inactive' | 'maintenance';
}

export interface UpdateZoneDto {
  name?:         string;
  location?:     string;
  farming_type?: string;
  status?:       'active' | 'inactive' | 'maintenance';
}

// ===== FUNCTIONS =====

export const listZones = async (): Promise<Zone[]> => {
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .order('name');

  if (error) throw new Error(error.message);
  return data as Zone[];
};

export const getZoneById = async (id: string): Promise<Zone> => {
  const { data, error } = await supabase
    .from('zones')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Zone;
};

export const createZone = async (dto: CreateZoneDto): Promise<Zone> => {
  const { data, error } = await supabase
    .from('zones')
    .insert({
      name:         dto.name,
      location:     dto.location     ?? null,
      farming_type: dto.farming_type ?? null,
      status:       dto.status       ?? 'active',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Zone;
};

export const updateZone = async (id: string, dto: UpdateZoneDto): Promise<Zone> => {
  const { data, error } = await supabase
    .from('zones')
    .update(dto)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Zone;
};

export const deleteZone = async (id: string): Promise<void> => {
  const { error } = await supabase.from('zones').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

/**
 * Returns the distinct list of farming types already stored in zones.
 * Powers the creatable combobox in ZoneFormDialog.
 */
export const listFarmingTypes = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('zones')
    .select('farming_type')
    .not('farming_type', 'is', null);

  if (error) throw new Error(error.message);

  // Deduplicate in-process (Supabase JS doesn't expose DISTINCT directly)
  const unique = [...new Set((data ?? []).map((r: any) => r.farming_type as string))];
  return unique.filter(Boolean).sort();
};
