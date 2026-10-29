/*
# المرحلة الثانية: جداول الاعتماد المدرسي

## التغييرات
1. جدول guidance_parent_council — سجل اجتماعات مجلس الآباء (مواضيع، حضور، توصيات، حالة)
2. جدول guidance_satisfaction_surveys — استبيانات الرضا (نوع الاستبيان، الفئة المستهدفة، الأسئلة والنتائج)
3. جدول guidance_case_registry — سجل الحالات الطلابية (نوع الحالة، التصنيف، خطة التدخل، الحالة)

## الأمان
- RLS مفعّل على جميع الجداول
- صلاحيات CRUD لـ anon و authenticated (تطبيق أحادي المستخدم بدون تسجيل دخول)
- سياسات USING (true) لأن البيانات مشتركة/عامة في هذا التطبيق
*/

-- ============ جدول مجلس الآباء ============
CREATE TABLE IF NOT EXISTS guidance_parent_council (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date_hijri text NOT NULL,
  meeting_date_gregorian date,
  topic text NOT NULL,
  attendees_count integer NOT NULL DEFAULT 0,
  recommendations text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  status_label text NOT NULL DEFAULT 'مجدول',
  indicator_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guidance_parent_council ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON guidance_parent_council TO anon, authenticated;

DROP POLICY IF EXISTS "parent_council_select_shared" ON guidance_parent_council;
CREATE POLICY "parent_council_select_shared" ON guidance_parent_council FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "parent_council_insert_shared" ON guidance_parent_council;
CREATE POLICY "parent_council_insert_shared" ON guidance_parent_council FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "parent_council_update_shared" ON guidance_parent_council;
CREATE POLICY "parent_council_update_shared" ON guidance_parent_council FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "parent_council_delete_shared" ON guidance_parent_council;
CREATE POLICY "parent_council_delete_shared" ON guidance_parent_council FOR DELETE
  TO anon, authenticated USING (true);

-- ============ جدول استبيانات الرضا ============
CREATE TABLE IF NOT EXISTS guidance_satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_type text NOT NULL CHECK (survey_type IN ('program', 'service', 'parent', 'student')),
  survey_type_label text NOT NULL,
  target_group text NOT NULL,
  total_responses integer NOT NULL DEFAULT 0,
  satisfaction_score numeric(4,1) NOT NULL DEFAULT 0 CHECK (satisfaction_score >= 0 AND satisfaction_score <= 100),
  areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  indicator_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  conducted_date_hijri text,
  conducted_date_gregorian date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guidance_satisfaction_surveys ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON guidance_satisfaction_surveys TO anon, authenticated;

DROP POLICY IF EXISTS "satisfaction_select_shared" ON guidance_satisfaction_surveys;
CREATE POLICY "satisfaction_select_shared" ON guidance_satisfaction_surveys FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "satisfaction_insert_shared" ON guidance_satisfaction_surveys;
CREATE POLICY "satisfaction_insert_shared" ON guidance_satisfaction_surveys FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "satisfaction_update_shared" ON guidance_satisfaction_surveys;
CREATE POLICY "satisfaction_update_shared" ON guidance_satisfaction_surveys FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "satisfaction_delete_shared" ON guidance_satisfaction_surveys;
CREATE POLICY "satisfaction_delete_shared" ON guidance_satisfaction_surveys FOR DELETE
  TO anon, authenticated USING (true);

-- ============ جدول سجل الحالات ============
CREATE TABLE IF NOT EXISTS guidance_case_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE NOT NULL,
  student_grade text NOT NULL,
  case_type text NOT NULL CHECK (case_type IN ('psychological', 'social', 'academic', 'behavioral')),
  case_type_label text NOT NULL,
  classification text NOT NULL DEFAULT 'mild' CHECK (classification IN ('mild', 'moderate', 'severe')),
  classification_label text NOT NULL DEFAULT 'بسيطة',
  intervention_plan text,
  sessions_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'improved', 'referred', 'closed')),
  status_label text NOT NULL DEFAULT 'مفتوحة',
  open_date_hijri text,
  open_date_gregorian date,
  close_date_hijri text,
  close_date_gregorian date,
  indicator_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guidance_case_registry ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON guidance_case_registry TO anon, authenticated;

DROP POLICY IF EXISTS "case_registry_select_shared" ON guidance_case_registry;
CREATE POLICY "case_registry_select_shared" ON guidance_case_registry FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "case_registry_insert_shared" ON guidance_case_registry;
CREATE POLICY "case_registry_insert_shared" ON guidance_case_registry FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "case_registry_update_shared" ON guidance_case_registry;
CREATE POLICY "case_registry_update_shared" ON guidance_case_registry FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "case_registry_delete_shared" ON guidance_case_registry;
CREATE POLICY "case_registry_delete_shared" ON guidance_case_registry FOR DELETE
  TO anon, authenticated USING (true);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_parent_council_status ON guidance_parent_council(status);
CREATE INDEX IF NOT EXISTS idx_satisfaction_type ON guidance_satisfaction_surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_case_registry_status ON guidance_case_registry(status);
CREATE INDEX IF NOT EXISTS idx_case_registry_type ON guidance_case_registry(case_type);
CREATE INDEX IF NOT EXISTS idx_parent_council_indicators ON guidance_parent_council USING GIN (indicator_codes);
CREATE INDEX IF NOT EXISTS idx_satisfaction_indicators ON guidance_satisfaction_surveys USING GIN (indicator_codes);
CREATE INDEX IF NOT EXISTS idx_case_registry_indicators ON guidance_case_registry USING GIN (indicator_codes);
