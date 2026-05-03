-- ============================================================
-- Migration: 001_user_management.sql
-- Purpose  : User Management Module — profiles, zones, user_zones, activity_logs
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. profiles: extends auth.users with role, phone & status
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  phone      TEXT,
  role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. zones: geographic / operational zones
CREATE TABLE IF NOT EXISTS public.zones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  location   TEXT,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. user_zones: many-to-many — users assigned to zones
CREATE TABLE IF NOT EXISTS public.user_zones (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.zones(id)    ON DELETE CASCADE,
  PRIMARY KEY (user_id, zone_id)
);

-- 4. activity_logs: audit trail for admin actions
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID,                  -- admin who performed the action
  actor_email TEXT,                  -- snapshot of actor email at the time
  action      TEXT NOT NULL,         -- e.g. 'CREATE_USER', 'UPDATE_ZONE', 'DELETE_USER'
  target_type TEXT,                  -- e.g. 'user', 'zone'
  target_id   TEXT,
  details     JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row-Level Security (enable, basic policies)
-- ============================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_zones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Service-role key bypasses RLS automatically.
-- For anon/user reads, add policies here as needed.
-- Example: allow all authenticated users to read zones
CREATE POLICY "zones_read_authenticated"
  ON public.zones FOR SELECT
  TO authenticated USING (true);

-- Allow users to read their own profile
CREATE POLICY "profiles_read_own"
  ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- ============================================================
-- Seed zones matching the mock data
-- ============================================================
INSERT INTO public.zones (id, name, location, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Khu A - Tôm Thẻ',  'Phía Bắc, Cà Mau',      'active'),
  ('00000000-0000-0000-0000-000000000002', 'Khu B - Cá Tra',   'Phía Nam, An Giang',    'active'),
  ('00000000-0000-0000-0000-000000000003', 'Khu C - Tôm Sú',   'Trung Tâm, Bạc Liêu',  'maintenance')
ON CONFLICT (id) DO NOTHING;
