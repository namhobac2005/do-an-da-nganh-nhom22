-- Migration: 002_add_email_to_profiles.sql
-- Adds email column to profiles so we never need auth.admin.listUsers()
-- Run in: Supabase Dashboard → SQL Editor

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Back-fill is not possible without admin API, so new rows will carry it from the INSERT.

-- Index for fast lookups by email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
