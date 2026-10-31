import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Trash2, Copy, Archive, Edit3, Eye, X, Check, ChevronUp, ChevronDown,
  Loader2, FileQuestion, Link2, Download, QrCode as QrIcon, AlertCircle,
  CheckCircle2, GripVertical, Settings, Send, LayoutTemplate,
} from 'lucide-react';
import QRCode from 'qrcode';
import { downloadHtmlAsPdf, brandHeader, qrCardsHtml, esc } from '@/lib/pdfExport';
import { audienceLabel } from '@/lib/labels';
import { PROGRAM_NAMES, indicatorsForPrograms } from '@/lib/autoIndicators';
import { SURVEY_TEMPLATES, buildTemplate } from '@/lib/surveyTemplates';
import { Dialog } from '@/components/ui/kit';
import {
  fetchSurveys, createSurvey, updateSurvey, deleteSurvey, duplicateSurvey, deleteSurveyResponses,
  fetchSurveyResponses,
  type SurveyDefinition, type SurveySection, type SurveySectionItem, type SurveyExtra, type SurveyDemographic,
} from '@/lib/supabase';

const likert5Labels = ['لا أوافق بشدة', 'لا أوافق', 'محايد', 'أوافق', 'أوافق بشدة'];
const trueFalseDkLabels = ['صحيح', 'خطأ', 'لا أعلم'];

function publicSurveyUrl(slug: string): string {
  return `${window.location.origin}${window.location.pathname}?r=${encodeURIComponent(slug)}`;
}

