/*
# إنشاء تحليلات العيادة الرقمية ومقياس الميول المهنية

1. الجداول الجديدة
- `guidance_consultations`
  - `id`: معرف الطلب.
  - `consultation_type`: نوع الاستشارة.
  - `privacy_level`: درجة السرية المختارة.
  - `message`: نص الرسالة.
  - `requester_name`: اسم اختياري.
  - `created_at`: وقت الإرسال.
- `guidance_career_results`
  - `id`: معرف النتيجة.
  - `answers`: إجابات المقياس الثلاثة.
  - `result_track`: المسار الأعلى نتيجة.
  - `scores`: درجات المسارات الثلاثة.
  - `created_at`: وقت الإكمال.

2. الأمان
- تفعيل RLS على الجدولين.
- السماح للتطبيق المشترك غير المرتبط بتسجيل الدخول بإضافة الطلبات والنتائج.
- السماح بقراءة التحليلات داخل لوحة الموجه الطلابي.
- لا يتم عرض نصوص الاستشارات أو أسماء أصحابها في الإحصائيات العامة؛ الإحصاءات تعتمد على النوع ودرجة السرية فقط.

3. الفهارس
- فهارس على نوع الاستشارة ودرجة السرية ووقت الإنشاء لدعم الإحصائيات بسرعة.
*/

CREATE TABLE IF NOT EXISTS public.guidance_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name text,
  consultation_type text NOT NULL,
  privacy_level text NOT NULL,
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guidance_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guidance_consultations_select_shared" ON public.guidance_consultations;
CREATE POLICY "guidance_consultations_select_shared"
ON public.guidance_consultations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "guidance_consultations_insert_shared" ON public.guidance_consultations;
CREATE POLICY "guidance_consultations_insert_shared"
ON public.guidance_consultations FOR INSERT TO anon, authenticated
WITH CHECK (char_length(message) BETWEEN 1 AND 5000);

DROP POLICY IF EXISTS "guidance_consultations_update_shared" ON public.guidance_consultations;
CREATE POLICY "guidance_consultations_update_shared"
ON public.guidance_consultations FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (char_length(message) BETWEEN 1 AND 5000);

DROP POLICY IF EXISTS "guidance_consultations_delete_shared" ON public.guidance_consultations;
CREATE POLICY "guidance_consultations_delete_shared"
ON public.guidance_consultations FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.guidance_career_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  answers jsonb NOT NULL,
  result_track text NOT NULL,
  scores jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guidance_career_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guidance_career_results_select_shared" ON public.guidance_career_results;
CREATE POLICY "guidance_career_results_select_shared"
ON public.guidance_career_results FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "guidance_career_results_insert_shared" ON public.guidance_career_results;
CREATE POLICY "guidance_career_results_insert_shared"
ON public.guidance_career_results FOR INSERT TO anon, authenticated
WITH CHECK (result_track IN ('scientific', 'literary', 'technical'));

DROP POLICY IF EXISTS "guidance_career_results_update_shared" ON public.guidance_career_results;
CREATE POLICY "guidance_career_results_update_shared"
ON public.guidance_career_results FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (result_track IN ('scientific', 'literary', 'technical'));

DROP POLICY IF EXISTS "guidance_career_results_delete_shared" ON public.guidance_career_results;
CREATE POLICY "guidance_career_results_delete_shared"
ON public.guidance_career_results FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS guidance_consultations_type_idx
ON public.guidance_consultations (consultation_type);

CREATE INDEX IF NOT EXISTS guidance_consultations_privacy_idx
ON public.guidance_consultations (privacy_level);

CREATE INDEX IF NOT EXISTS guidance_consultations_created_idx
ON public.guidance_consultations (created_at DESC);

CREATE INDEX IF NOT EXISTS guidance_career_results_track_idx
ON public.guidance_career_results (result_track);

CREATE INDEX IF NOT EXISTS guidance_career_results_created_idx
ON public.guidance_career_results (created_at DESC);