-- =====================================================================
-- DEFINITIVE FK CLEANUP SCRIPT
-- Run in: Supabase Dashboard → SQL Editor
--
-- Purpose: Fix all foreign key relationships for Zone > Pond hierarchy
-- Architecture:
--   users ← user_ponds → ponds → zones
--   (no user_zones table should exist)
-- =====================================================================

-- =====================
-- STEP 1: Drop legacy table user_zones (if it exists)
-- This table causes PostgREST ambiguity errors.
-- =====================
DROP TABLE IF EXISTS public.user_zones CASCADE;

-- =====================
-- STEP 2: Fix user_ponds foreign keys
-- Drop ALL existing FKs first, then re-add correct ones.
-- =====================

-- 2a. Create user_ponds if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_ponds (
  user_id UUID NOT NULL,
  pond_id UUID NOT NULL,
  PRIMARY KEY (user_id, pond_id)
);

-- 2b. Drop ALL existing foreign keys on user_ponds
-- (We don't know the exact constraint names, so we use a safe DO block)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.user_ponds'::regclass
      AND contype = 'f'  -- foreign key constraints only
  LOOP
    EXECUTE 'ALTER TABLE public.user_ponds DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    RAISE NOTICE 'Dropped FK: %', r.conname;
  END LOOP;
END
$$;

-- 2c. Re-add correct foreign keys
ALTER TABLE public.user_ponds
  ADD CONSTRAINT user_ponds_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_ponds
  ADD CONSTRAINT user_ponds_pond_id_fkey
  FOREIGN KEY (pond_id) REFERENCES public.ponds(id) ON DELETE CASCADE;

-- 2d. Ensure composite primary key exists
-- (skip if it already exists from CREATE TABLE above)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.user_ponds'::regclass
      AND contype = 'p'  -- primary key
  ) THEN
    ALTER TABLE public.user_ponds ADD PRIMARY KEY (user_id, pond_id);
  END IF;
END
$$;

-- 2e. Add indexes for query performance
CREATE INDEX IF NOT EXISTS idx_user_ponds_user_id ON public.user_ponds(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ponds_pond_id ON public.user_ponds(pond_id);

-- =====================
-- STEP 3: Fix ponds.zone_id foreign key
-- =====================

-- 3a. Drop existing FK on ponds.zone_id (safe loop)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.ponds'::regclass
      AND contype = 'f'
      AND conname LIKE '%zone%'  -- only zone-related FKs
  LOOP
    EXECUTE 'ALTER TABLE public.ponds DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    RAISE NOTICE 'Dropped FK on ponds: %', r.conname;
  END LOOP;
END
$$;

-- 3b. Re-add correct foreign key: ponds.zone_id → zones.id
ALTER TABLE public.ponds
  ADD CONSTRAINT ponds_zone_id_fkey
  FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE CASCADE;

-- 3c. Index for ponds.zone_id
CREATE INDEX IF NOT EXISTS idx_ponds_zone_id ON public.ponds(zone_id);

-- =====================
-- STEP 4: Verify the setup
-- =====================

-- 4a. Show all foreign keys in user_ponds
SELECT conname AS constraint_name, 
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.user_ponds'::regclass
  AND contype = 'f';

-- 4b. Show all foreign keys in ponds
SELECT conname AS constraint_name, 
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.ponds'::regclass
  AND contype = 'f';

-- 4c. Confirm user_zones is gone
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'user_zones'
) AS user_zones_still_exists;

-- =====================
-- STEP 5: Force PostgREST schema cache reload
-- =====================
NOTIFY pgrst, 'reload schema';
