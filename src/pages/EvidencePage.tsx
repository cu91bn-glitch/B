import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Upload, Loader2, Trash2, ExternalLink, QrCode, Search, FileText, Image as ImageIcon, CheckCircle2, X, Download,
} from 'lucide-react';
import {
  createEvidence, deleteEvidence, fetchEvidence, getEvidenceUrl, buildPublicEvidenceUrl, type EvidenceRecord,
} from '@/lib/supabase';
import { PROGRAM_NAMES, indicatorsForPrograms } from '@/lib/autoIndicators';
import { Panel } from '@/components/layout/AppShell';

const GENERAL = 'general';
const programOptions = [{ id: GENERAL, name: 'عام (بدون برنامج محدد)' }, ...Object.entries(PROGRAM_NAMES).map(([id, name]) => ({ id, name }))];
const programName = (id: string) => (id === GENERAL ? 'عام' : PROGRAM_NAMES[id] || id);

export function EvidencePage() {
  const [items, setItems] = useState<EvidenceRecord[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [qrFor, setQrFor] = useState<EvidenceRecord | null>(null);

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
      <NewEvidence onCreated={rec => { setItems(prev => [rec, ...(prev || [])]); setQrFor(rec); }} />

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

      {qrFor && <QrModal record={qrFor} onClose={() => setQrFor(null)} />}
    </div>
  );
}

function NewEvidence({ onCreated }: { onCreated: (r: EvidenceRecord) => void }) {
  const [title, setTitle] = useState('');
  const [program, setProgram] = useState(GENERAL);
  const [dateHijri, setDateHijri] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const codes = program === GENERAL ? [] : indicatorsForPrograms([program]);

  const submit = async () => {
    setError(''); setDone(false);
    if (!title.trim()) return setError('اكتب عنوان الشاهد');
    if (!file) return setError('اختر ملف الشاهد (صورة أو PDF)');
    setBusy(true);
    try {
      const rec = await createEvidence({
        file, title: title.trim(), module: program, category: programName(program),
        activityTitle: title.trim(), indicatorCodes: codes, dateHijri: dateHijri || undefined,
      });
      onCreated(rec);
      setTitle(''); setFile(null); setDateHijri(''); setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر رفع الشاهد'); }
    finally { setBusy(false); }
  };

  return (
    <Panel title="رفع شاهد جديد" className="xl:sticky xl:top-6">
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-700">عنوان الشاهد
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: لقاء تهيئة طلاب الصف الأول" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium" />
        </label>
        <label className="block text-sm font-bold text-slate-700">البرنامج
          <select value={program} onChange={e => setProgram(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium">
            {programOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <div className="rounded-xl bg-leaf-50/70 border border-leaf-100 p-3">
          <p className="text-xs font-bold text-leaf-800 mb-1.5">مؤشرات الاعتماد (تُحدد تلقائيًا من البرنامج)</p>
          {codes.length ? <div className="flex flex-wrap gap-1">{codes.map(c => <span key={c} dir="ltr" className="text-[11px] font-bold rounded-md bg-white text-leaf-700 border border-leaf-200 px-1.5 py-0.5">{c}</span>)}</div>
            : <p className="text-xs text-slate-500">اختر برنامجًا ليرتبط الشاهد بمؤشراته.</p>}
        </div>
        <label className="block text-sm font-bold text-slate-700">التاريخ (اختياري)
          <input value={dateHijri} onChange={e => setDateHijri(e.target.value)} placeholder="مثال: 15/3/1448" className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium" />
        </label>
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
        <p className="text-[11px] text-slate-500 leading-5">الملفات تُحفظ في قاعدة البيانات (Supabase) مباشرة، ولا تستهلك رصيد Netlify.</p>
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

