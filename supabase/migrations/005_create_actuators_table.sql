-- ============================================================
-- Migration: 005_create_actuators_table.sql
-- Purpose  : Create actuators (devices) table for IoT device management
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Create actuators table for storing IoT devices
CREATE TABLE IF NOT EXISTS public.actuators (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('pump', 'fan', 'light', 'servo')),
  feed_key     TEXT NOT NULL UNIQUE,
  zone_id      UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'OFF' CHECK (status IN ('OFF', 'ON', '0', '1', '2', '3', '4')),
  mode         TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('auto', 'manual')),
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for zone_id for faster queries
CREATE INDEX IF NOT EXISTS idx_actuators_zone_id ON public.actuators(zone_id);

-- Create index for feed_key for uniqueness and faster lookup
CREATE INDEX IF NOT EXISTS idx_actuators_feed_key ON public.actuators(feed_key);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_actuators_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER IF NOT EXISTS trg_actuators_updated_at
  BEFORE UPDATE ON public.actuators
  FOR EACH ROW EXECUTE FUNCTION public.update_actuators_timestamp();

-- Create actuator_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.actuator_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actuator_id  UUID NOT NULL REFERENCES public.actuators(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,
  mode         TEXT,
  status       TEXT,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for actuator_id for faster queries
CREATE INDEX IF NOT EXISTS idx_actuator_logs_actuator_id ON public.actuator_logs(actuator_id);
CREATE INDEX IF NOT EXISTS idx_actuator_logs_timestamp ON public.actuator_logs(timestamp DESC);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE public.actuators      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuator_logs  ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read actuators
CREATE POLICY "actuators_read_authenticated"
  ON public.actuators FOR SELECT
  TO authenticated USING (true);

-- Allow authenticated users to read actuator logs
CREATE POLICY "actuator_logs_read_authenticated"
  ON public.actuator_logs FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- Seed some sample actuators
-- ============================================================

INSERT INTO public.actuators (name, type, feed_key, zone_id, status, mode, description) VALUES
  ('Máy Bơm 1', 'pump', 'pump_1', '00000000-0000-0000-0000-000000000001', 'OFF', 'manual', 'Máy bơm nước chính Khu A'),
  ('Quạt Sục Khí 1', 'fan', 'fan_1', '00000000-0000-0000-0000-000000000001', 'OFF', 'manual', 'Quạt sục khí Khu A'),
  ('Đèn LED 1', 'light', 'light_1', '00000000-0000-0000-0000-000000000002', 'OFF', 'manual', 'Đèn LED Khu B - 4 mức'),
  ('Servo Van 1', 'servo', 'servo_1', '00000000-0000-0000-0000-000000000002', 'OFF', 'manual', 'Van điều chỉnh Khu B')
ON CONFLICT (feed_key) DO NOTHING;
