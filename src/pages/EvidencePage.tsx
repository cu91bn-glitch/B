import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Upload, Loader2, Trash2, ExternalLink, QrCode, Search, FileText, Image as ImageIcon, CheckCircle2, X, Download,
} from 'lucide-react';
import {
  createEvidence, deleteEvidence, fetchEvidence, getEvidenceUrl, buildPublicEvidenceUrl, type EvidenceRecord,
} from '@/lib/supabase';
import { PROGRAM_NAMES, indicatorsForPrograms } from '@/lib/autoIndicators';
import { fileModules, performanceCriteria } from '@/data';
import { programsForModule, criteriaForModule } from '@/lib/linkage';
import { Panel } from '@/components/layout/AppShell';
import { DateField } from '@/components/ui/DateField';

const GENERAL = 'general';
const programsOf = (id: string) => programsForModule(id);
const programName = (id: string): string => {
  if (id === GENERAL) return 'عام';
  if (PROGRAM_NAMES[id]) return PROGRAM_NAMES[id];
  const fm = fileModules.find(m => m.id === id);
  if (fm) return fm.title;
  const crit = id.match(/^criterion-(\d+)$/);
  if (crit) return `الأداء الوظيفي: ${performanceCriteria.find(c => c.id === Number(crit[1]))?.title || ''}`;
  const zad = programsForModule(id)[0];
  return zad ? PROGRAM_NAMES[zad] : id;
};

