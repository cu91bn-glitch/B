import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, CheckCircle2, Database, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * أداة لمرة واحدة: نقل كل بيانات المنصة القديمة (قاعدة بولت) إلى القاعدة الجديدة.
 * تعمل للموجّه بعد تسجيل الدخول، وتنسخ الجداول ثم ملفات الشواهد.
 * تكرار التشغيل آمن: السجلات الموجودة تُحدَّث ولا تتكرر.
 */

const OLD_URL_DEFAULT = '';
const OLD_KEY_DEFAULT = '';

// بالترتيب حتى تُنقل الجداول المرجعية قبل الجداول المرتبطة بها
const TABLES: { name: string; key: string }[] = [
  { name: 'zad_indicators', key: 'code' },
  { name: 'zad_programs', key: 'id' },
  { name: 'zad_program_indicator', key: 'program_id,indicator_code' },
  { name: 'zad_occasions', key: 'id' },
  { name: 'zad_registers', key: 'id' },
  { name: 'zad_resources', key: 'id' },
  { name: 'zad_pyramid', key: 'tier_order' },
  { name: 'guidance_surveys', key: 'id' },
  { name: 'guidance_survey_public_responses', key: 'id' },
  { name: 'guidance_survey_responses', key: 'id' },
  { name: 'guidance_evidence', key: 'id' },
  { name: 'guidance_consultations', key: 'id' },
  { name: 'guidance_career_results', key: 'id' },
  { name: 'guidance_parent_council', key: 'id' },
  { name: 'guidance_satisfaction_surveys', key: 'id' },
  { name: 'guidance_case_registry', key: 'id' },
  { name: 'guidance_attendance', key: 'id' },
  { name: 'guidance_discipline', key: 'id' },
  { name: 'guidance_talents', key: 'id' },
  { name: 'guidance_early_alerts', key: 'id' },
];

type Row = Record<string, unknown>;
type Log = { text: string; kind: 'info' | 'ok' | 'warn' };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function upsertRows(table: string, key: string, rows: Row[]): Promise<{ written: number; dropped: string[] }> {
  const dropped: string[] = [];
  let data = rows;
  for (let attempt = 0; attempt < 10; attempt++) {
    let failed: string | null = null;
    for (const part of chunk(data, 300)) {
      const { error } = await supabase.from(table).upsert(part, { onConflict: key });
      if (error) { failed = error.message; break; }
    }
    if (!failed) return { written: data.length, dropped };
    // عمود موجود في القاعدة القديمة وغير موجود في الجديدة: نتجاهله ونعيد المحاولة
    const match = failed.match(/'([^']+)' column/);
    if (!match) throw new Error(failed);
    dropped.push(match[1]);
    data = data.map(row => { const copy = { ...row }; delete copy[match[1]]; return copy; });
  }
  throw new Error('تعذر مطابقة الأعمدة');
}

export function MigrateDataPage({ onClose }: { onClose: () => void }) {
  const [oldUrl, setOldUrl] = useState(OLD_URL_DEFAULT);
  const [oldKey, setOldKey] = useState(OLD_KEY_DEFAULT);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const log = (text: string, kind: Log['kind'] = 'info') => setLogs(prev => [...prev, { text, kind }]);

  const run = async () => {
    setRunning(true);
    setDone(false);
    setLogs([]);
    try {
      const old = createClient(oldUrl.trim(), oldKey.trim(), { auth: { persistSession: false, autoRefreshToken: false } });
      const evidenceRows: Row[] = [];

      for (const t of TABLES) {
        const rows: Row[] = [];
        for (let from = 0; ; from += 1000) {
          const { data, error } = await old.from(t.name).select('*').range(from, from + 999);
          if (error) { log(`${t.name}: تعذرت القراءة (${error.message})`, 'warn'); break; }
          rows.push(...(data || []));
          if (!data || data.length < 1000) break;
        }
        if (t.name === 'guidance_evidence') evidenceRows.push(...rows);
        if (rows.length === 0) { log(`${t.name}: لا توجد بيانات`); continue; }
        try {
          const { written, dropped } = await upsertRows(t.name, t.key, rows);
          log(`${t.name}: نُقل ${written} سجل${dropped.length ? ` (تُجوهلت أعمدة: ${dropped.join('، ')})` : ''}`, 'ok');
        } catch (err) {
          log(`${t.name}: فشل النقل (${err instanceof Error ? err.message : String(err)})`, 'warn');
        }
      }

      let copied = 0;
      let failed = 0;
      for (const row of evidenceRows) {
        const path = String(row.file_path || '');
        if (!path) continue;
        const { data: blob, error } = await old.storage.from('guidance-evidence').download(path);
        if (error || !blob) { failed++; continue; }
        const { error: upErr } = await supabase.storage.from('guidance-evidence').upload(path, blob, { upsert: true, contentType: blob.type || undefined });
        if (upErr) failed++; else copied++;
        if ((copied + failed) % 10 === 0) log(`ملفات الشواهد: ${copied + failed} من ${evidenceRows.length}...`);
      }
      if (evidenceRows.length) log(`ملفات الشواهد: نُسخ ${copied}${failed ? `، وتعذر ${failed}` : ''}`, failed ? 'warn' : 'ok');
      setDone(true);
    } catch (err) {
      log(`توقف النقل: ${err instanceof Error ? err.message : String(err)}`, 'warn');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <button onClick={onClose} className="text-sm text-cyan-700 inline-flex items-center gap-1 mb-4"><ArrowRight className="w-4 h-4" /> العودة للوحة</button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center"><Database className="w-5 h-5" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 font-cairo">نقل البيانات من المنصة القديمة</h1>
            <p className="text-xs text-slate-500">ينسخ كل الجداول وملفات الشواهد. تكرار التشغيل لا يكرر البيانات.</p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <label className="block text-sm text-slate-700">رابط القاعدة القديمة
            <input dir="ltr" value={oldUrl} onChange={e => setOldUrl(e.target.value)} placeholder="https://xxxx.supabase.co" className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm" />
          </label>
          <label className="block text-sm text-slate-700">المفتاح العام للقاعدة القديمة (anon key)
            <input dir="ltr" value={oldKey} onChange={e => setOldKey(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs" />
          </label>
          <button onClick={run} disabled={running || !oldUrl || !oldKey} className="w-full rounded-lg bg-cyan-700 py-3 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-50">
            {running ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> جارٍ النقل... لا تغلق الصفحة</span> : 'ابدأ النقل'}
          </button>
        </div>
        {logs.length > 0 && (
          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-3 max-h-80 overflow-auto text-xs leading-6">
            {logs.map((l, i) => (
              <div key={i} className={l.kind === 'ok' ? 'text-emerald-700' : l.kind === 'warn' ? 'text-amber-700' : 'text-slate-600'}>
                {l.kind === 'warn' && <AlertTriangle className="inline w-3.5 h-3.5 ml-1" />}{l.text}
              </div>
            ))}
          </div>
        )}
        {done && <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="w-5 h-5" /> اكتمل النقل. ارجع للوحة وتأكد من البيانات.</div>}
      </div>
    </div>
  );
}
