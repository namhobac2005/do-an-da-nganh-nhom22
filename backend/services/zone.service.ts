/**
 * zone.service.ts
 * Business logic for Zone management.
 */

import { supabaseAdmin as supabase } from '../lib/supabase.client.ts';

export interface Zone {
  id:         string;
  name:       string;
  location:   string | null;
  status:     'active' | 'inactive' | 'maintenance';
  created_at: string;
}

export interface CreateZoneDto {
  name:     string;
  location?: string;
  status?:  'active' | 'inactive' | 'maintenance';
}

export interface UpdateZoneDto {
  name?:     string;
  location?: string;
  status?:   'active' | 'inactive' | 'maintenance';
}

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
      name:     dto.name,
      location: dto.location ?? null,
      status:   dto.status ?? 'active',
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
