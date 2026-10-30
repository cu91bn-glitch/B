/*
  تسجيل دخول الموجّه وحماية بيانات الطلاب

  1. جدول guidance_staff: الحسابات المصرّح لها بلوحة الموجّه.
     أول حساب يُنشأ في Authentication يصبح موجّهًا تلقائيًا، وأي حساب بعده لا يُضاف إلا يدويًا.
  2. الدالة is_staff(): تُستخدم في كل السياسات.
  3. استبدال كل السياسات المفتوحة (USING true) بسياسات:
     - الموجّه: صلاحية كاملة على كل الجداول وملفات الشواهد.
     - الزوار (بدون دخول): فقط
         * قراءة مراجع زاد (zad_*)
         * قراءة الاستبيانات المنشورة
         * إرسال إجابات الاستبيانات
         * إرسال استشارة في العيادة الرقمية ونتيجة مقياس الميول
*/

-- 1) جدول الموجّهين
CREATE TABLE IF NOT EXISTS public.guidance_staff (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guidance_staff ENABLE ROW LEVEL SECURITY;

-- 2) دالة التحقق
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.guidance_staff WHERE user_id = (SELECT auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.is_staff() FROM public;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

CREATE POLICY "staff_read_own" ON public.guidance_staff
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR public.is_staff());

-- أول مستخدم يُنشأ يصبح موجّهًا
CREATE OR REPLACE FUNCTION public.guidance_bootstrap_first_staff()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.guidance_staff) THEN
    INSERT INTO public.guidance_staff (user_id, email) VALUES (NEW.id, NEW.email);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guidance_bootstrap_first_staff() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS guidance_bootstrap_first_staff ON auth.users;
CREATE TRIGGER guidance_bootstrap_first_staff
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.guidance_bootstrap_first_staff();

-- 3) حذف كل السياسات القديمة على جداول المنصة
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND (tablename LIKE 'guidance\_%' OR tablename LIKE 'zad\_%')
      AND tablename <> 'guidance_staff'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;

  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE 'guidance_evidence%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- 4) الموجّه: صلاحية كاملة على كل جدول
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND (tablename LIKE 'guidance\_%' OR tablename LIKE 'zad\_%')
      AND tablename <> 'guidance_staff'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff())', 'staff_all_' || t, t);
  END LOOP;
END $$;

-- 5) الزوار: قراءة مراجع زاد
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'zad\_%'
  LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', 'public_read_' || t, t);
  END LOOP;
END $$;

-- الاستبيانات المنشورة فقط
CREATE POLICY "public_read_published_surveys" ON public.guidance_surveys
  FOR SELECT TO anon, authenticated USING (status = 'published');

-- إرسال إجابات الاستبيان المنشور
CREATE POLICY "public_submit_survey_response" ON public.guidance_survey_public_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.guidance_surveys s WHERE s.id = survey_id AND s.status = 'published'));

-- استبيانات المحرك (ملف الإعداد) المجهولة
CREATE POLICY "public_submit_anonymous_response" ON public.guidance_survey_responses
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- العيادة الرقمية ومقياس الميول المهنية
CREATE POLICY "public_submit_consultation" ON public.guidance_consultations
  FOR INSERT TO anon, authenticated WITH CHECK (char_length(message) BETWEEN 1 AND 5000);
CREATE POLICY "public_submit_career_result" ON public.guidance_career_results
  FOR INSERT TO anon, authenticated WITH CHECK (result_track IN ('scientific', 'literary', 'technical'));

-- 6) ملفات الشواهد: للموجّه فقط
CREATE POLICY "guidance_evidence_staff_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'guidance-evidence' AND public.is_staff());
CREATE POLICY "guidance_evidence_staff_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'guidance-evidence' AND public.is_staff());
CREATE POLICY "guidance_evidence_staff_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'guidance-evidence' AND public.is_staff())
  WITH CHECK (bucket_id = 'guidance-evidence' AND public.is_staff());
CREATE POLICY "guidance_evidence_staff_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'guidance-evidence' AND public.is_staff());

-- 7) تقييد تنفيذ الدوال
REVOKE EXECUTE ON FUNCTION public.guidance_bootstrap_first_staff() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
