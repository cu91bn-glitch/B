import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Plus, Trash2, Edit3, Loader2, Users, Target, Sparkles, ShieldCheck, Sprout, HeartPulse, LayoutTemplate } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { DateField } from '@/components/ui/DateField';
import { Badge, Dialog, Empty, GhostButton, LinesField, PrimaryButton, SelectField, StatCard, TextArea, TextField } from '@/components/ui/kit';
import { AutoIndicators } from '@/components/AutoIndicators';
import { deleteProgram, fetchPrograms, saveProgram, PATH_LABELS, PROGRAM_STATUS_LABELS, type ProgramPath, type ProgramRecord, type ProgramStatus } from '@/lib/store';
import { PROGRAM_NAMES, indicatorsForPrograms } from '@/lib/autoIndicators';
import { programs as programTemplates } from '@/data';
import { displayDate } from '@/lib/dates';

// ربط النماذج الجاهزة ببرامج دليل زاد
const TEMPLATE_ZAD = ['safe_net', 'career', 'absence_lag', 'positive', 'conduct', 'absence_lag', 'career', 'motivation', 'psychosocial', 'excellence', 'prevention', 'orientation'];

type Draft = {
  id?: string; title: string; path: ProgramPath; zad_program: string; target_group: string; date: string; hijri: string;
  status: ProgramStatus; description: string; objectives: string[]; activities: string[]; outcomes: string[]; beneficiaries: string;
};
const blank: Draft = { title: '', path: 'developmental', zad_program: 'orientation', target_group: '', date: '', hijri: '', status: 'planned', description: '', objectives: [], activities: [], outcomes: [], beneficiaries: '' };

const pathTone: Record<ProgramPath, { icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  preventive: { icon: ShieldCheck, cls: 'from-brand-500 to-brand-700' },
  developmental: { icon: Sprout, cls: 'from-leaf-400 to-leaf-600' },
  remedial: { icon: HeartPulse, cls: 'from-rose-400 to-rose-600' },
};

