import { useCallback, useEffect, useRef, useState } from 'react';
import { Users, Plus, CalendarCheck, CheckCircle2, FileText, Trash2, Edit3, Upload, ExternalLink, Loader2, Megaphone } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { DateField } from '@/components/ui/DateField';
import { Badge, Dialog, Empty, GhostButton, PrimaryButton, StatCard, TextArea, TextField, SelectField } from '@/components/ui/kit';
import { AutoIndicators } from '@/components/AutoIndicators';
import { deleteMeeting, fetchEvidenceByIds, fetchMeetings, saveMeeting, uploadReport, type CouncilMeeting, type CouncilTable } from '@/lib/store';
import { getEvidenceUrl, type EvidenceRecord } from '@/lib/supabase';
import { indicatorsForPrograms } from '@/lib/autoIndicators';
import { displayDate } from '@/lib/dates';

const CONFIG: Record<CouncilTable, { title: string; programs: string[]; module: string; statuses: Record<string, string>; topicHint: string }> = {
  guidance_parent_council: {
    title: 'اجتماعات مجلس الآباء والأمهات', programs: ['family'], module: 'family',
    statuses: { scheduled: 'مجدول', completed: 'منعقد', cancelled: 'ملغى' },
    topicHint: 'مثال: متابعة المستوى الدراسي والسلوكي للطلاب',
  },
  guidance_student_council: {
    title: 'اجتماعات المجلس الطلابي', programs: ['council'], module: 'council',
    statuses: { scheduled: 'مجدول', completed: 'منعقد', implemented: 'نُفذت التوصيات', cancelled: 'ملغى' },
    topicHint: 'مثال: تطوير البيئة المدرسية والأنشطة اللاصفية',
  },
};

type Draft = { id?: string; topic: string; date: string; hijri: string; attendees: string; recommendations: string; status: string; report_evidence_id: string | null };
const emptyDraft: Draft = { topic: '', date: '', hijri: '', attendees: '', recommendations: '', status: 'completed', report_evidence_id: null };

