-- ============================================================
-- Migration: 008_create_user_ponds.sql
-- Purpose  : Junction table mapping users to ponds (replaces user_zones concept)
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_ponds (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pond_id UUID NOT NULL REFERENCES public.ponds(id)  ON DELETE CASCADE,
  PRIMARY KEY (user_id, pond_id)
);

-- Enable RLS (service-role key bypasses automatically)
ALTER TABLE public.user_ponds ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_ponds_user_id ON public.user_ponds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ponds_pond_id ON public.user_ponds(pond_id);
