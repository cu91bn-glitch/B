import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { fetchSurveyResponses, fetchSurveys, type SurveyDefinition, type SurveyResponseRecord } from '@/lib/supabase';

/** قياس الأثر: مقارنة متوسطات الأبعاد بين التطبيق القبلي والبعدي */
export function PrePostPanel() {
  const [surveys, setSurveys] = useState<SurveyDefinition[]>([]);
  const [id, setId] = useState('');
  const [responses, setResponses] = useState<SurveyResponseRecord[] | null>(null);

  useEffect(() => { fetchSurveys().then(list => setSurveys(list.filter(s => s.demographics?.some(d => d.id === 'wave')))).catch(() => {}); }, []);
  useEffect(() => { if (id) { setResponses(null); fetchSurveyResponses(id).then(setResponses).catch(() => setResponses([])); } }, [id]);

  const survey = surveys.find(s => s.id === id);
  const rows = useMemo(() => {
    if (!survey || !responses) return [];
    const isPre = (r: SurveyResponseRecord) => (r.demographics?.wave || '').startsWith('قبلي');
    const isPost = (r: SurveyResponseRecord) => (r.demographics?.wave || '').startsWith('بعدي');
    const mean = (list: SurveyResponseRecord[], sectionId: string, items: { reverse?: boolean }[]) => {
      const vals: number[] = [];
      for (const r of list) items.forEach((it, i) => { const v = r.answers?.[`${sectionId}-${i}`]; if (typeof v === 'number') vals.push(it.reverse ? 6 - v : v); });
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const pre = responses.filter(isPre), post = responses.filter(isPost);
    return survey.sections.map(sec => ({ name: sec.name, pre: mean(pre, sec.id, sec.items), post: mean(post, sec.id, sec.items), nPre: pre.length, nPost: post.length }));
  }, [survey, responses]);

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6">
      <Panel title="قياس الأثر: مقارنة قبلي / بعدي">
        {surveys.length === 0 ? (
          <p className="text-sm text-slate-600 leading-7">انشر نموذجًا من نماذج «قياس أثر» (فيها سؤال وقت التطبيق: قبلي/بعدي)، وطبّقه قبل البرنامج وبعده، وستظهر المقارنة هنا تلقائيًا.</p>
        ) : (
          <>
            <select value={id} onChange={e => setId(e.target.value)} className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
              <option value="">اختر استبيان قياس الأثر</option>
              {surveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            {id && !responses && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>}
            {id && responses && (
              rows.every(r => r.pre === null || r.post === null)
                ? <p className="mt-4 text-sm text-amber-800 bg-amber-50 rounded-xl p-3 font-bold">تحتاج المقارنة إلى إجابات قبلية وبعدية. الحالي: قبلي {rows[0]?.nPre ?? 0} · بعدي {rows[0]?.nPost ?? 0}</p>
                : (
                  <div className="mt-5 space-y-4">
                    <div className="flex gap-4 text-xs font-bold text-slate-600"><span><span className="inline-block w-3 h-3 rounded bg-slate-300 ml-1.5" />قبلي ({rows[0]?.nPre})</span><span><span className="inline-block w-3 h-3 rounded bg-leaf-500 ml-1.5" />بعدي ({rows[0]?.nPost})</span></div>
                    {rows.map(r => {
                      const diff = r.pre !== null && r.post !== null ? r.post - r.pre : null;
                      return (
                        <div key={r.name}>
                          <div className="flex items-center justify-between text-sm font-bold text-slate-800">
                            <span>{r.name}</span>
                            {diff !== null && <span className={`inline-flex items-center gap-1 ${diff >= 0 ? 'text-leaf-700' : 'text-rose-600'}`}>{diff >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}{diff >= 0 ? '+' : ''}{diff.toFixed(2)}</span>}
                          </div>
                          <div className="mt-1.5 space-y-1">
                            <div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-slate-300 rounded-full" style={{ width: `${((r.pre ?? 0) / 5) * 100}%` }} /></div>
                            <div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-leaf-500 rounded-full" style={{ width: `${((r.post ?? 0) / 5) * 100}%` }} /></div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">قبلي {r.pre?.toFixed(2) ?? '—'} · بعدي {r.post?.toFixed(2) ?? '—'} من 5</p>
                        </div>
                      );
                    })}
                  </div>
                )
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
