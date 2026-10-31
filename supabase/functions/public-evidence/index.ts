// عرض شاهد واحد عبر باركود التحقق، بدون تسجيل دخول.
// يتحقق من الرمز (public_token) ويعيد بيانات الشاهد ورابطًا مؤقتًا للملف (10 دقائق).
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
  try {
    const { token } = await req.json().catch(() => ({ token: '' }));
    if (typeof token !== 'string' || !UUID.test(token)) return json({ error: 'invalid' }, 400);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data, error } = await admin
      .from('guidance_evidence')
      .select('title, category, file_type, file_path, indicator_codes, evidence_date_hijri, created_at')
      .eq('public_token', token)
      .maybeSingle();
    if (error || !data) return json({ error: 'not_found' }, 404);
    const { data: signed } = await admin.storage.from('guidance-evidence').createSignedUrl(data.file_path, 600);
    const { file_path: _omit, ...rest } = data;
    return json({ ...rest, url: signed?.signedUrl || '' });
  } catch {
    return json({ error: 'server' }, 500);
  }
});
