/**
 * user.service.ts
 * Business logic for User (profile) management.
 *
 * All Supabase DB operations use `supabaseAdmin` (service-role key) so they
 * bypass Row Level Security policies on public.profiles and public.user_zones.
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY in backend/.env
 */

import { supabaseAdmin } from '../lib/supabase.client.ts';

// ===== TYPES =====

export interface UserProfile {
  id:         string;
  email:      string;
  full_name:  string | null;
  phone:      string | null;
  role:       'admin' | 'user';
  status:     'active' | 'inactive';
  created_at: string;
  updated_at: string;
  zones:      { id: string; name: string }[];
}

export interface CreateUserDto {
  email:     string;
  password:  string;
  fullName?: string;
  phone?:    string;
  role?:     'admin' | 'user';
  zoneIds?:  string[];
}

export interface UpdateUserDto {
  fullName?: string;
  phone?:    string;
  role?:     'admin' | 'user';
  status?:   'active' | 'inactive';
  zoneIds?:  string[];
}

// ===== HELPERS =====

/**
 * Enriches profile rows with their assigned zones.
 * All queries use supabaseAdmin to bypass RLS.
 */
const enrichWithZones = async (profiles: any[]): Promise<UserProfile[]> => {
  if (!profiles.length) return [];

  const ids = profiles.map((p) => p.id);

  const { data: userZones, error: uzErr } = await supabaseAdmin
    .from('user_zones')
    .select('user_id, zones(id, name)')
    .in('user_id', ids);

  if (uzErr) throw new Error(uzErr.message);

  // Group zones by user_id
  const zonesMap = new Map<string, { id: string; name: string }[]>();
  (userZones ?? []).forEach((uz: any) => {
    const zone = uz.zones;
    if (!zone) return;
    const existing = zonesMap.get(uz.user_id) ?? [];
    existing.push(zone);
    zonesMap.set(uz.user_id, existing);
  });

  return profiles.map((p) => ({
    ...p,
    email: p.email ?? '',
    zones: zonesMap.get(p.id) ?? [],
  }));
};

// ===== SERVICE FUNCTIONS =====

export const listUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return enrichWithZones(data ?? []);
};

export const getUserById = async (id: string): Promise<UserProfile> => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  const [enriched] = await enrichWithZones([data]);
  return enriched;
};

export const createUser = async (dto: CreateUserDto): Promise<UserProfile> => {
  // STEP 1 — Create auth identity via Admin API (requires service-role key)
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email:         dto.email,
    password:      dto.password,
    email_confirm: true,   // skip confirmation email — account is active immediately
  });

  if (authErr || !authData.user) {
    // Surface common errors clearly (e.g. "User already registered")
    throw new Error(authErr?.message ?? 'Không thể tạo tài khoản xác thực.');
  }

  const userId = authData.user.id;

  // STEP 2 — Insert profile row using Admin client → bypasses RLS
  const { error: profileErr } = await supabaseAdmin.from('profiles').insert({
    id:        userId,
    email:     dto.email,           // cached for fast lookups without hitting auth API
    full_name: dto.fullName ?? null,
    phone:     dto.phone    ?? null,
    role:      dto.role     ?? 'user',
    status:    'active',
  });

  if (profileErr) {
    // Roll back: remove the auth user so we don't orphan it
    await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => null);
    throw new Error(`Tạo hồ sơ người dùng thất bại: ${profileErr.message}`);
  }

  // STEP 3 — Assign zones if provided
  if (dto.zoneIds && dto.zoneIds.length > 0) {
    await updateUserZones(userId, dto.zoneIds);
  }

  return getUserById(userId);
};

export const updateUser = async (
  id: string,
  dto: UpdateUserDto
): Promise<UserProfile> => {
  const profileUpdate: Record<string, any> = {};
  if (dto.fullName !== undefined) profileUpdate.full_name = dto.fullName;
  if (dto.phone    !== undefined) profileUpdate.phone     = dto.phone;
  if (dto.role     !== undefined) profileUpdate.role      = dto.role;
  if (dto.status   !== undefined) profileUpdate.status    = dto.status;

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  if (dto.zoneIds !== undefined) {
    await updateUserZones(id, dto.zoneIds);
  }

  return getUserById(id);
};

export const deleteUser = async (id: string): Promise<void> => {
  // Hard-delete from Supabase Auth — profiles & user_zones cascade via FK
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
};

export const updateUserZones = async (
  userId: string,
  zoneIds: string[]
): Promise<void> => {
  // Replace all zone assignments atomically
  const { error: deleteErr } = await supabaseAdmin
    .from('user_zones')
    .delete()
    .eq('user_id', userId);

  if (deleteErr) throw new Error(deleteErr.message);

  if (zoneIds.length === 0) return;

  const rows = zoneIds.map((zoneId) => ({ user_id: userId, zone_id: zoneId }));
  const { error: insertErr } = await supabaseAdmin.from('user_zones').insert(rows);
  if (insertErr) throw new Error(insertErr.message);
};
