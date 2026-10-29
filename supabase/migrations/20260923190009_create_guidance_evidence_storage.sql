/*
# إنشاء مخزن الشواهد والملفات لمنصة الموجه الطلابي

1. الجداول الجديدة
- `guidance_evidence`
  - `id`: معرف فريد للشاهد.
  - `title`: اسم الشاهد أو التقرير.
  - `category`: المجال المرتبط بالشاهد مثل البرامج أو التوجيه المهني أو التقويم الذاتي.
  - `module`: موقع الشاهد داخل المنصة.
  - `file_path`: مسار الملف داخل مخزن الملفات.
  - `file_name`: اسم الملف الأصلي المعروض للمستخدم.
  - `file_type`: نوع الملف، صورة أو PDF.
  - `file_size`: حجم الملف بالبايت.
  - `created_at`: تاريخ الرفع.

2. التخزين
- إنشاء bucket خاص باسم `guidance-evidence` لحفظ ملفات الصور وPDF.
- الملفات تحفظ في مجلدات حسب المجال لسهولة الوصول والتنظيم.

3. الأمان
- تفعيل RLS على جدول الشواهد.
- السماح للتطبيق غير المرتبط بتسجيل دخول بقراءة وإضافة وتعديل وحذف سجلات الشواهد المشتركة.
- سياسات التخزين تسمح فقط بملفات bucket المحدد، مع مسارات منظمة، وتمنع الوصول إلى buckets أخرى.
- الملفات تبقى داخل bucket خاص، ويطلب التطبيق رابطاً مؤقتاً عند العرض أو التحميل.

4. ملاحظات مهمة
- لا يتم حذف أي بيانات موجودة.
- القيود على نوع الملف والحجم تطبق في الواجهة، مع الاعتماد على امتدادات آمنة ومسارات مولدة من معرفات فريدة.
- أرقام الشواهد في لوحة المؤشرات تعتمد على السجلات المحفوظة في الجدول، ولذلك تتحدث بعد كل عملية رفع أو حذف.
*/

CREATE TABLE IF NOT EXISTS public.guidance_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  module text NOT NULL,
  file_path text NOT NULL UNIQUE,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'pdf')),
  file_size bigint NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guidance_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guidance_evidence_select_shared" ON public.guidance_evidence;
CREATE POLICY "guidance_evidence_select_shared"
ON public.guidance_evidence FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "guidance_evidence_insert_shared" ON public.guidance_evidence;
CREATE POLICY "guidance_evidence_insert_shared"
ON public.guidance_evidence FOR INSERT
TO anon, authenticated
WITH CHECK (file_type IN ('image', 'pdf') AND file_size > 0 AND file_size <= 10485760);

DROP POLICY IF EXISTS "guidance_evidence_update_shared" ON public.guidance_evidence;
CREATE POLICY "guidance_evidence_update_shared"
ON public.guidance_evidence FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (file_type IN ('image', 'pdf') AND file_size > 0 AND file_size <= 10485760);

DROP POLICY IF EXISTS "guidance_evidence_delete_shared" ON public.guidance_evidence;
CREATE POLICY "guidance_evidence_delete_shared"
ON public.guidance_evidence FOR DELETE
TO anon, authenticated
USING (true);

CREATE INDEX IF NOT EXISTS guidance_evidence_category_idx
ON public.guidance_evidence (category);

CREATE INDEX IF NOT EXISTS guidance_evidence_module_idx
ON public.guidance_evidence (module);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guidance-evidence',
  'guidance-evidence',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "guidance_evidence_storage_select" ON storage.objects;
CREATE POLICY "guidance_evidence_storage_select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'guidance-evidence');

DROP POLICY IF EXISTS "guidance_evidence_storage_insert" ON storage.objects;
CREATE POLICY "guidance_evidence_storage_insert"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'guidance-evidence'
  AND (storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png', 'webp')
);

DROP POLICY IF EXISTS "guidance_evidence_storage_update" ON storage.objects;
CREATE POLICY "guidance_evidence_storage_update"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'guidance-evidence')
WITH CHECK (bucket_id = 'guidance-evidence');

DROP POLICY IF EXISTS "guidance_evidence_storage_delete" ON storage.objects;
CREATE POLICY "guidance_evidence_storage_delete"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'guidance-evidence');