export function ProgramsPage() {
  const [items, setItems] = useState<ProgramRecord[] | null>(null);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<'all' | ProgramPath>('all');
  const [showTemplates, setShowTemplates] = useState(false);

  const load = useCallback(() => { fetchPrograms().then(setItems).catch(e => setError(e.message)); }, []);
  useEffect(load, [load]);

  const fromTemplate = (i: number) => {
    const t = programTemplates[i];
    setDraft({
      ...blank, title: t.title, path: t.category, zad_program: TEMPLATE_ZAD[i] || 'orientation', target_group: t.targetGroup,
      description: t.description, objectives: t.objectives, activities: t.activities, outcomes: [],
    });
    setShowTemplates(false); setError('');
  };

  const edit = (p: ProgramRecord) => setDraft({
    id: p.id, title: p.title, path: p.path, zad_program: p.zad_program || '', target_group: p.target_group || '', date: p.date_gregorian || '', hijri: p.date_hijri || '',
    status: p.status, description: p.description || '', objectives: p.objectives, activities: p.activities, outcomes: p.outcomes, beneficiaries: String(p.beneficiaries || ''),
  });

  const submit = async () => {
    if (!draft) return;
    if (!draft.title.trim()) return setError('اكتب اسم البرنامج');
    setBusy(true); setError('');
    const clean = (l: string[]) => l.map(x => x.trim()).filter(Boolean);
    try {
      await saveProgram({
        id: draft.id, title: draft.title.trim(), path: draft.path, zad_program: draft.zad_program || null, target_group: draft.target_group || null,
        date_gregorian: draft.date || null, date_hijri: draft.hijri || null, status: draft.status, description: draft.description || null,
        objectives: clean(draft.objectives), activities: clean(draft.activities), outcomes: clean(draft.outcomes),
        beneficiaries: Number(draft.beneficiaries) || 0, indicator_codes: indicatorsForPrograms([draft.zad_program]),
      });
      setDraft(null); load();
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحفظ'); }
    finally { setBusy(false); }
  };

  const remove = async (p: ProgramRecord) => {
    if (!confirm(`حذف برنامج «${p.title}»؟`)) return;
    try { await deleteProgram(p.id); load(); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحذف'); }
  };

  const list = useMemo(() => (items || []).filter(p => filter === 'all' || p.path === filter), [items, filter]);
  const done = items?.filter(p => p.status === 'completed').length || 0;
  const beneficiaries = items?.reduce((s, p) => s + (p.beneficiaries || 0), 0) || 0;
  const covered = new Set((items || []).flatMap(p => p.indicator_codes)).size;

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="البرامج المسجلة" value={items?.length || 0} icon={ClipboardCheck} />
        <StatCard label="برامج مكتملة" value={done} icon={Sparkles} tone="from-leaf-400 to-leaf-600" />
        <StatCard label="المستفيدون" value={beneficiaries} icon={Users} tone="from-brand-400 to-leaf-500" />
        <StatCard label="مؤشرات مغطاة" value={`${covered} / 13`} icon={Target} tone="from-amber-400 to-amber-600" />
      </div>

      <Panel
        title="البرامج الإرشادية"
        action={<div className="flex gap-2">
          <button onClick={() => setShowTemplates(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3.5 py-2.5 text-sm font-bold text-brand-800 hover:bg-brand-50"><LayoutTemplate className="w-4 h-4" /> نماذج جاهزة</button>
          <PrimaryButton onClick={() => { setDraft({ ...blank }); setError(''); }}><Plus className="w-4 h-4" /> برنامج جديد</PrimaryButton>
        </div>}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'preventive', 'developmental', 'remedial'] as const).map(k => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-3.5 py-1.5 text-xs font-bold border ${filter === k ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
              {k === 'all' ? 'كل المسارات' : PATH_LABELS[k]}
            </button>
          ))}
        </div>
        {error && !draft && <p className="text-sm text-rose-700 mb-3">{error}</p>}
        {!items ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
          : list.length === 0 ? <Empty icon={ClipboardCheck} text="لا توجد برامج بعد. ابدأ من نموذج جاهز أو أنشئ برنامجًا جديدًا." action={<button onClick={() => setShowTemplates(true)} className="text-sm font-bold text-brand-700">عرض النماذج الجاهزة</button>} />
          : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {list.map(p => {
                const T = pathTone[p.path];
                return (
                  <div key={p.id} className="rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${T.cls} text-white flex items-center justify-center shrink-0`}><T.icon className="w-5 h-5" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-brand-900 leading-7">{p.title}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge>{PATH_LABELS[p.path]}</Badge>
                          <Badge tone={p.status === 'completed' ? 'leaf' : p.status === 'in_progress' ? 'amber' : 'slate'}>{PROGRAM_STATUS_LABELS[p.status]}</Badge>
                          {p.zad_program && <Badge tone="slate">{PROGRAM_NAMES[p.zad_program]}</Badge>}
                        </div>
                      </div>
                    </div>
                    {p.description && <p className="mt-3 text-sm text-slate-700 leading-7">{p.description}</p>}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {p.objectives.length > 0 && <div><p className="font-bold text-brand-800 mb-1">الأهداف</p><ul className="list-disc pr-5 space-y-0.5 text-slate-700">{p.objectives.slice(0, 4).map(o => <li key={o}>{o}</li>)}</ul></div>}
                      {p.activities.length > 0 && <div><p className="font-bold text-brand-800 mb-1">الأنشطة</p><ul className="list-disc pr-5 space-y-0.5 text-slate-700">{p.activities.slice(0, 4).map(o => <li key={o}>{o}</li>)}</ul></div>}
                    </div>
                    {p.outcomes.length > 0 && <div className="mt-3 rounded-xl bg-leaf-50 p-3 text-sm"><p className="font-bold text-leaf-800 mb-1">النتائج</p><ul className="list-disc pr-5 text-slate-700">{p.outcomes.map(o => <li key={o}>{o}</li>)}</ul></div>}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
                      {p.target_group && <span>الفئة: {p.target_group}</span>}
                      <span>التاريخ: {displayDate(p.date_hijri, p.date_gregorian)}</span>
                      <span>المستفيدون: {p.beneficiaries}</span>
                    </div>
                    {p.indicator_codes.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{p.indicator_codes.map(c => <span key={c} dir="ltr" className="text-[11px] font-bold rounded-md bg-leaf-50 text-leaf-700 px-1.5 py-0.5">{c}</span>)}</div>}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                      <GhostButton onClick={() => edit(p)}><Edit3 className="w-3.5 h-3.5" /> تعديل وتوثيق النتائج</GhostButton>
                      <GhostButton tone="rose" className="mr-auto" onClick={() => remove(p)}><Trash2 className="w-3.5 h-3.5" /> حذف</GhostButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </Panel>

      <Dialog open={showTemplates} title="نماذج برامج جاهزة" onClose={() => setShowTemplates(false)} wide>
        <p className="text-sm text-slate-600 mb-4">اختر نموذجًا لتعبئة الأهداف والأنشطة تلقائيًا، ثم عدّل ما تريد واحفظ.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {programTemplates.map((t, i) => (
            <button key={t.id} onClick={() => fromTemplate(i)} className="text-right rounded-xl border border-slate-200 p-4 hover:border-brand-300 hover:bg-brand-50/40 transition-colors">
              <Badge>{PATH_LABELS[t.category]}</Badge>
              <p className="mt-2 font-extrabold text-brand-900 leading-7">{t.title}</p>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{t.description}</p>
            </button>
          ))}
        </div>
      </Dialog>

      <Dialog open={!!draft} title={draft?.id ? 'تعديل البرنامج' : 'برنامج جديد'} onClose={() => setDraft(null)} wide>
        {draft && (
          <div className="space-y-3.5">
            <TextField label="اسم البرنامج" required value={draft.title} onChange={v => setDraft({ ...draft, title: v })} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SelectField label="المسار" value={draft.path} onChange={v => setDraft({ ...draft, path: v as ProgramPath })} options={Object.entries(PATH_LABELS).map(([value, label]) => ({ value, label }))} />
              <SelectField label="برنامج زاد" value={draft.zad_program} onChange={v => setDraft({ ...draft, zad_program: v })} options={Object.entries(PROGRAM_NAMES).map(([value, label]) => ({ value, label }))} />
              <SelectField label="الحالة" value={draft.status} onChange={v => setDraft({ ...draft, status: v as ProgramStatus })} options={Object.entries(PROGRAM_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <TextField label="الفئة المستهدفة" value={draft.target_group} onChange={v => setDraft({ ...draft, target_group: v })} />
              <DateField label="تاريخ التنفيذ" value={draft.date} onChange={(g, h) => setDraft({ ...draft, date: g, hijri: h })} />
              <TextField label="عدد المستفيدين" type="number" value={draft.beneficiaries} onChange={v => setDraft({ ...draft, beneficiaries: v })} />
            </div>
            <TextArea label="وصف البرنامج" value={draft.description} onChange={v => setDraft({ ...draft, description: v })} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LinesField label="الأهداف" value={draft.objectives} onChange={v => setDraft({ ...draft, objectives: v })} />
              <LinesField label="الأنشطة" value={draft.activities} onChange={v => setDraft({ ...draft, activities: v })} />
            </div>
            <LinesField label="النتائج المتحققة" value={draft.outcomes} onChange={v => setDraft({ ...draft, outcomes: v })} placeholder="تُكتب بعد التنفيذ" />
            <AutoIndicators codes={indicatorsForPrograms([draft.zad_program])} />
            {error && <p className="text-sm text-rose-700">{error}</p>}
            <PrimaryButton onClick={submit} busy={busy} className="w-full py-3">حفظ البرنامج</PrimaryButton>
          </div>
        )}
      </Dialog>
    </div>
  );
}
