import { useCallback, useEffect, useRef, useState } from 'react';
import { Award, Upload, Loader2, ExternalLink, Trash2, Save, Gauge } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { DateField } from '@/components/ui/DateField';
import { Dialog, GhostButton, PrimaryButton, TextField } from '@/components/ui/kit';
import { performanceCriteria } from '@/data';
import { fetchPerformance, savePerformance, uploadReport, type PerformanceRow } from '@/lib/store';
import { deleteEvidence, fetchEvidence, getEvidenceUrl, type EvidenceRecord } from '@/lib/supabase';
import { criteriaForModule, indicatorsForModule } from '@/lib/linkage';

/** ملف الأداء الوظيفي: معايير التقويم مع درجة ذاتية وشواهد لكل معيار */
export function PerformancePage() {
  const [rows, setRows] = useState<Record<number, PerformanceRow>>({});
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [uploadFor, setUploadFor] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, ev] = await Promise.all([fetchPerformance(), fetchEvidence()]);
      setRows(p); setEvidence(ev.filter(e => criteriaForModule(e.module).length > 0));
    } catch { setError('تعذر التحميل'); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const totalWeight = performanceCriteria.reduce((s, c) => s + c.weight, 0);
  const weighted = performanceCriteria.reduce((s, c) => s + ((rows[c.id]?.score ?? 0) / 10) * c.weight, 0);
  const pct = totalWeight ? Math.round((weighted / totalWeight) * 100) : 0;
  const scored = performanceCriteria.filter(c => rows[c.id]?.score != null).length;

  const setScore = (id: number, v: string) => setRows(r => ({ ...r, [id]: { criterion_id: id, score: v === '' ? null : Math.max(0, Math.min(10, Number(v))), notes: r[id]?.notes ?? null } }));
  const setNotes = (id: number, v: string) => setRows(r => ({ ...r, [id]: { criterion_id: id, score: r[id]?.score ?? null, notes: v } }));
  const save = async (id: number) => {
    setSaving(id);
    try { await savePerformance(rows[id] || { criterion_id: id, score: null, notes: null }); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحفظ'); }
    finally { setSaving(null); }
  };
  const open = async (e: EvidenceRecord) => { try { window.open(await getEvidenceUrl(e.file_path), '_blank', 'noopener'); } catch { setError('تعذر فتح الملف'); } };
  const remove = async (e: EvidenceRecord) => {
    if (!confirm(`حذف الشاهد «${e.title}»؟`)) return;
    try { await deleteEvidence(e.id, e.file_path); setEvidence(l => l.filter(x => x.id !== e.id)); } catch { setError('تعذر الحذف'); }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-brand-500" /></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6 space-y-6">
      <div className="rounded-2xl bg-gradient-to-l from-brand-700 to-leaf-600 text-white p-6 flex flex-wrap items-center gap-6 shadow-lg shadow-brand-700/20">
        <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center"><Gauge className="w-10 h-10" /></div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-bold text-white/80">التقييم الذاتي الموزون</p>
          <p className="text-4xl font-extrabold mt-1">{pct}%</p>
          <p className="text-sm text-white/85 mt-1">قُيّم {scored} من {performanceCriteria.length} معيار · {evidence.length} شاهد مرتبط تلقائيًا من كل أقسام المنصة</p>
        </div>
        <div className="w-full sm:w-64 h-3 rounded-full bg-white/20 overflow-hidden"><div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} /></div>
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {performanceCriteria.map(c => {
          const ev = evidence.filter(e => criteriaForModule(e.module).includes(c.id));
          const score = rows[c.id]?.score;
          return (
            <Panel key={c.id}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-extrabold shrink-0">{c.id}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-extrabold text-brand-900 leading-7">{c.title}</p>
                    <span className="text-xs font-bold rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 whitespace-nowrap">الوزن {c.weight}%</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-7 mt-1">{c.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">{c.indicators.map(i => <span key={i} className="text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 px-2 py-1">{i}</span>)}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-[110px_1fr_auto] gap-2 items-end">
                <TextField label="الدرجة من 10" type="number" value={score ?? ''} onChange={v => setScore(c.id, v)} />
                <TextField label="ملاحظات" value={rows[c.id]?.notes ?? ''} onChange={v => setNotes(c.id, v)} placeholder="اختياري" />
                <button onClick={() => save(c.id)} className="h-[42px] mb-px rounded-xl bg-brand-700 text-white px-3 text-sm font-bold flex items-center gap-1">{saving === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ</button>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-700">الشواهد ({ev.length})</p>
                  <GhostButton onClick={() => setUploadFor(c.id)}><Upload className="w-3.5 h-3.5" /> رفع شاهد</GhostButton>
                </div>
                {ev.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {ev.map(e => (
                      <div key={e.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <span className="flex-1 truncate font-medium text-slate-700">{e.title}</span>
                        {!e.module.startsWith('criterion-') && <span className="text-[10px] font-bold rounded bg-leaf-50 text-leaf-700 px-1.5 py-0.5 whitespace-nowrap">تلقائي</span>}
                        <button onClick={() => open(e)} className="p-1 text-brand-700"><ExternalLink className="w-4 h-4" /></button>
                        <button onClick={() => remove(e)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      <UploadDialog criterionId={uploadFor} onClose={() => setUploadFor(null)} onDone={rec => { setEvidence(l => [rec, ...l]); setUploadFor(null); }} />
    </div>
  );
}

function UploadDialog({ criterionId, onClose, onDone }: { criterionId: number | null; onClose: () => void; onDone: (e: EvidenceRecord) => void }) {
  const crit = performanceCriteria.find(c => c.id === criterionId);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [hijri, setHijri] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { setTitle(''); setFile(null); setDate(''); setHijri(''); setError(''); }, [criterionId]);

  const submit = async () => {
    if (!crit) return;
    if (!title.trim()) return setError('اكتب عنوان الشاهد');
    if (!file) return setError('اختر الملف');
    setBusy(true); setError('');
    try { onDone(await uploadReport(file, title.trim(), `criterion-${crit.id}`, indicatorsForModule(`criterion-${crit.id}`), hijri || undefined)); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر الرفع'); } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!crit} title={`شاهد: ${crit?.title || ''}`} onClose={onClose}>
      <div className="space-y-3.5">
        <TextField label="عنوان الشاهد" required value={title} onChange={setTitle} />
        <DateField value={date} onChange={(g, h) => { setDate(g); setHijri(h); }} />
        <button type="button" onClick={() => input.current?.click()} className="w-full rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 hover:bg-brand-50 py-5 text-sm font-bold text-brand-800 flex flex-col items-center gap-1.5">
          <Award className="w-6 h-6 text-brand-600" />{file ? file.name : 'اختر صورة أو ملف PDF'}
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
        {error && <p className="text-sm text-rose-700">{error}</p>}
        <PrimaryButton onClick={submit} busy={busy} className="w-full py-3">رفع الشاهد</PrimaryButton>
      </div>
    </Dialog>
  );
}
