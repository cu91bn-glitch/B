/*
# محرك الاستبيانات المجهولة

1. جدول جديد
- `guidance_survey_responses`: يحفظ إجابة استبيان مجهولة، رمز الاستبيان، الموجة القبلية/البعدية، الصف، الإجابات الرقمية، النتائج المجمعة، والإضافات غير التعريفية.
- لا توجد أعمدة للاسم أو رقم الهوية أو عنوان IP.
- `response_fingerprint` بصمة تجزئة لمنع تكرار الإرسال من المتصفح دون عرضها في الواجهة.

2. الأمان والخصوصية
- تفعيل RLS.
- السماح لـ anon و authenticated بالإضافة فقط لأن هذا الإصدار مخصص للإجابة العامة المجهولة.
- منع القراءة والتعديل والحذف من الواجهة العامة حتى لا تظهر إجابات الطلاب.
- قيد uniqueness يمنع إرسال البصمة نفسها للاستبيان والموجة نفسها.

3. ملاحظات
- التقارير المجزأة والتحليل وصلاحيات الموجه والمدير والمشرف ستضاف في مرحلة التحليل، مع شرط n >= 5.
*/

CREATE TABLE IF NOT EXISTS guidance_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id text NOT NULL,
  wave text NOT NULL DEFAULT 'single' CHECK (wave IN ('pre', 'post', 'single')),
  grade text NOT NULL,
  response_fingerprint text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  section_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (survey_id, wave, response_fingerprint)
);

ALTER TABLE guidance_survey_responses ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON guidance_survey_responses TO anon, authenticated;

DROP POLICY IF EXISTS "survey_responses_insert_anonymous" ON guidance_survey_responses;
CREATE POLICY "survey_responses_insert_anonymous" ON guidance_survey_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON guidance_survey_responses(survey_id, wave);
CREATE INDEX IF NOT EXISTS idx_survey_responses_grade ON guidance_survey_responses(grade);
