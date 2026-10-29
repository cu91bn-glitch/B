/*
# جداول مرجعية لزاد الموجه + مكتبة الأدلة

1. جداول جديدة
- `zad_indicators`: 13 مؤشرًا من zad_data.json مع domain/standard
- `zad_programs`: برامج التوجيه من zad_data.programs
- `zad_program_indicator`: مصفوفة الربط بين البرامج والمؤشرات
- `zad_occasions`: تقويم المناسبات
- `zad_registers`: تعريفات سجلات زاد الموجه وحقولها
- `zad_resources`: الموارد من resources.json (28 مورّدًا) مع slug للروابط القصيرة
- `zad_pyramid`: مثلث/هرم التميز السلوكي (طبقات + معايير)

2. الأمان
- جميع الجداول RLS مفعّل
- صلاحيات SELECT فقط لـ anon + authenticated (قراءة عامة للمراجع)
- لا INSERT/UPDATE/DELETE من الواجهة العامة (البيانات تُحمّل عبر البذور فقط)

3. ملاحظات
- البذور تُحمّل في migration منفصلة بعد إنشاء الجداول
- slug لكل مورد يُولّد من id تلقائيًا
- qr_url في resources.json مرجعي فقط؛ الباركود الفعلي يُولَّد محليًا
*/

-- ===== zad_indicators =====
CREATE TABLE IF NOT EXISTS zad_indicators (
  code text PRIMARY KEY,
  text text NOT NULL,
  domain text NOT NULL,
  standard text NOT NULL
);
ALTER TABLE zad_indicators ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON zad_indicators TO anon, authenticated;
DROP POLICY IF EXISTS "zad_indicators_select_public" ON zad_indicators;
CREATE POLICY "zad_indicators_select_public" ON zad_indicators FOR SELECT TO anon, authenticated USING (true);

-- ===== zad_programs =====
CREATE TABLE IF NOT EXISTS zad_programs (
  id text PRIMARY KEY,
  name text NOT NULL
);
ALTER TABLE zad_programs ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON zad_programs TO anon, authenticated;
DROP POLICY IF EXISTS "zad_programs_select_public" ON zad_programs;
CREATE POLICY "zad_programs_select_public" ON zad_programs FOR SELECT TO anon, authenticated USING (true);

-- ===== zad_program_indicator =====
CREATE TABLE IF NOT EXISTS zad_program_indicator (
  program_id text NOT NULL REFERENCES zad_programs(id) ON DELETE CASCADE,
  indicator_code text NOT NULL REFERENCES zad_indicators(code) ON DELETE CASCADE,
  PRIMARY KEY (program_id, indicator_code)
);
ALTER TABLE zad_program_indicator ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON zad_program_indicator TO anon, authenticated;
DROP POLICY IF EXISTS "zad_program_indicator_select_public" ON zad_program_indicator;
CREATE POLICY "zad_program_indicator_select_public" ON zad_program_indicator FOR SELECT TO anon, authenticated USING (true);

-- ===== zad_occasions =====
CREATE TABLE IF NOT EXISTS zad_occasions (
  id serial PRIMARY KEY,
  name text NOT NULL,
  hijri text,
  gregorian text,
  goal text,
  programs text[] DEFAULT ARRAY[]::text[]
);
ALTER TABLE zad_occasions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON zad_occasions TO anon, authenticated;
DROP POLICY IF EXISTS "zad_occasions_select_public" ON zad_occasions;
CREATE POLICY "zad_occasions_select_public" ON zad_occasions FOR SELECT TO anon, authenticated USING (true);

-- ===== zad_registers =====
CREATE TABLE IF NOT EXISTS zad_registers (
  id text PRIMARY KEY,
  name text NOT NULL,
  fields text[] DEFAULT ARRAY[]::text[],
  source text,
  types text[] DEFAULT ARRAY[]::text[]
);
ALTER TABLE zad_registers ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON zad_registers TO anon, authenticated;
DROP POLICY IF EXISTS "zad_registers_select_public" ON zad_registers;
CREATE POLICY "zad_registers_select_public" ON zad_registers FOR SELECT TO anon, authenticated USING (true);

-- ===== zad_resources =====
CREATE TABLE IF NOT EXISTS zad_resources (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  page int,
  drive_url text,
  qr_url text,
  qr_note text
);
ALTER TABLE zad_resources ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON zad_resources TO anon, authenticated;
DROP POLICY IF EXISTS "zad_resources_select_public" ON zad_resources;
CREATE POLICY "zad_resources_select_public" ON zad_resources FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_zad_resources_slug ON zad_resources(slug);
CREATE INDEX IF NOT EXISTS idx_zad_resources_category ON zad_resources(category);

-- ===== zad_pyramid =====
CREATE TABLE IF NOT EXISTS zad_pyramid (
  tier_order int PRIMARY KEY,
  tier_id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL
);
ALTER TABLE zad_pyramid ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON zad_pyramid TO anon, authenticated;
DROP POLICY IF EXISTS "zad_pyramid_select_public" ON zad_pyramid;
CREATE POLICY "zad_pyramid_select_public" ON zad_pyramid FOR SELECT TO anon, authenticated USING (true);
