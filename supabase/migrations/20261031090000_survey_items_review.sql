-- مراجعة الاستبيانات: إضافة فقرات للأبعاد التي فيها فقرتان فقط (لرفع ثبات القياس)
CREATE OR REPLACE FUNCTION pg_temp.add_items(p_slug text, p_section text, p_items jsonb) RETURNS void LANGUAGE sql AS $$
  UPDATE public.guidance_surveys g
  SET sections = (
    SELECT jsonb_agg(CASE WHEN s->>'id' = p_section THEN jsonb_set(s, '{items}', (s->'items') || p_items) ELSE s END ORDER BY ord)
    FROM jsonb_array_elements(g.sections) WITH ORDINALITY AS t(s, ord)
  ), updated_at = now()
  WHERE g.slug = p_slug;
$$;
SELECT pg_temp.add_items('digital_ethics', 'report', '[{"text":"أتحمل مسؤولية ما أنشره أو أعيد نشره في المنصة.","reverse":false},{"text":"أتجاهل الإساءة الرقمية إذا لم تكن موجهة إليّ.","reverse":true}]');
SELECT pg_temp.add_items('conduct_knowledge', 'appearance', '[{"text":"المظهر العام اللائق جزء من قواعد السلوك المحاسب عليها.","reverse":false}]');
SELECT pg_temp.add_items('conduct_knowledge', 'devices', '[{"text":"نشر صور أو مقاطع من داخل المدرسة دون إذن مخالفة يُحاسب عليها الطالب.","reverse":false}]');
SELECT pg_temp.add_items('conduct_knowledge', 'property', '[{"text":"الاعتداء على الزملاء أو المعلمين من المخالفات الجسيمة.","reverse":false}]');
SELECT pg_temp.add_items('graduate_celebration', 'organization', '[{"text":"التزام الحفل بالوقت المعلن.","reverse":false}]');
SELECT pg_temp.add_items('graduate_celebration', 'content', '[{"text":"مناسبة مدة الحفل وتناسق فقراته.","reverse":false}]');
SELECT pg_temp.add_items('graduate_celebration', 'recognition', '[{"text":"شمول التكريم للمتميزين في الجوانب غير الدراسية.","reverse":false}]');
SELECT pg_temp.add_items('graduate_celebration', 'belonging', '[{"text":"أشعر بالفخر بانتمائي (أو انتماء ابني) لهذه المدرسة.","reverse":false}]');
SELECT pg_temp.add_items('graduate_celebration', 'overall', '[{"text":"حقق الحفل الهدف منه في الاحتفاء بالخريجين.","reverse":false}]');
UPDATE public.guidance_surveys SET programs = array_remove(programs, 'success') WHERE slug = 'learning_styles';
