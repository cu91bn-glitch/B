/*
# توسعة نواة الشواهد للاعتماد المدرسي

1. التغيير
- توسيع جدول `guidance_evidence` الحالي دون حذف أو إعادة إنشاء أي سجل.
- `activity_id`: معرف النشاط أو البند الذي أنشأ الشاهد.
- `activity_title`: اسم النشاط أو البند وقت إنشاء الشاهد.
- `indicator_codes`: مصفوفة رموز مؤشرات الاعتماد المرتبطة بالشاهد.
- `evidence_date_hijri`: التاريخ الهجري كما يدخله المستخدم.
- `evidence_date_gregorian`: التاريخ الميلادي للشاهد.
- `public_token`: معرف عشوائي للرابط المختصر وQR.

2. الفهارس
- فهرس على النشاط.
- فهرس GIN على مؤشرات الاعتماد.
- فهرس فريد على رمز الرابط العام.

3. الأمان
- الإبقاء على RLS والصلاحيات الحالية لجدول الشواهد المشترك.
- لا يتم إنشاء صلاحيات جديدة أو كشف مسار تخزين الملفات.
- الروابط المولدة في الواجهة تشير إلى معرف عشوائي ولا تستبدل روابط الملفات الخاصة الموقعة.

4. التوافق
- القيم الافتراضية تجعل الشواهد السابقة قابلة للقراءة دون فقد بيانات.
- الحقول الجديدة اختيارية حتى لا تتعطل الشواهد القديمة.
*/

ALTER TABLE public.guidance_evidence
  ADD COLUMN IF NOT EXISTS activity_id text,
  ADD COLUMN IF NOT EXISTS activity_title text,
  ADD COLUMN IF NOT EXISTS indicator_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS evidence_date_hijri text,
  ADD COLUMN IF NOT EXISTS evidence_date_gregorian date,
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'guidance_evidence_public_token_key'
      AND conrelid = 'public.guidance_evidence'::regclass
  ) THEN
    ALTER TABLE public.guidance_evidence
      ADD CONSTRAINT guidance_evidence_public_token_key UNIQUE (public_token);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS guidance_evidence_activity_idx
  ON public.guidance_evidence (activity_id);

CREATE INDEX IF NOT EXISTS guidance_evidence_indicator_codes_idx
  ON public.guidance_evidence USING GIN (indicator_codes);