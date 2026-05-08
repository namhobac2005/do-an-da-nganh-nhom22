-- ============================================================
-- Migration: 007_fix_actuators_remove_zone_id.sql
-- Purpose  : Fix actuators table - remove zone_id, keep only pond_id
--            This migration handles existing actuators table that may have zone_id
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Drop existing constraints and indexes related to zone_id
DROP INDEX IF EXISTS public.idx_actuators_zone_id;

-- Drop old column if it exists (this handles case where migration 005 didn't fully update)
ALTER TABLE IF EXISTS public.actuators DROP COLUMN IF EXISTS zone_id;

-- Ensure pond_id column exists
ALTER TABLE IF EXISTS public.actuators 
  ADD COLUMN IF NOT EXISTS pond_id UUID REFERENCES public.ponds(id) ON DELETE SET NULL;

-- Ensure the correct index exists
CREATE INDEX IF NOT EXISTS idx_actuators_pond_id ON public.actuators(pond_id);

-- Ensure feed_key index exists
CREATE INDEX IF NOT EXISTS idx_actuators_feed_key ON public.actuators(feed_key);

-- Verify table structure is correct
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'actuators' ORDER BY ordinal_position;
