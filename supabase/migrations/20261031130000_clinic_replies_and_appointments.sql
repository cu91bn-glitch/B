-- الرد على استشارات العيادة الرقمية برمز متابعة، ومواعيد الاستشارة
ALTER TABLE public.guidance_consultations
  ADD COLUMN IF NOT EXISTS tracking_code text, ADD COLUMN IF NOT EXISTS contact text, ADD COLUMN IF NOT EXISTS reply text,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz, ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
CREATE UNIQUE INDEX IF NOT EXISTS idx_consultations_tracking ON public.guidance_consultations(tracking_code) WHERE tracking_code IS NOT NULL;
CREATE POLICY public_consultation_no_reply ON public.guidance_consultations AS RESTRICTIVE FOR INSERT TO anon
  WITH CHECK (reply IS NULL AND replied_at IS NULL AND status = 'new');

CREATE TABLE IF NOT EXISTS public.guidance_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tracking_code text UNIQUE NOT NULL, student_name text, student_grade text,
  appointment_date date NOT NULL, appointment_hijri text, slot text NOT NULL, reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled')), staff_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.guidance_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_all_guidance_appointments ON public.guidance_appointments FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY public_book_appointment ON public.guidance_appointments FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND staff_note IS NULL AND char_length(tracking_code) BETWEEN 6 AND 16 AND appointment_date >= current_date);

CREATE OR REPLACE FUNCTION public.clinic_lookup(p_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE r jsonb;
BEGIN
  IF p_code IS NULL OR char_length(p_code) < 6 THEN RETURN NULL; END IF;
  SELECT jsonb_build_object('kind', 'consultation', 'type', c.consultation_type, 'status', c.status, 'reply', c.reply, 'replied_at', c.replied_at, 'created_at', c.created_at)
    INTO r FROM public.guidance_consultations c WHERE c.tracking_code = upper(p_code);
  IF r IS NOT NULL THEN RETURN r; END IF;
  SELECT jsonb_build_object('kind', 'appointment', 'date', a.appointment_date, 'hijri', a.appointment_hijri, 'slot', a.slot, 'status', a.status, 'note', a.staff_note)
    INTO r FROM public.guidance_appointments a WHERE a.tracking_code = upper(p_code);
  RETURN r;
END;
$$;
REVOKE ALL ON FUNCTION public.clinic_lookup(text) FROM public;
GRANT EXECUTE ON FUNCTION public.clinic_lookup(text) TO anon, authenticated;
