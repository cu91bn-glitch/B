-- ملف الموجّه، البرامج الإرشادية، الأداء الوظيفي، المجلس الطلابي، وتقرير PDF لمجلس الآباء
CREATE TABLE IF NOT EXISTS public.guidance_profile (id int PRIMARY KEY DEFAULT 1 CHECK (id = 1), data jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.guidance_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_all_guidance_profile ON public.guidance_profile FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE IF NOT EXISTS public.guidance_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL,
  path text NOT NULL DEFAULT 'developmental' CHECK (path IN ('preventive', 'developmental', 'remedial')),
  zad_program text, target_group text, date_gregorian date, date_hijri text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  description text, objectives text[] NOT NULL DEFAULT ARRAY[]::text[], activities text[] NOT NULL DEFAULT ARRAY[]::text[],
  outcomes text[] NOT NULL DEFAULT ARRAY[]::text[], beneficiaries int NOT NULL DEFAULT 0,
  indicator_codes text[] NOT NULL DEFAULT ARRAY[]::text[], created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guidance_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_all_guidance_programs ON public.guidance_programs FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE IF NOT EXISTS public.guidance_performance (criterion_id int PRIMARY KEY, score numeric(4,1) CHECK (score >= 0 AND score <= 10), notes text, updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.guidance_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_all_guidance_performance ON public.guidance_performance FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE IF NOT EXISTS public.guidance_student_council (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), meeting_date_hijri text NOT NULL, meeting_date_gregorian date, topic text NOT NULL,
  attendees_count int NOT NULL DEFAULT 0, recommendations text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'implemented', 'cancelled')),
  status_label text NOT NULL DEFAULT 'مجدول', report_evidence_id uuid REFERENCES public.guidance_evidence(id) ON DELETE SET NULL,
  indicator_codes text[] NOT NULL DEFAULT ARRAY[]::text[], created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guidance_student_council ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_all_guidance_student_council ON public.guidance_student_council FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

ALTER TABLE public.guidance_parent_council ADD COLUMN IF NOT EXISTS report_evidence_id uuid REFERENCES public.guidance_evidence(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_programs_status ON public.guidance_programs(status);
CREATE INDEX IF NOT EXISTS idx_student_council_date ON public.guidance_student_council(meeting_date_gregorian);
