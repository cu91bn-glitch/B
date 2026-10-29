/*
# المرحلة الثالثة: المتابعة والإنذار المبكر

1. الجداول الجديدة
- `guidance_attendance`: سجل حضور الطلاب باستخدام رمز طالب داخلي غير اسمه، والصف والتاريخ وحالة الحضور ومدة التأخر والملاحظات.
- `guidance_discipline`: سجل المخالفات والملاحظات السلوكية مع النوع ودرجة الخطورة والإجراء المتخذ والحالة.
- `guidance_talents`: سجل مواهب الطلاب وخطط تطويرها وشواهدها وحالتها.
- `guidance_early_alerts`: تنبيهات الإنذار المبكر الناتجة عن الغياب المتكرر أو التأخر أو التكرار السلوكي، مع درجة الخطورة وخطة المتابعة.

2. السلامة والخصوصية
- لا يخزن النظام اسم الطالب، بل يستخدم رمزاً داخلياً يحدده المرشد.
- تمكين RLS ومنح CRUD للأدوار anon و authenticated لأن المنصة لا تحتوي على تسجيل دخول.
- البيانات مشتركة داخل منصة المدرسة الحالية، مع سياسات منفصلة لكل عملية CRUD.

3. الفهارس
- فهارس على رمز الطالب، التاريخ، الحالة، ودرجة الخطورة لدعم لوحات المتابعة والإنذار المبكر.
*/

CREATE TABLE IF NOT EXISTS guidance_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code text NOT NULL,
  student_grade text NOT NULL,
  attendance_date_hijri text NOT NULL,
  attendance_date_gregorian date,
  status text NOT NULL CHECK (status IN ('present', 'late', 'absent', 'excused')),
  status_label text NOT NULL,
  minutes_late integer NOT NULL DEFAULT 0 CHECK (minutes_late >= 0),
  notes text,
  indicator_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE guidance_attendance ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON guidance_attendance TO anon, authenticated;
DROP POLICY IF EXISTS "attendance_select_shared" ON guidance_attendance;
CREATE POLICY "attendance_select_shared" ON guidance_attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "attendance_insert_shared" ON guidance_attendance;
CREATE POLICY "attendance_insert_shared" ON guidance_attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "attendance_update_shared" ON guidance_attendance;
CREATE POLICY "attendance_update_shared" ON guidance_attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "attendance_delete_shared" ON guidance_attendance;
CREATE POLICY "attendance_delete_shared" ON guidance_attendance FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS guidance_discipline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code text NOT NULL,
  student_grade text NOT NULL,
  incident_date_hijri text NOT NULL,
  incident_date_gregorian date,
  incident_type text NOT NULL CHECK (incident_type IN ('late', 'absence', 'behavior', 'academic', 'other')),
  incident_type_label text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  severity_label text NOT NULL,
  action_taken text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'monitoring', 'resolved', 'referred')),
  status_label text NOT NULL,
  notes text,
  indicator_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE guidance_discipline ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON guidance_discipline TO anon, authenticated;
DROP POLICY IF EXISTS "discipline_select_shared" ON guidance_discipline;
CREATE POLICY "discipline_select_shared" ON guidance_discipline FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "discipline_insert_shared" ON guidance_discipline;
CREATE POLICY "discipline_insert_shared" ON guidance_discipline FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "discipline_update_shared" ON guidance_discipline;
CREATE POLICY "discipline_update_shared" ON guidance_discipline FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "discipline_delete_shared" ON guidance_discipline;
CREATE POLICY "discipline_delete_shared" ON guidance_discipline FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS guidance_talents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code text NOT NULL,
  student_grade text NOT NULL,
  talent_type text NOT NULL CHECK (talent_type IN ('academic', 'artistic', 'sport', 'technical', 'leadership', 'other')),
  talent_type_label text NOT NULL,
  title text NOT NULL,
  evidence text,
  development_plan text,
  status text NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'developing', 'showcased', 'referred')),
  status_label text NOT NULL,
  indicator_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE guidance_talents ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON guidance_talents TO anon, authenticated;
DROP POLICY IF EXISTS "talents_select_shared" ON guidance_talents;
CREATE POLICY "talents_select_shared" ON guidance_talents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "talents_insert_shared" ON guidance_talents;
CREATE POLICY "talents_insert_shared" ON guidance_talents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "talents_update_shared" ON guidance_talents;
CREATE POLICY "talents_update_shared" ON guidance_talents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "talents_delete_shared" ON guidance_talents;
CREATE POLICY "talents_delete_shared" ON guidance_talents FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS guidance_early_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code text NOT NULL,
  student_grade text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('attendance', 'discipline', 'academic', 'combined')),
  alert_type_label text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('watch', 'warning', 'critical')),
  severity_label text NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  trigger_summary text NOT NULL,
  recommended_action text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'dismissed')),
  status_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE guidance_early_alerts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON guidance_early_alerts TO anon, authenticated;
DROP POLICY IF EXISTS "alerts_select_shared" ON guidance_early_alerts;
CREATE POLICY "alerts_select_shared" ON guidance_early_alerts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "alerts_insert_shared" ON guidance_early_alerts;
CREATE POLICY "alerts_insert_shared" ON guidance_early_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "alerts_update_shared" ON guidance_early_alerts;
CREATE POLICY "alerts_update_shared" ON guidance_early_alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "alerts_delete_shared" ON guidance_early_alerts;
CREATE POLICY "alerts_delete_shared" ON guidance_early_alerts FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON guidance_attendance(student_code);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON guidance_attendance(status);
CREATE INDEX IF NOT EXISTS idx_discipline_student ON guidance_discipline(student_code);
CREATE INDEX IF NOT EXISTS idx_discipline_severity ON guidance_discipline(severity);
CREATE INDEX IF NOT EXISTS idx_talents_student ON guidance_talents(student_code);
CREATE INDEX IF NOT EXISTS idx_talents_type ON guidance_talents(talent_type);
CREATE INDEX IF NOT EXISTS idx_alerts_student ON guidance_early_alerts(student_code);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON guidance_early_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON guidance_early_alerts(status);
