-- =============================================
-- MIGRATION: Zone > Pond Hierarchy
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Tạo bảng zones
CREATE TABLE IF NOT EXISTS public.zones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  location    TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Thêm cột zone_id vào ponds (nếu chưa có)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ponds' AND column_name = 'zone_id'
  ) THEN
    ALTER TABLE public.ponds ADD COLUMN zone_id UUID REFERENCES public.zones(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- 3. Tạo zone mặc định và gán tất cả ponds chưa có zone
DO $$
DECLARE
  default_zone_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.ponds WHERE zone_id IS NULL) THEN
    INSERT INTO public.zones (name, location, status)
    VALUES ('Khu vực chính', 'Mặc định', 'active')
    RETURNING id INTO default_zone_id;

    UPDATE public.ponds SET zone_id = default_zone_id WHERE zone_id IS NULL;

    RAISE NOTICE 'Đã gán tất cả ponds vào zone: %', default_zone_id;
  END IF;
END
$$;

-- 4. Index cho performance
CREATE INDEX IF NOT EXISTS idx_ponds_zone_id ON public.ponds(zone_id);

-- 5. Kiểm tra kết quả
SELECT z.id, z.name, z.location, z.status, COUNT(p.id) AS pond_count
FROM public.zones z
LEFT JOIN public.ponds p ON p.zone_id = z.id
GROUP BY z.id, z.name, z.location, z.status;
