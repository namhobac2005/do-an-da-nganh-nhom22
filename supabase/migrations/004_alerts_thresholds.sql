-- Migration: 004_alerts_thresholds.sql
-- Creates thresholds and alert_logs tables for UC15 & UC16
-- Run in: Supabase Dashboard → SQL Editor

-- ===== 1. thresholds =====
-- Stores min/max limits per metric, scoped to a zone or a farming_type.
CREATE TABLE IF NOT EXISTS public.thresholds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('zone', 'farming_type')),
  target_id   TEXT NOT NULL,          -- UUID for zone, string label for farming_type
  metric      TEXT NOT NULL,          -- 'pH' | 'temperature' | 'DO'
  min_value   FLOAT NOT NULL,
  max_value   FLOAT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate thresholds for the same target+metric combination
  CONSTRAINT thresholds_unique UNIQUE (target_type, target_id, metric)
);

-- ===== 2. alert_logs =====
-- Immutable audit log of sensor readings that crossed a threshold.
CREATE TABLE IF NOT EXISTS public.alert_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id        UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  metric         TEXT NOT NULL,
  recorded_value FLOAT NOT NULL,
  reason         TEXT NOT NULL,       -- e.g. "Vượt ngưỡng trên", "Dưới ngưỡng dưới"
  status         TEXT NOT NULL DEFAULT 'unread'
                   CHECK (status IN ('unread', 'resolved')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast "unread alerts" queries
CREATE INDEX IF NOT EXISTS idx_alert_logs_status     ON public.alert_logs(status);
CREATE INDEX IF NOT EXISTS idx_alert_logs_zone_id    ON public.alert_logs(zone_id);
CREATE INDEX IF NOT EXISTS idx_alert_logs_created_at ON public.alert_logs(created_at DESC);