export function CouncilPage({ table }: { table: CouncilTable }) {
  const cfg = CONFIG[table];
  const codes = indicatorsForPrograms(cfg.programs);
  const [items, setItems] = useState<CouncilMeeting[] | null>(null);
  const [reports, setReports] = useState<Record<string, EvidenceRecord>>({});
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchMeetings(table);
      setItems(list);
      setReports(await fetchEvidenceByIds(list.map(m => m.report_evidence_id).filter(Boolean) as string[]));
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر التحميل'); }
  }, [table]);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setDraft({ ...emptyDraft }); setFile(null); setError(''); };
  const openEdit = (m: CouncilMeeting) => {
    setDraft({ id: m.id, topic: m.topic, date: m.meeting_date_gregorian || '', hijri: m.meeting_date_hijri, attendees: String(m.attendees_count || ''), recommendations: m.recommendations || '', status: m.status, report_evidence_id: m.report_evidence_id });
    setFile(null); setError('');
  };

  const submit = async () => {
    if (!draft) return;
    if (!draft.topic.trim()) return setError('اكتب موضوع الاجتماع');
    if (!draft.date) return setError('اختر تاريخ الاجتماع');
    setBusy(true); setError('');
    try {
      let reportId = draft.report_evidence_id;
      if (file) {
        const ev = await uploadReport(file, `تقرير: ${draft.topic.trim()}`, cfg.module, codes, draft.hijri);
        reportId = ev.id;
      }
      await saveMeeting(table, {
        id: draft.id, topic: draft.topic.trim(), meeting_date_gregorian: draft.date, meeting_date_hijri: draft.hijri,
        attendees_count: Number(draft.attendees) || 0, recommendations: draft.recommendations.trim() || null,
        status: draft.status, status_label: cfg.statuses[draft.status], report_evidence_id: reportId, indicator_codes: codes,
      });
      setDraft(null); setFile(null); load();
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحفظ'); }
    finally { setBusy(false); }
  };

  const remove = async (m: CouncilMeeting) => {
    if (!confirm(`حذف اجتماع «${m.topic}»؟`)) return;
    try {
      await deleteMeeting(table, m.id);
      load();
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحذف'); }
  };

  const openReport = async (ev: EvidenceRecord) => {
    try { window.open(await getEvidenceUrl(ev.file_path), '_blank', 'noopener'); } catch { setError('تعذر فتح التقرير'); }
  };

  const total = items?.length || 0;
  const held = items?.filter(m => m.status !== 'scheduled' && m.status !== 'cancelled').length || 0;
  const attendees = items?.reduce((s, m) => s + (m.attendees_count || 0), 0) || 0;
  const withReports = items?.filter(m => m.report_evidence_id).length || 0;

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6 space-y-6">
      <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${table === 'guidance_parent_council' ? 'bg-brand-50 border-brand-100 text-brand-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
        {table === 'guidance_parent_council'
          ? 'هنا تُسجَّل اجتماعات أولياء الأمور فقط. اجتماعات الطلاب تُسجَّل في «صوت الطالب والتكريم».'
          : 'هنا تُسجَّل اجتماعات المجلس الطلابي فقط. اجتماعات أولياء الأمور تُسجَّل في «مجلس الآباء والأمهات».'}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="إجمالي الاجتماعات" value={total} icon={Users} />
        <StatCard label="اجتماعات منعقدة" value={held} icon={CheckCircle2} tone="from-leaf-400 to-leaf-600" />
        <StatCard label="إجمالي الحضور" value={attendees} icon={Megaphone} tone="from-brand-400 to-leaf-500" />
        <StatCard label="تقارير PDF مرفوعة" value={withReports} icon={FileText} tone="from-rose-400 to-rose-600" />
      </div>

      <Panel title={cfg.title} action={<PrimaryButton onClick={openNew}><Plus className="w-4 h-4" /> إضافة اجتماع</PrimaryButton>}>
        {error && !draft && <p className="text-sm text-rose-700 mb-3">{error}</p>}
        {!items ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          : items.length === 0 ? <Empty icon={CalendarCheck} text="لا توجد اجتماعات مسجلة بعد" action={<PrimaryButton onClick={openNew}><Plus className="w-4 h-4" /> سجّل أول اجتماع</PrimaryButton>} />
          : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {items.map(m => {
                const rep = m.report_evidence_id ? reports[m.report_evidence_id] : undefined;
                return (
                  <div key={m.id} className="rounded-xl border border-slate-200 p-4 hover:border-brand-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-extrabold text-slate-800 leading-7">{m.topic}</p>
                        <p className="text-xs font-bold text-slate-500">{displayDate(m.meeting_date_hijri, m.meeting_date_gregorian)} · الحضور {m.attendees_count}</p>
                      </div>
                      <Badge tone={m.status === 'cancelled' ? 'rose' : m.status === 'scheduled' ? 'amber' : 'leaf'}>{m.status_label}</Badge>
                    </div>
                    {m.recommendations && <p className="mt-2 text-sm text-slate-700 leading-7 whitespace-pre-wrap"><b className="text-brand-800">التوصيات: </b>{m.recommendations}</p>}
                    <div className="flex flex-wrap items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                      {rep ? <GhostButton onClick={() => openReport(rep)}><ExternalLink className="w-3.5 h-3.5" /> التقرير (PDF)</GhostButton>
                        : <span className="text-xs text-slate-400 px-2">بدون تقرير</span>}
                      <GhostButton onClick={() => openEdit(m)}><Edit3 className="w-3.5 h-3.5" /> تعديل</GhostButton>
                      <GhostButton tone="rose" className="mr-auto" onClick={() => remove(m)}><Trash2 className="w-3.5 h-3.5" /> حذف</GhostButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </Panel>

      <Dialog open={!!draft} title={draft?.id ? 'تعديل الاجتماع' : 'إضافة اجتماع'} onClose={() => setDraft(null)}>
        {draft && (
          <div className="space-y-3.5">
            <TextField label="موضوع الاجتماع" required value={draft.topic} onChange={v => setDraft({ ...draft, topic: v })} placeholder={cfg.topicHint} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DateField label="تاريخ الاجتماع" required value={draft.date} onChange={(g, h) => setDraft({ ...draft, date: g, hijri: h })} />
              <TextField label="عدد الحضور" type="number" value={draft.attendees} onChange={v => setDraft({ ...draft, attendees: v })} />
            </div>
            <SelectField label="الحالة" value={draft.status} onChange={v => setDraft({ ...draft, status: v })} options={Object.entries(cfg.statuses).map(([value, label]) => ({ value, label }))} />
            <TextArea label="التوصيات" value={draft.recommendations} onChange={v => setDraft({ ...draft, recommendations: v })} placeholder="أهم ما خرج به الاجتماع" />
            <div>
              <p className="text-sm font-bold text-slate-700 mb-1">تقرير الاجتماع (PDF)</p>
              <button type="button" onClick={() => input.current?.click()} className="w-full rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 hover:bg-brand-50 py-4 text-sm font-bold text-brand-800 flex items-center justify-center gap-2">
                <Upload className="w-5 h-5 text-brand-600" />
                {file ? file.name : draft.report_evidence_id ? 'استبدال التقرير المرفوع' : 'اختر ملف PDF أو صورة'}
              </button>
              <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={e => { setFile(e.target.files?.[0] || null); e.target.value = ''; }} />
              <p className="mt-1 text-xs text-slate-500">يُحفظ التقرير في الشواهد ويظهر تلقائيًا في مؤشرات الاعتماد والأداء الوظيفي.</p>
            </div>
            <AutoIndicators codes={codes} />
            {error && <p className="text-sm text-rose-700">{error}</p>}
            <PrimaryButton onClick={submit} busy={busy} className="w-full py-3">حفظ الاجتماع</PrimaryButton>
          </div>
        )}
      </Dialog>
    </div>
  );
}