export function EvidencePage() {
  const [items, setItems] = useState<EvidenceRecord[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [qrFor, setQrFor] = useState<EvidenceRecord | null>(null);
  const [view, setView] = useState<'all' | 'files'>('all');
  const [preset, setPreset] = useState<{ module: string; n: number }>({ module: GENERAL, n: 0 });
  const [cat, setCat] = useState<'career' | 'self_eval' | 'community' | 'documents'>('self_eval');
  const counts = useMemo(() => { const m: Record<string, number> = {}; for (const e of items || []) m[e.module] = (m[e.module] || 0) + 1; return m; }, [items]);

  const load = useCallback(() => {
    fetchEvidence().then(setItems).catch(() => setError('تعذر تحميل الشواهد'));
  }, []);
  useEffect(load, [load]);

  const filtered = useMemo(() => (items || []).filter(e =>
    (filter === 'all' || e.module === filter) &&
    (!query || e.title.includes(query) || (e.category || '').includes(query))), [items, filter, query]);

  const remove = async (e: EvidenceRecord) => {
    if (!confirm(`حذف الشاهد «${e.title}» وملفه نهائيًا؟`)) return;
    try { await deleteEvidence(e.id, e.file_path); setItems(prev => (prev || []).filter(i => i.id !== e.id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر الحذف'); }
  };

  const open = async (e: EvidenceRecord) => {
    try { window.open(await getEvidenceUrl(e.file_path), '_blank', 'noopener'); }
    catch { setError('تعذر فتح الملف'); }
  };

  const usedModules = Array.from(new Set((items || []).map(i => i.module)));

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6 grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start">
      <NewEvidence key={preset.n} presetModule={preset.module} onCreated={rec => { setItems(prev => [rec, ...(prev || [])]); setQrFor(rec); }} />

      <div className="space-y-4 min-w-0">
      <div className="flex gap-2">
        {([['all', 'كل الشواهد'], ['files', 'ملفات الموجّه']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setView(k)} className={`rounded-xl px-4 py-2.5 text-sm font-extrabold border ${view === k ? 'bg-brand-700 text-white border-brand-700 shadow' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{label}</button>
        ))}
      </div>
      {view === 'files' && (
        <Panel title="ملفات الموجّه">
          <div className="flex flex-wrap gap-2 mb-4">
            {(['self_eval', 'career', 'community', 'documents'] as const).map(c => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold border ${cat === c ? 'bg-leaf-600 text-white border-leaf-600' : 'bg-white text-slate-600 border-slate-200'}`}>{fileModules.find(m => m.category === c)?.categoryLabel}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fileModules.filter(m => m.category === cat).map(m => (
              <div key={m.id} className="rounded-xl border border-slate-200 p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-extrabold text-brand-900">{m.title}</p>
                  <span className={`whitespace-nowrap text-[11px] font-bold rounded-full px-2 py-0.5 ${counts[m.id] ? 'bg-leaf-50 text-leaf-700' : 'bg-slate-100 text-slate-500'}`}>{counts[m.id] || 0} شاهد</span>
                </div>
                <p className="text-xs text-slate-600 leading-6 mt-1 flex-1">{m.description}</p>
                <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100">
                  <button onClick={() => { setPreset({ module: m.id, n: preset.n + 1 }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"><Upload className="w-3.5 h-3.5" /> رفع شاهد</button>
                  {(counts[m.id] || 0) > 0 && <button onClick={() => { setFilter(m.id); setView('all'); }} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100"><Search className="w-3.5 h-3.5" /> عرض الشواهد</button>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {view === 'all' && (
      <Panel title={`الشواهد${items ? ` (${items.length})` : ''}`}>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="بحث بعنوان الشاهد..." className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 py-2.5 text-sm" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
            <option value="all">كل البرامج</option>
            {usedModules.map(m => <option key={m} value={m}>{programName(m)}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-rose-700 mb-3">{error}</p>}
        {!items ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          : filtered.length === 0 ? <p className="text-center text-sm text-slate-500 py-12">لا توجد شواهد بعد. ارفع أول شاهد من النموذج.</p>
          : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map(e => (
                <div key={e.id} className="rounded-xl border border-slate-200 p-4 hover:border-brand-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${e.file_type === 'pdf' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'}`}>
                      {e.file_type === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-slate-800 leading-6">{e.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{programName(e.module)} · {e.evidence_date_hijri || new Date(e.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                  {criteriaForModule(e.module).length > 0 && (
                    <p className="mt-2 text-[11px] font-bold text-amber-700">يظهر في الأداء الوظيفي: معيار {criteriaForModule(e.module).join('، ')}</p>
                  )}
                  {e.indicator_codes?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {e.indicator_codes.map(c => <span key={c} dir="ltr" className="text-[11px] font-bold rounded-md bg-leaf-50 text-leaf-700 px-1.5 py-0.5">{c}</span>)}
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => open(e)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"><ExternalLink className="w-3.5 h-3.5" /> فتح</button>
                    <button onClick={() => setQrFor(e)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"><QrCode className="w-3.5 h-3.5" /> باركود التحقق</button>
                    <button onClick={() => remove(e)} className="mr-auto flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /> حذف</button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </Panel>
      )}
      </div>

      {qrFor && <QrModal record={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  );
}

function NewEvidence({ onCreated, presetModule = GENERAL }: { onCreated: (r: EvidenceRecord) => void; presetModule?: string }) {
  const [title, setTitle] = useState('');
  const [program, setProgram] = useState(presetModule);
  const [dateHijri, setDateHijri] = useState('');
  const [dateG, setDateG] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const codes = indicatorsForPrograms(programsOf(program));

  const submit = async () => {
    setError(''); setDone(false);
    if (!title.trim()) return setError('اكتب عنوان الشاهد');
    if (!file) return setError('اختر ملف الشاهد (صورة أو PDF)');
    setBusy(true);
    try {
      const rec = await createEvidence({
        file, title: title.trim(), module: program, category: programName(program),
        activityTitle: title.trim(), indicatorCodes: codes, dateHijri: dateHijri || undefined, dateGregorian: dateG || undefined,
      });
      onCreated(rec);
      setTitle(''); setFile(null); setDateHijri(''); setDateG(''); setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر رفع الشاهد'); }
    finally { setBusy(false); }
  };

  return (
    <Panel title="رفع شاهد جديد" className="xl:sticky xl:top-6">
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-700">عنوان الشاهد
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: لقاء تهيئة طلاب الصف الأول" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium" />
        </label>
        <label className="block text-sm font-bold text-slate-700">البرنامج أو الملف
          <select value={program} onChange={e => setProgram(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium">
            <option value={GENERAL}>عام (بدون تصنيف)</option>
            <optgroup label="برامج دليل زاد">
              {Object.entries(PROGRAM_NAMES).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </optgroup>
            {(['career', 'self_eval', 'community', 'documents'] as const).map(cat => (
              <optgroup key={cat} label={`ملفات الموجّه — ${fileModules.find(m => m.category === cat)?.categoryLabel}`}>
                {fileModules.filter(m => m.category === cat).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="rounded-xl bg-leaf-50/70 border border-leaf-100 p-3">
          <p className="text-xs font-bold text-leaf-800 mb-1.5">مؤشرات الاعتماد (تُحدد تلقائيًا من البرنامج)</p>
          {codes.length ? <div className="flex flex-wrap gap-1">{codes.map(c => <span key={c} dir="ltr" className="text-[11px] font-bold rounded-md bg-white text-leaf-700 border border-leaf-200 px-1.5 py-0.5">{c}</span>)}</div>
            : <p className="text-xs text-slate-500">اختر برنامجًا أو ملفًا مرتبطًا ببرنامج ليرتبط الشاهد بمؤشراته.</p>}
        </div>
        {criteriaForModule(program).length > 0 && (
          <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3 text-xs font-bold text-amber-800">
            يظهر تلقائيًا في الأداء الوظيفي: {criteriaForModule(program).map(id => performanceCriteria.find(c => c.id === id)?.title).join('، ')}
          </div>
        )}
        <DateField label="تاريخ الشاهد" value={dateG} onChange={(g, h) => { setDateG(g); setDateHijri(h); }} />
        <button type="button" onClick={() => input.current?.click()} className="w-full rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 hover:bg-brand-50 py-5 text-sm font-bold text-brand-800 flex flex-col items-center gap-1.5">
          <Upload className="w-6 h-6 text-brand-600" />
          {file ? <span className="text-slate-700">{file.name}</span> : 'اختر صورة أو ملف PDF (حتى 10 ميجا)'}
        </button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
        {error && <p className="text-sm text-rose-700">{error}</p>}
        {done && <p className="text-sm text-leaf-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> تم رفع الشاهد</p>}
        <button onClick={submit} disabled={busy} className="w-full rounded-xl bg-gradient-to-l from-brand-600 to-leaf-500 text-white py-3 text-sm font-extrabold shadow-md shadow-brand-600/20 disabled:opacity-60">
          {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'رفع الشاهد'}
        </button>
      </div>
    </Panel>
  );
}

function QrModal({ record, onClose }: { record: EvidenceRecord; onClose: () => void }) {
  const url = buildPublicEvidenceUrl(record.public_token);
  const [qr, setQr] = useState('');
  useEffect(() => { QRCode.toDataURL(url, { width: 360, margin: 1 }).then(setQr); }, [url]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
        <button onClick={onClose} className="absolute left-3 top-3 p-2 rounded-lg text-slate-500 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        <p className="font-extrabold text-brand-900">باركود التحقق من الشاهد</p>
        <p className="text-sm text-slate-600 mt-1">{record.title}</p>
        {qr && <img src={qr} alt="باركود" className="mx-auto mt-4 w-56 h-56" />}
        <p className="text-xs text-slate-500 mt-2">من يمسح الباركود يشاهد الشاهد فقط، بدون الدخول للمنصة.</p>
        {qr && <a href={qr} download={`evidence-${record.id.slice(0, 8)}.png`} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 text-white px-4 py-2 text-sm font-bold"><Download className="w-4 h-4" /> تنزيل الباركود</a>}
      </div>
    </div>
  );
}

