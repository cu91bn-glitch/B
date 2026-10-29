-- محرك الاستبيانات - جداول الاستبيانات والاستجابات العامة
-- 1. guidance_surveys: تعريف الاستبيان (JSONB كامل للإعداد)
-- 2. guidance_survey_public_responses: استجابات مجهولة بلا معرفات
-- الأمان: RLS + قراءة/كتابة عامة للاستبيانات المنشورة + إضافة فقط للاستجابات

CREATE TABLE IF NOT EXISTS guidance_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  title text NOT NULL,
  audience text NOT NULL DEFAULT 'student',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  scale jsonb NOT NULL DEFAULT '{"type":"likert5","labels":["لا أوافق بشدة","لا أوافق","محايد","أوافق","أوافق بشدة"]}'::jsonb,
  intro text NOT NULL DEFAULT '',
  demographics jsonb NOT NULL DEFAULT '[]'::jsonb,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{"anonymous":true,"one_response_per_device":true}'::jsonb,
  indicators text[] DEFAULT ARRAY[]::text[],
  programs text[] DEFAULT ARRAY[]::text[],
  resources text[] DEFAULT ARRAY[]::text[],
  publish_gate text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guidance_surveys ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON guidance_surveys TO anon, authenticated;

DROP POLICY IF EXISTS "surveys_select_public" ON guidance_surveys;
CREATE POLICY "surveys_select_public" ON guidance_surveys FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "surveys_insert_public" ON guidance_surveys;
CREATE POLICY "surveys_insert_public" ON guidance_surveys FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "surveys_update_public" ON guidance_surveys;
CREATE POLICY "surveys_update_public" ON guidance_surveys FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "surveys_delete_public" ON guidance_surveys;
CREATE POLICY "surveys_delete_public" ON guidance_surveys FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_surveys_slug ON guidance_surveys(slug);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON guidance_surveys(status);

CREATE TABLE IF NOT EXISTS guidance_survey_public_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES guidance_surveys(id) ON DELETE CASCADE,
  demographics jsonb NOT NULL DEFAULT '{}'::jsonb,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  text_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_fingerprint text,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guidance_survey_public_responses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON guidance_survey_public_responses TO anon, authenticated;

DROP POLICY IF EXISTS "survey_responses_insert_public" ON guidance_survey_public_responses;
CREATE POLICY "survey_responses_insert_public" ON guidance_survey_public_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "survey_responses_select_public" ON guidance_survey_public_responses;
CREATE POLICY "survey_responses_select_public" ON guidance_survey_public_responses FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON guidance_survey_public_responses(survey_id);
