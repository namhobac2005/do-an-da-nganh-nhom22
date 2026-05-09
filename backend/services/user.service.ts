/**
 * user.service.ts
 * Business logic for User (profile) management.
 *
 * All Supabase DB operations use `supabaseAdmin` (service-role key) so they
 * bypass Row Level Security policies on public.user and public.user_ponds.
 *
 * DB Tables:
 *   - public.users     → user accounts
 *   - public.user_ponds → many-to-many user ↔ pond assignment
 *   - public.ponds      → pond master data
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY in backend/.env
 */

import { supabaseAdmin } from '../lib/supabase.client.ts';
import bcrypt from 'bcrypt';

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
  ponds:      { id: string; name: string }[];
}

export interface CreateUserDto {
  email:     string;
  password:  string;
  fullName?: string;
  phone?:    string;
  role?:     'admin' | 'user';
  pondIds?:  string[];
}

export interface UpdateUserDto {
  fullName?: string;
  phone?:    string;
  role?:     'admin' | 'user';
  status?:   'active' | 'inactive';
  pondIds?:  string[];
}

// ===== HELPERS =====

const SALT_ROUNDS = 10;

/**
 * Enriches user rows with their assigned ponds.
 * All queries use supabaseAdmin to bypass RLS.
 */
const enrichWithPonds = async (users: any[]): Promise<UserProfile[]> => {
  if (!users.length) return [];

  const ids = users.map((u) => u.id);

  const { data: userPonds, error: upErr } = await supabaseAdmin
    .from('user_ponds')
    .select('user_id, ponds(id, name)')
    .in('user_id', ids);

  if (upErr) throw new Error(upErr.message);

  // Group ponds by user_id
  const pondsMap = new Map<string, { id: string; name: string }[]>();
  (userPonds ?? []).forEach((up: any) => {
    const pond = up.ponds;
    if (!pond) return;
    const existing = pondsMap.get(up.user_id) ?? [];
    existing.push(pond);
    pondsMap.set(up.user_id, existing);
  });

  return users.map((u) => ({
    ...u,
    email: u.email ?? '',
    ponds: pondsMap.get(u.id) ?? [],
  }));
};

// ===== SERVICE FUNCTIONS =====

export const listUsers = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return enrichWithPonds(data ?? []);
};

export const getUserById = async (id: string): Promise<UserProfile> => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  const [enriched] = await enrichWithPonds([data]);
  return enriched;
};

export const createUser = async (dto: CreateUserDto): Promise<UserProfile> => {
  // STEP 1 — Hash password
  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

  // STEP 2 — Insert user row directly into public.users table
  const { data: newUser, error: userErr } = await supabaseAdmin
    .from('users')
    .insert({
      email:     dto.email,
      password:  hashedPassword,
      full_name: dto.fullName ?? null,
      phone:     dto.phone    ?? null,
      role:      dto.role     ?? 'user',
      status:    'active',
    })
    .select()
    .single();

  if (userErr) {
    throw new Error(`Tạo tài khoản thất bại: ${userErr.message}`);
  }

  const userId = newUser.id;

  // STEP 3 — Assign ponds if provided
  if (dto.pondIds && dto.pondIds.length > 0) {
    await updateUserPonds(userId, dto.pondIds);
  }

  return getUserById(userId);
};

export const updateUser = async (
  id: string,
  dto: UpdateUserDto
): Promise<UserProfile> => {
  const userUpdate: Record<string, any> = {};
  if (dto.fullName !== undefined) userUpdate.full_name = dto.fullName;
  if (dto.phone    !== undefined) userUpdate.phone     = dto.phone;
  if (dto.role     !== undefined) userUpdate.role      = dto.role;
  if (dto.status   !== undefined) userUpdate.status    = dto.status;

  if (Object.keys(userUpdate).length > 0) {
    const { error } = await supabaseAdmin
      .from('users')
      .update(userUpdate)
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  if (dto.pondIds !== undefined) {
    await updateUserPonds(id, dto.pondIds);
  }

  return getUserById(id);
};

export const deleteUser = async (id: string): Promise<void> => {
  // Delete user from public.users — user_ponds cascade via FK
  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
};

export const updateUserPonds = async (
  userId: string,
  pondIds: string[]
): Promise<void> => {
  // Replace all pond assignments atomically
  const { error: deleteErr } = await supabaseAdmin
    .from('user_ponds')
    .delete()
    .eq('user_id', userId);

  if (deleteErr) throw new Error(deleteErr.message);

  if (pondIds.length === 0) return;

  const rows = pondIds.map((pondId) => ({ user_id: userId, pond_id: pondId }));
  const { error: insertErr } = await supabaseAdmin.from('user_ponds').insert(rows);
  if (insertErr) throw new Error(insertErr.message);
};