export function SurveyAdminSection() {
  const [surveys, setSurveys] = useState<SurveyDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<SurveyDefinition | null>(null);
  const [previewing, setPreviewing] = useState<SurveyDefinition | null>(null);
  const [publishing, setPublishing] = useState<SurveyDefinition | null>(null);
  const [responses, setResponses] = useState<{ survey: SurveyDefinition; list: ReturnType<typeof JSON.parse> } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSurveys();
      setSurveys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الاستبيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const [showTemplates, setShowTemplates] = useState(false);
  const [creatingTpl, setCreatingTpl] = useState('');
  const applyTemplate = async (key: string) => {
    setCreatingTpl(key);
    try {
      const created = await createSurvey({ ...buildTemplate(key), slug: `${key}-${Date.now().toString(36)}`, status: 'published' });
      setShowTemplates(false);
      await load();
      setPublishing(created);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر إنشاء الاستبيان'); }
    finally { setCreatingTpl(''); }
  };

  const handleNew = async () => {
    try {
      const created = await createSurvey({
        title: 'استبيان جديد',
        sections: [{ id: 'sec1', name: 'القسم الأول', items: [{ text: 'عبارة تجريبية' }] }],
        demographics: [{ id: 'grade', text: 'الصف', type: 'single', options: ['الأول الثانوي', 'الثاني الثانوي', 'الثالث الثانوي'] }],
      });
      setEditing(created);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء استبيان');
    }
  };

  const handleDuplicate = async (id: string) => {
    try { await duplicateSurvey(id); load(); } catch (err) { setError(err instanceof Error ? err.message : 'فشل النسخ'); }
  };

  const handleArchive = async (s: SurveyDefinition) => {
    try { await updateSurvey(s.id, { status: 'archived' }); load(); } catch (err) { setError(err instanceof Error ? err.message : 'فشل الأرشفة'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف الاستبيان وكل استجاباته نهائيًا؟')) return;
    try { await deleteSurvey(id); load(); } catch (err) { setError(err instanceof Error ? err.message : 'فشل الحذف'); }
  };

  const handleViewResponses = async (s: SurveyDefinition) => {
    try {
      const list = await fetchSurveyResponses(s.id);
      setResponses({ survey: s, list });
    } catch (err) { setError(err instanceof Error ? err.message : 'فشل تحميل الاستجابات'); }
  };

  if (editing) return <SurveyBuilder survey={editing} onClose={() => { setEditing(null); load(); }} />;
  if (previewing) return <SurveyPreview survey={previewing} onClose={() => setPreviewing(null)} />;
  if (publishing) return <PublishPanel survey={publishing} onClose={() => { setPublishing(null); load(); }} />;
  if (responses) return <ResponsesPanel survey={responses.survey} list={responses.list} onClose={() => setResponses(null)} />;

  const statusBadge: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    published: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-rose-100 text-rose-600',
  };

  return (
    <section id="survey-admin" className="py-12 bg-slate-50 scroll-mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg">
              <FileQuestion className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-cairo">إدارة الاستبيانات</h2>
              <p className="text-sm text-slate-500">إنشاء وتحرير ونشر الاستبيانات ومتابعة الاستجابات</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowTemplates(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-l from-brand-600 to-leaf-500 rounded-lg shadow-md shadow-brand-600/20">
              <LayoutTemplate className="w-4 h-4" /> نماذج الرضا والأثر الجاهزة
            </button>
            <button onClick={handleNew} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-800 bg-white border border-brand-200 hover:bg-brand-50 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> كتابة استبيان جديد
            </button>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4"><AlertCircle className="w-4 h-4" />{error}<button onClick={() => setError('')} className="mr-auto"><X className="w-4 h-4" /></button></div>}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileQuestion className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد استبيانات بعد. ابدأ بإنشاء استبيان جديد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {surveys.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-800 font-cairo flex-1">{s.title}</h3>
                  <span className={`text-[11px] rounded-full px-2.5 py-1 ${statusBadge[s.status] || statusBadge.draft}`}>{s.status === 'draft' ? 'مسودة' : s.status === 'published' ? 'منشور' : 'مؤرشف'}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">الفئة: {audienceLabel(s.audience)}</p>
                <p className="text-xs text-slate-400 mb-3">{s.sections.length} قسم · {s.sections.reduce((a, sec) => a + sec.items.length, 0)} فقرة</p>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setEditing(s)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"><Edit3 className="w-3.5 h-3.5" /> تحرير</button>
                  <button onClick={() => setPreviewing(s)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"><Eye className="w-3.5 h-3.5" /> معاينة</button>
                  <button onClick={() => setPublishing(s)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><Send className="w-3.5 h-3.5" /> نشر</button>
                  <button onClick={() => handleDuplicate(s.id)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"><Copy className="w-3.5 h-3.5" /> نسخ</button>
                  <button onClick={() => handleViewResponses(s)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"><CheckCircle2 className="w-3.5 h-3.5" /> استجابات</button>
                  {s.status !== 'archived' && <button onClick={() => handleArchive(s)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Archive className="w-3.5 h-3.5" /> أرشفة</button>}
                  <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /> حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog open={showTemplates} title="نماذج جاهزة لاستبانات الرضا وقياس الأثر" onClose={() => setShowTemplates(false)} wide>
        <p className="text-sm text-slate-600 mb-4">اختر نموذجًا، وسيُنشأ الاستبيان ويظهر لك رابطه وباركوده للنشر مباشرة. يمكنك تعديل أي فقرة لاحقًا من «تحرير».</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SURVEY_TEMPLATES.map(t => (
            <div key={t.key} className="rounded-xl border border-slate-200 p-4 hover:border-brand-300 transition-colors flex flex-col">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 ${t.kind === 'رضا' ? 'bg-brand-50 text-brand-800' : 'bg-leaf-50 text-leaf-700'}`}>{t.kind === 'رضا' ? 'قياس رضا' : 'قياس أثر'}</span>
                <span className="text-[11px] font-bold text-slate-500">{t.who} · {t.sections} محاور · {t.items} فقرة</span>
              </div>
              <p className="mt-2 font-extrabold text-brand-900 leading-7">{t.title}</p>
              <p className="text-xs text-slate-600 leading-6 mt-1 flex-1">{t.intro}</p>
              <button onClick={() => applyTemplate(t.key)} disabled={!!creatingTpl} className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-700 text-white px-3 py-2 text-sm font-bold disabled:opacity-60">
                {creatingTpl === t.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} استخدام ونشر
              </button>
            </div>
          ))}
        </div>
      </Dialog>
    </section>
  );
}

// ============ SURVEY BUILDER ============

function SurveyBuilder({ survey, onClose }: { survey: SurveyDefinition; onClose: () => void }) {
  const [draft, setDraft] = useState<SurveyDefinition>(survey);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    try {
      const hasGate = draft.publish_gate && draft.publish_gate.includes('pending');
      await updateSurvey(draft.id, draft);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setDraft(d => ({ ...d, sections: [...d.sections, { id: `sec${Date.now()}`, name: 'قسم جديد', items: [{ text: '' }] }] }));
  };
  const removeSection = (i: number) => setDraft(d => ({ ...d, sections: d.sections.filter((_, idx) => idx !== i) }));
  const moveSection = (i: number, dir: -1 | 1) => {
    setDraft(d => {
      const arr = [...d.sections];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, sections: arr };
    });
  };
  const updateSection = (i: number, patch: Partial<SurveySection>) => {
    setDraft(d => ({ ...d, sections: d.sections.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));
  };
  const addItem = (si: number) => {
    setDraft(d => ({ ...d, sections: d.sections.map((s, idx) => idx === si ? { ...s, items: [...s.items, { text: '' }] } : s) }));
  };
  const removeItem = (si: number, ii: number) => {
    setDraft(d => ({ ...d, sections: d.sections.map((s, idx) => idx === si ? { ...s, items: s.items.filter((_, j) => j !== ii) } : s) }));
  };
  const updateItem = (si: number, ii: number, patch: Partial<SurveySectionItem>) => {
    setDraft(d => ({ ...d, sections: d.sections.map((s, idx) => idx === si ? { ...s, items: s.items.map((it, j) => j === ii ? { ...it, ...patch } : it) } : s) }));
  };
  const moveItem = (si: number, ii: number, dir: -1 | 1) => {
    setDraft(d => ({
      ...d,
      sections: d.sections.map((s, idx) => {
        if (idx !== si) return s;
        const arr = [...s.items];
        const j = ii + dir;
        if (j < 0 || j >= arr.length) return s;
        [arr[ii], arr[j]] = [arr[j], arr[ii]];
        return { ...s, items: arr };
      }),
    }));
  };

  const addExtra = () => {
    setDraft(d => ({ ...d, extra: [...d.extra, { id: `extra${Date.now()}`, text: '', type: 'text' }] }));
  };
  const removeExtra = (i: number) => setDraft(d => ({ ...d, extra: d.extra.filter((_, idx) => idx !== i) }));
  const updateExtra = (i: number, patch: Partial<SurveyExtra>) => {
    setDraft(d => ({ ...d, extra: d.extra.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));
  };

  const updateSettings = (patch: Partial<typeof draft.settings>) => {
    setDraft(d => ({ ...d, settings: { ...d.settings, ...patch } }));
  };

  const totalItems = draft.sections.reduce((a, s) => a + s.items.length, 0);

  return (
    <section className="py-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-sm text-indigo-700 hover:underline">عودة</button>
            <h2 className="text-lg font-bold text-slate-800 font-cairo">تحرير الاستبيان</h2>
          </div>
          <div className="flex items-center gap-2">
            {saved && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> تم الحفظ</span>}
            <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} حفظ
            </button>
          </div>
        </div>

        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}

        {/* Meta */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700">العنوان
              <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="block mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">الفئة
              <select value={draft.audience} onChange={e => setDraft({ ...draft, audience: e.target.value })} className="block mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option value="student">طالب</option>
                <option value="parent">ولي أمر</option>
                <option value="teacher">معلم</option>
                <option value="student|parent">طالب وولي أمر</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">المقدمة
              <textarea value={draft.intro} onChange={e => setDraft({ ...draft, intro: e.target.value })} rows={2} className="block mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </label>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-slate-700 mb-1.5">البرامج المرتبطة <span className="text-xs text-slate-500">(مؤشرات الاعتماد تُحدد تلقائيًا منها)</span></p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(PROGRAM_NAMES).map(([pid, pname]) => {
                  const on = (draft.programs || []).includes(pid);
                  return <button type="button" key={pid} onClick={() => setDraft({ ...draft, programs: on ? (draft.programs || []).filter(x => x !== pid) : [...(draft.programs || []), pid] })} className={`text-xs px-2.5 py-1.5 rounded-lg border font-bold ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'}`}>{pname}</button>;
                })}
              </div>
              {(draft.programs || []).length > 0 && <p className="mt-2 text-xs text-leaf-700 font-bold">المؤشرات: <span dir="ltr">{indicatorsForPrograms(draft.programs || []).join('، ')}</span></p>}
            </div>
            <label className="text-sm font-medium text-slate-700">المعرّف (slug)
              <input value={draft.slug || ''} onChange={e => setDraft({ ...draft, slug: e.target.value })} dir="ltr" className="block mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm font-medium text-slate-700">نوع المقياس
              <select value={draft.scale.type} onChange={e => setDraft({ ...draft, scale: { type: e.target.value, labels: e.target.value === 'true_false_dk' ? trueFalseDkLabels : likert5Labels } })} className="block mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <option value="likert5">مقياس ليكرت 5 نقاط</option>
                <option value="true_false_dk">صحيح / خطأ / لا أعلم</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.settings.anonymous ?? true} onChange={e => updateSettings({ anonymous: e.target.checked })} /> مجهول الهوية</label>
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={draft.settings.one_response_per_device ?? true} onChange={e => updateSettings({ one_response_per_device: e.target.checked })} /> إجابة واحدة لكل جهاز</label>
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">المتغيرات الديموغرافية</h3>
          <div className="space-y-2">
            {draft.demographics.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={d.text} onChange={e => setDraft({ ...draft, demographics: draft.demographics.map((dd, idx) => idx === i ? { ...dd, text: e.target.value } : dd) })} placeholder="النص" className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
                <select value={d.type} onChange={e => setDraft({ ...draft, demographics: draft.demographics.map((dd, idx) => idx === i ? { ...dd, type: e.target.value } : dd) })} className="px-2 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="single">اختيار واحد</option>
                  <option value="multi">اختيار متعدد</option>
                </select>
                <input value={(d.options || []).join('، ')} onChange={e => setDraft({ ...draft, demographics: draft.demographics.map((dd, idx) => idx === i ? { ...dd, options: e.target.value.split('،').map(s => s.trim()).filter(Boolean) } : dd) })} placeholder="الخيارات مفصولة بفاصلة" className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
                <button onClick={() => setDraft({ ...draft, demographics: draft.demographics.filter((_, idx) => idx !== i) })} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={() => setDraft({ ...draft, demographics: [...draft.demographics, { id: `demo${Date.now()}`, text: '', type: 'single', options: [] }] })} className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> إضافة متغير</button>
          </div>
        </div>

        {/* Sections & Items */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">الأقسام والفقرات ({totalItems} فقرة)</h3>
            <button onClick={addSection} className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> قسم جديد</button>
          </div>
          <div className="space-y-4">
            {draft.sections.map((sec, si) => (
              <div key={si} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  <input value={sec.name} onChange={e => updateSection(si, { name: e.target.value })} className="flex-1 px-3 py-1.5 text-sm font-medium bg-slate-50 border border-slate-200 rounded-lg" />
                  <select value={sec.swot_axis || ''} onChange={e => updateSection(si, { swot_axis: e.target.value || undefined })} className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                    <option value="">— SWOT —</option>
                    <option value="internal">داخلي</option>
                    <option value="external">خارجي</option>
                  </select>
                  <button onClick={() => moveSection(si, -1)} className="p-1 text-slate-400 hover:text-slate-600"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveSection(si, 1)} className="p-1 text-slate-400 hover:text-slate-600"><ChevronDown className="w-4 h-4" /></button>
                  <button onClick={() => removeSection(si)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="space-y-2">
                  {sec.items.map((item, ii) => (
                    <div key={ii} className="flex items-start gap-2">
                      <div className="flex flex-col">
                        <button onClick={() => moveItem(si, ii, -1)} className="p-0.5 text-slate-300 hover:text-slate-500"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={() => moveItem(si, ii, 1)} className="p-0.5 text-slate-300 hover:text-slate-500"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                      <input value={item.text} onChange={e => updateItem(si, ii, { text: e.target.value })} placeholder="نص الفقرة" className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
                      <label className="flex items-center gap-1 text-xs text-slate-500 pt-2"><input type="checkbox" checked={item.reverse ?? false} onChange={e => updateItem(si, ii, { reverse: e.target.checked })} /> عكسية</label>
                      <button onClick={() => removeItem(si, ii)} className="p-1 pt-2 text-slate-400 hover:text-rose-600"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => addItem(si)} className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> فقرة</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extra questions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">أسئلة إضافية</h3>
            <button onClick={addExtra} className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3" /> إضافة</button>
          </div>
          <div className="space-y-2">
            {draft.extra.map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={ex.text} onChange={e => updateExtra(i, { text: e.target.value })} placeholder="النص" className="flex-1 px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
                <select value={ex.type} onChange={e => updateExtra(i, { type: e.target.value })} className="px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="text">نص حر</option>
                  <option value="nps">NPS (0-10)</option>
                  <option value="optin_contact">موافقة تواصل</option>
                  <option value="matrix_importance">أهمية</option>
                  <option value="multi">اختيار متعدد</option>
                </select>
                <button onClick={() => removeExtra(i)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ PREVIEW ============

function SurveyPreview({ survey, onClose }: { survey: SurveyDefinition; onClose: () => void }) {
  return (
    <section className="py-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={onClose} className="text-sm text-indigo-700 hover:underline mb-4">عودة</button>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8">
          <h1 className="text-xl font-bold text-slate-800 font-cairo">{survey.title}</h1>
          <p className="text-sm text-slate-600 mt-2 leading-7">{survey.intro}</p>
          <div className="mt-6 space-y-5">
            {survey.sections.map(sec => (
              <fieldset key={sec.id} className="rounded-xl border border-slate-200 p-4">
                <legend className="px-2 text-sm font-bold text-slate-800">{sec.name}</legend>
                {sec.items.map((item, i) => (
                  <div key={i} className="py-3 border-b last:border-0 border-slate-100">
                    <p className="text-sm text-slate-700 leading-7">{item.text}</p>
                    <div className="grid grid-cols-5 gap-1.5 mt-2">
                      {survey.scale.labels.map((label, vi) => (
                        <button key={label} className="min-h-10 rounded-lg border border-slate-200 bg-slate-50 px-1 text-[11px] text-slate-600" title={label}>{vi + 1}</button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{survey.scale.labels.join(' · ')}</p>
                  </div>
                ))}
              </fieldset>
            ))}
          </div>
          <div className="w-full mt-6 rounded-lg bg-slate-100 py-3 text-center text-sm text-slate-400">معاينة فقط - لا يمكن الإرسال</div>
        </div>
      </div>
    </section>
  );
}

// ============ PUBLISH PANEL ============

function PublishPanel({ survey, onClose }: { survey: SurveyDefinition; onClose: () => void }) {
  const [slug, setSlug] = useState(survey.slug || survey.title.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `survey-${Date.now()}`);
  const [qrUrl, setQrUrl] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const gateLocked = Boolean(survey.publish_gate && survey.publish_gate.includes('pending'));
  const url = publicSurveyUrl(slug);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 300, margin: 1 }).then(setQrUrl).catch(() => {});
  }, [url]);

  const publish = async () => {
    if (gateLocked) { setError('لا يمكن النشر: مفاتيح الإجابة غير مدخلة لهذا الاستبيان'); return; }
    setPublishing(true);
    try {
      await updateSurvey(survey.id, { slug, status: 'published' });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل النشر');
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const printLabelPdf = async () => {
    const html = `
      ${brandHeader('ملصق استبيان')}
      <div data-pdf-block style="text-align:center; padding:24px 20px;">
        <div style="font-size:26px; font-weight:800; color:#10324a; line-height:1.5;">${esc(survey.title)}</div>
        <div style="font-size:14px; color:#475569; line-height:1.9; margin:12px auto 0; max-width:600px;">${esc(survey.intro)}</div>
        ${qrUrl ? `<img src="${qrUrl}" style="width:260px; height:260px; display:block; margin:26px auto 12px;" />` : ''}
        <div style="font-size:16px; font-weight:700; color:#0e7490;">امسح الرمز للإجابة على الاستبيان</div>
        <div style="font-size:11px; color:#94a3b8; direction:ltr; margin-top:8px; word-break:break-all;">${esc(url)}</div>
      </div>`;
    await downloadHtmlAsPdf(html, `survey-label-${slug}.pdf`);
  };

  const printCardsPdf = async () => {
    const cards = Array.from({ length: 8 }, () => ({ title: survey.title, subtitle: 'امسح الرمز للإجابة', qrDataUrl: qrUrl || undefined, url }));
    await downloadHtmlAsPdf(qrCardsHtml(cards), `survey-cards-${slug}.pdf`);
  };


  return (
    <section className="py-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={onClose} className="text-sm text-indigo-700 hover:underline mb-4">عودة</button>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8">
          <h2 className="text-lg font-bold text-slate-800 font-cairo mb-4">نشر الاستبيان</h2>

          {gateLocked && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-4">
              <AlertCircle className="w-5 h-5" />
              هذا الاستبيان يتطلب مفاتيح إجابة قبل النشر (publish_gate).
            </div>
          )}
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4"><AlertCircle className="w-4 h-4" />{error}</div>}
          {done && <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 mb-4"><CheckCircle2 className="w-5 h-5" /> تم نشر الاستبيان بنجاح.</div>}

          <label className="block text-sm font-medium text-slate-700 mb-1.5">المعرّف (slug)
            <input value={slug} onChange={e => setSlug(e.target.value)} dir="ltr" className="block mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </label>

          {qrUrl && <div className="text-center my-4"><img src={qrUrl} alt="باركود الاستبيان" className="mx-auto w-48 h-48 bg-white p-2 rounded-lg border border-slate-100" /></div>}

          <div className="flex items-center gap-2 mb-4">
            <input readOnly value={url} dir="ltr" className="min-w-0 flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs" />
            <button onClick={copyLink} className="p-2 rounded-lg bg-white border border-slate-200 text-indigo-700" title="نسخ">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}</button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={publish} disabled={publishing || gateLocked} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} نشر الآن
            </button>
            <button onClick={printLabelPdf} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"><Download className="w-4 h-4" /> ملصق PDF</button>
            <button onClick={printCardsPdf} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"><QrIcon className="w-4 h-4" /> بطاقات توزيع</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============ RESPONSES PANEL ============

function ResponsesPanel({ survey, list: initial, onClose }: { survey: SurveyDefinition; list: Array<{ id: string; demographics: Record<string, string>; answers: Record<string, number>; text_answers: Record<string, string>; submitted_at: string }>; onClose: () => void }) {
  const [list, setList] = useState(initial);
  const [err, setErr] = useState('');
  const clearAll = async () => {
    if (!confirm(`حذف كل إجابات «${survey.title}» (${list.length}) نهائيًا؟`)) return;
    try { await deleteSurveyResponses(survey.id); setList([]); } catch (e) { setErr(e instanceof Error ? e.message : 'تعذر الحذف'); }
  };
  return (
    <section className="py-8 bg-slate-50 min-h-screen" dir="rtl">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={onClose} className="text-sm text-indigo-700 hover:underline mb-4">عودة</button>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-800 font-cairo mb-2">{survey.title}</h2>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-slate-500">{list.length} استجابة</p>
            {list.length > 0 && <button onClick={clearAll} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold"><Trash2 className="w-3.5 h-3.5" /> حذف كل الإجابات</button>}
          </div>
          {err && <p className="text-sm text-rose-700 mb-3">{err}</p>}
          {list.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>لا توجد استجابات بعد</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-slate-200">
                  <th className="text-right p-2 text-slate-600">الوقت</th>
                  {survey.demographics.map(d => <th key={d.id} className="text-right p-2 text-slate-600">{d.text}</th>)}
                  <th className="text-right p-2 text-slate-600">عدد الإجابات</th>
                </tr></thead>
                <tbody>
                  {list.map((r, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="p-2 text-slate-500">{new Date(r.submitted_at).toLocaleString('ar-SA')}</td>
                      {survey.demographics.map(d => <td key={d.id} className="p-2 text-slate-700">{r.demographics?.[d.id] || '—'}</td>)}
                      <td className="p-2 text-slate-700">{Object.keys(r.answers || {}).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
