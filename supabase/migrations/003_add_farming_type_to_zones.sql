-- Migration: 003_add_farming_type_to_zones.sql
-- Adds farming_type column to public.zones for UC01
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE public.zones
  ADD COLUMN IF NOT EXISTS farming_type TEXT;
