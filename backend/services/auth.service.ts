/**
 * auth.service.ts
 * Handles authentication: sign-in via Supabase, profile fetch, JWT signing.
 */

import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase.client.ts';

export interface LoginResult {
  token: string;
  user: {
    id:       string;
    email:    string;
    role:     'admin' | 'user';
    fullName: string | null;
    phone:    string | null;
    status:   string;
  };
}

/**
 * Authenticates a user via Supabase Auth and returns a signed JWT
 * containing { id, email, role } for use by backend middleware.
 */
export const login = async (email: string, password: string): Promise<LoginResult> => {
  // 1. Authenticate against Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    throw new Error('Email hoặc mật khẩu không đúng.');
  }

  const authUser = authData.user;

  // 2. Fetch profile (role, status, etc.)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile) {
    throw new Error('Không tìm thấy thông tin tài khoản. Vui lòng liên hệ Admin.');
  }

  if (profile.status === 'inactive') {
    throw new Error('Tài khoản đã bị khóa. Vui lòng liên hệ Admin.');
  }

  // 3. Sign JWT
  const payload = {
    id:    authUser.id,
    email: authUser.email as string,
    role:  profile.role as 'admin' | 'user',
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '8h' });

  return {
    token,
    user: {
      id:       authUser.id,
      email:    authUser.email as string,
      role:     profile.role,
      fullName: profile.full_name,
      phone:    profile.phone,
      status:   profile.status,
    },
  };
};
