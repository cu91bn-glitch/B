import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { supabase } from '@/lib/supabase';

type Ind = { code: string; text: string; domain: string; standard: string };
const REQUIRED = 3;

/** لوحة جاهزية الاعتماد المدرسي حسب المجال: كل ما يُرفع في المنصة يُحتسب تلقائيًا */
export function ReadinessByDomain() {
  const [data, setData] = useState<{ inds: Ind[]; count: Record<string, number> } | null>(null);
  useEffect(() => {
    (async () => {
      const [ind, ev, sv, pr, pc, sc] = await Promise.all([
        supabase.from('zad_indicators').select('*').order('code'),
        supabase.from('guidance_evidence').select('indicator_codes'),
        supabase.from('guidance_surveys').select('indicators, status'),
        supabase.from('guidance_programs').select('indicator_codes, status'),
        supabase.from('guidance_parent_council').select('indicator_codes'),
        supabase.from('guidance_student_council').select('indicator_codes'),
      ]);
      const count: Record<string, number> = {};
      const add = (codes?: string[] | null) => (codes || []).forEach(c => { count[c] = (count[c] || 0) + 1; });
      (ev.data || []).forEach((r: { indicator_codes: string[] }) => add(r.indicator_codes));
      (sv.data || []).forEach((r: { indicators: string[]; status: string }) => r.status === 'published' && add(r.indicators));
      (pr.data || []).forEach((r: { indicator_codes: string[]; status: string }) => r.status === 'completed' && add(r.indicator_codes));
      (pc.data || []).forEach((r: { indicator_codes: string[] }) => add(r.indicator_codes));
      (sc.data || []).forEach((r: { indicator_codes: string[] }) => add(r.indicator_codes));
      setData({ inds: (ind.data || []) as Ind[], count });
    })().catch(() => setData({ inds: [], count: {} }));
  }, []);

  if (!data) return <div className="px-4 sm:px-6 lg:px-10 mt-6"><Panel><div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div></Panel></div>;
  const domains = Array.from(new Set(data.inds.map(i => i.domain)));
  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6">
      <Panel title="لوحة جاهزية الاعتماد المدرسي" action={<span className="text-xs font-bold text-slate-500">تشمل الشواهد والبرامج المكتملة والاستبيانات المنشورة واجتماعات المجالس</span>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {domains.map(d => {
            const list = data.inds.filter(i => i.domain === d);
            const ready = list.filter(i => (data.count[i.code] || 0) >= REQUIRED).length;
            const pct = Math.round((ready / list.length) * 100);
            return (
              <div key={d} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-extrabold text-brand-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-leaf-600" />{d}</p>
                  <span className="text-sm font-extrabold text-brand-800">{pct}%</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-l from-brand-500 to-leaf-500" style={{ width: `${pct}%` }} /></div>
                <div className="mt-3 space-y-1.5">
                  {list.map(i => {
                    const n = data.count[i.code] || 0;
                    return (
                      <div key={i.code} className="flex items-start gap-2 text-xs">
                        <span dir="ltr" className="font-extrabold text-slate-500 w-14 shrink-0">{i.code}</span>
                        <span className="flex-1 text-slate-700 leading-5">{i.text}</span>
                        <span className={`font-extrabold rounded-full px-2 py-0.5 ${n >= REQUIRED ? 'bg-leaf-50 text-leaf-700' : n > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-600'}`}>{n}/{REQUIRED}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
