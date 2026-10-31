import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Megaphone, Send, Loader2, Copy, CheckCircle2, Download, Upload, Image as ImageIcon, FileText, Trash2, ExternalLink } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { DateField } from '@/components/ui/DateField';
import { Dialog, PrimaryButton, TextField } from '@/components/ui/kit';
import { buildTemplate } from '@/lib/surveyTemplates';
import { createSurvey, createEvidence, deleteEvidence, fetchEvidence, fetchSurveys, getEvidenceUrl, type EvidenceRecord, type SurveyDefinition } from '@/lib/supabase';
import { indicatorsForModule } from '@/lib/linkage';
import { displayDate } from '@/lib/dates';

/** استبانة صوت الطالب: إنشاء ونشر بضغطة، ثم رابط وباركود ثابت */
export function VoiceSurveyCard() {
  const [survey, setSurvey] = useState<SurveyDefinition | null | undefined>(undefined);
  const [qr, setQr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetchSurveys().then(list => setSurvey(list.find(s => s.title === 'استبانة صوت الطالب' && s.status === 'published') || null)).catch(() => setSurvey(null));
  }, []);
  const url = survey ? `${window.location.origin}/?r=${encodeURIComponent(survey.slug || '')}` : '';
  useEffect(() => { if (url) QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQr); }, [url]);

  const publish = async () => {
    setBusy(true); setErr('');
    try { setSurvey(await createSurvey({ ...buildTemplate('student_voice'), slug: `student-voice-${Date.now().toString(36)}`, status: 'published' })); }
    catch (e) { setErr(e instanceof Error ? e.message : 'تعذر النشر'); } finally { setBusy(false); }
  };

  return (
    <Panel title="استبانة صوت الطالب">
      {survey === undefined ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        : !survey ? (
          <div className="text-center py-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center"><Megaphone className="w-7 h-7" /></div>
            <p className="mt-3 text-sm text-slate-600 leading-7">استبانة جاهزة من 4 محاور (البيئة المدرسية، العلاقة مع المعلمين، الأنشطة، التوجيه) وسؤال مفتوح للمقترحات.</p>
            {err && <p className="text-sm text-rose-700 mt-2">{err}</p>}
            <PrimaryButton onClick={publish} busy={busy} className="mt-4"><Send className="w-4 h-4" /> نشر الاستبانة الآن</PrimaryButton>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {qr && <img src={qr} alt="باركود صوت الطالب" className="w-40 h-40 rounded-xl border border-slate-200 p-2" />}
            <div className="flex-1 w-full">
              <p className="text-sm font-bold text-leaf-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> منشورة ومتاحة للطلاب</p>
              <p className="text-xs text-slate-500 mt-1">النتائج والتحليل في «التحليل والتقارير».</p>
              <div className="flex items-center gap-2 mt-3 bg-slate-50 border border-slate-200 rounded-xl p-2">
                <input readOnly value={url} dir="ltr" className="flex-1 min-w-0 bg-transparent text-xs text-slate-600 outline-none" />
                <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-2 rounded-lg bg-white border border-slate-200 text-brand-700">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
              </div>
              {qr && <a href={qr} download="student-voice-qr.png" className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700"><Download className="w-4 h-4" /> تنزيل الباركود</a>}
            </div>
          </div>
        )}
    </Panel>
  );
}

/** تقارير وصور التكريم: تُحفظ شواهد وتظهر في الاعتماد والأداء الوظيفي */
export function HonorReports() {
  const [list, setList] = useState<EvidenceRecord[] | null>(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const load = useCallback(() => { fetchEvidence('honor').then(setList).catch(() => setList([])); }, []);
  useEffect(load, [load]);
  const view = async (e: EvidenceRecord) => { try { window.open(await getEvidenceUrl(e.file_path), '_blank', 'noopener'); } catch { setErr('تعذر فتح الملف'); } };
  const remove = async (e: EvidenceRecord) => {
    if (!confirm(`حذف «${e.title}»؟`)) return;
    try { await deleteEvidence(e.id, e.file_path); setList(l => (l || []).filter(x => x.id !== e.id)); } catch { setErr('تعذر الحذف'); }
  };
  return (
    <Panel title="تقارير وصور التكريم" action={<PrimaryButton onClick={() => setOpen(true)}><Upload className="w-4 h-4" /> رفع تقرير أو صور</PrimaryButton>}>
      {err && <p className="text-sm text-rose-700 mb-2">{err}</p>}
      {!list ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        : list.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">لم يُرفع أي تقرير تكريم بعد.</p>
        : (
          <div className="space-y-1.5">
            {list.map(e => (
              <div key={e.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                {e.file_type === 'pdf' ? <FileText className="w-4 h-4 text-rose-600" /> : <ImageIcon className="w-4 h-4 text-brand-600" />}
                <span className="flex-1 truncate font-bold text-slate-700">{e.title}</span>
                <span className="text-xs text-slate-500 whitespace-nowrap">{displayDate(e.evidence_date_hijri, e.evidence_date_gregorian, e.created_at)}</span>
                <button onClick={() => view(e)} className="p-1 text-brand-700"><ExternalLink className="w-4 h-4" /></button>
                <button onClick={() => remove(e)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      <HonorUpload open={open} onClose={() => setOpen(false)} onDone={() => { setOpen(false); load(); }} />
    </Panel>
  );
}

function HonorUpload({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [hijri, setHijri] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setTitle(''); setFiles([]); setDate(''); setHijri(''); setErr(''); } }, [open]);
  const submit = async () => {
    if (!title.trim()) return setErr('اكتب عنوان التكريم');
    if (!files.length) return setErr('اختر ملفًا أو أكثر');
    setBusy(true); setErr('');
    try {
      for (const [i, f] of files.entries()) {
        await createEvidence({ file: f, title: files.length > 1 ? `${title.trim()} (${i + 1})` : title.trim(), module: 'honor', category: 'إطار الاحتفاء والتكريم', activityTitle: title.trim(), indicatorCodes: indicatorsForModule('honor'), dateHijri: hijri || undefined, dateGregorian: date || undefined });
      }
      onDone();
    } catch (e) { setErr(e instanceof Error ? e.message : 'تعذر الرفع'); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} title="رفع تقرير أو صور تكريم" onClose={onClose}>
      <div className="space-y-3.5">
        <TextField label="عنوان التكريم" required value={title} onChange={setTitle} placeholder="مثال: حفل تكريم المتفوقين للفصل الأول" />
        <DateField label="تاريخ التكريم" value={date} onChange={(g, h) => { setDate(g); setHijri(h); }} />
        <button type="button" onClick={() => input.current?.click()} className="w-full rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 hover:bg-brand-50 py-5 text-sm font-bold text-brand-800 flex flex-col items-center gap-1.5">
          <Upload className="w-6 h-6 text-brand-600" />{files.length ? `${files.length} ملف مختار` : 'اختر صورًا أو ملف PDF (يمكن اختيار أكثر من ملف)'}
        </button>
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={e => { setFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
        <p className="text-xs text-slate-500">تُحفظ في الشواهد وتظهر تلقائيًا في مؤشرات الاعتماد والأداء الوظيفي (معيار تعزيز التفوق).</p>
        {err && <p className="text-sm text-rose-700">{err}</p>}
        <PrimaryButton onClick={submit} busy={busy} className="w-full py-3">رفع</PrimaryButton>
      </div>
    </Dialog>
  );
}
