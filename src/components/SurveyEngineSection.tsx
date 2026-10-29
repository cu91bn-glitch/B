import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Copy, ExternalLink, FileQuestion, Link2, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { submitAnonymousSurveyResponse } from '@/lib/supabase';
import surveySpec from '../../seed/surveys_spec.json';

type SurveyItem = { text: string; reverse?: boolean };
type SurveySection = { id: string; name: string; items: SurveyItem[]; if_low?: string[] };
type SurveyExtra = { id: string; text: string; type: string; options?: string[] };
type SurveyConfig = {
  id: string;
  title: string;
  status: string;
  audience: string;
  intro: string;
  repeat?: string;
  scale: { type: string; labels: string[] };
  demographics?: { id: string; text: string; options?: string[] }[];
  sections: SurveySection[];
  extra?: SurveyExtra[];
};
type SurveySpec = { surveys: SurveyConfig[] };

const riskTerms = ['انتحار', 'إيذاء النفس', 'قتل', 'اعتداء', 'تحرش', 'تهديد', 'عنف شديد'];

async function getFingerprint(): Promise<string> {
  const key = 'guidance-anonymous-response-device';
  let deviceToken = localStorage.getItem(key);
  if (!deviceToken) {
    deviceToken = crypto.randomUUID();
    localStorage.setItem(key, deviceToken);
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(deviceToken));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function publicSurveyUrl(id: string): string {
  return `${window.location.origin}${window.location.pathname}?survey=${encodeURIComponent(id)}`;
}

export function SurveyEngineSection() {
  const [spec, setSpec] = useState<SurveySpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [activeSurvey, setActiveSurvey] = useState<SurveyConfig | null>(null);
  const [showLinkFor, setShowLinkFor] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const data = surveySpec as SurveySpec;
      setSpec(data);
      const requested = new URLSearchParams(window.location.search).get('survey');
      const initial = data.surveys.find(survey => survey.id === requested);
      if (initial) { setSelectedId(initial.id); setActiveSurvey(initial); }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'تعذر تحميل الاستبيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  const openLink = async (id: string) => {
    const url = publicSurveyUrl(id);
    setShowLinkFor(id);
    setQrUrl(await QRCode.toDataURL(url, { width: 220, margin: 1 }));
  };

  const copyLink = async (id: string) => {
    await navigator.clipboard.writeText(publicSurveyUrl(id));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (loading) return <section id="surveys" className="py-12"><div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div></section>;
  if (loadError || !spec) return <section id="surveys" className="py-12"><div className="max-w-7xl mx-auto px-4 text-red-700">{loadError || 'لا توجد إعدادات استبيانات'}</div></section>;
  if (activeSurvey) return <SurveyForm survey={activeSurvey} onBack={() => setActiveSurvey(null)} />;

  return (
    <section id="surveys" className="py-12 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600 to-sky-700 flex items-center justify-center shadow-lg"><FileQuestion className="w-6 h-6 text-white" /></div>
          <div><h2 className="text-xl font-bold text-slate-800 font-cairo">محرك الاستبيانات المجهولة</h2><p className="text-sm text-slate-500">استبيانات مبنية من ملفات الإعداد، برابط مباشر وباركود</p></div>
        </div>
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900"><ShieldCheck className="w-5 h-5 shrink-0 text-cyan-700" /><p>الإجابة مجهولة افتراضيًا: لا يتم حفظ الاسم أو رقم الهوية أو عنوان IP. يحفظ النظام الصف وبصمة تجزئة لمنع تكرار الإرسال فقط.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {spec.surveys.map(survey => (
            <div key={survey.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-800 font-cairo">{survey.title}</h3><p className="text-xs text-slate-400 mt-1">{survey.repeat || 'غير مذكور'}</p></div><span className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1">{survey.status}</span></div>
              <p className="text-sm text-slate-600 leading-7 mt-3">{survey.intro}</p>
              <div className="flex flex-wrap gap-2 mt-4"><button onClick={() => { setSelectedId(survey.id); setActiveSurvey(survey); }} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-lg bg-cyan-700 text-white py-2.5 text-sm font-bold hover:bg-cyan-800"><ArrowRight className="w-4 h-4" /> فتح الاستبيان</button><button onClick={() => openLink(survey.id)} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"><QrCode className="w-4 h-4" /> الرابط والباركود</button></div>
              {showLinkFor === survey.id && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center"><img src={qrUrl} alt={`باركود ${survey.title}`} className="mx-auto w-44 h-44 bg-white p-2 rounded-lg" /><div className="flex items-center gap-2 mt-3"><input readOnly value={publicSurveyUrl(survey.id)} className="min-w-0 flex-1 bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-left" dir="ltr" /><button onClick={() => copyLink(survey.id)} className="p-2 rounded-lg bg-white border border-slate-200 text-cyan-700" title="نسخ الرابط">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button></div><a href={publicSurveyUrl(survey.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-700 mt-3"><ExternalLink className="w-3.5 h-3.5" /> فتح الرابط العام</a></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SurveyForm({ survey, onBack }: { survey: SurveyConfig; onBack: () => void }) {
  const [grade, setGrade] = useState('');
  const [wave, setWave] = useState<'pre' | 'post' | 'single'>('single');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [riskFound, setRiskFound] = useState(false);
  const gradeOptions = survey.demographics?.find(item => item.id === 'grade')?.options || [];
  const allItems = useMemo(() => survey.sections.flatMap(section => section.items.map((item, index) => ({ key: `${section.id}-${index}`, section, item }))), [survey]);
  const unanswered = allItems.filter(({ key }) => answers[key] === undefined).length;

  const submit = async () => {
    if (!grade || unanswered > 0) { setMessage('يرجى اختيار الصف والإجابة عن جميع العبارات'); return; }
    const freeText = Object.values(extras).join(' ').trim();
    const hasRisk = riskTerms.some(term => freeText.includes(term));
    if (hasRisk) { setRiskFound(true); return; }
    try {
      setSubmitting(true);
      const sectionScores: Record<string, number> = {};
      for (const section of survey.sections) {
        const scores = section.items.map((item, index) => { const value = answers[`${section.id}-${index}`]; return item.reverse ? 6 - value : value; });
        sectionScores[section.id] = scores.reduce((sum, value) => sum + value, 0) / scores.length;
      }
      await submitAnonymousSurveyResponse({ survey_id: survey.id, wave, grade, response_fingerprint: await getFingerprint(), answers, section_scores: sectionScores, extra_answers: extras });
      setMessage('تم تسجيل إجابتك بشكل مجهول. شكرًا لمشاركتك.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر حفظ الإجابة'); } finally { setSubmitting(false); }
  };

  return <section className="py-10 bg-slate-50 min-h-[70vh]" dir="rtl"><div className="max-w-3xl mx-auto px-4"><button onClick={onBack} className="text-sm text-cyan-700 mb-4">العودة إلى قائمة الاستبيانات</button><div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-8"><div className="flex items-start gap-3 border-b border-slate-100 pb-5"><div className="w-11 h-11 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center"><FileQuestion className="w-5 h-5" /></div><div><h1 className="text-xl font-bold text-slate-800 font-cairo">{survey.title}</h1><p className="text-sm text-slate-600 leading-7 mt-1">{survey.intro}</p></div></div><div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4"><label className="text-sm font-medium text-slate-700">الصف<select required value={grade} onChange={event => setGrade(event.target.value)} className="block mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><option value="">اختر الصف</option>{gradeOptions.map(option => <option key={option}>{option}</option>)}</select></label><label className="text-sm font-medium text-slate-700">نوع التطبيق<select value={wave} onChange={event => setWave(event.target.value as typeof wave)} className="block mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"><option value="single">تطبيق واحد</option><option value="pre">قبلي</option><option value="post">بعدي</option></select></label></div><div className="mt-6 space-y-5">{survey.sections.map(section => <fieldset key={section.id} className="rounded-xl border border-slate-200 p-4"><legend className="px-2 text-sm font-bold text-slate-800">{section.name}</legend>{section.items.map((item, index) => { const key = `${section.id}-${index}`; return <div key={key} className="py-3 border-b last:border-0 border-slate-100"><p className="text-sm text-slate-700 leading-7">{item.text}</p><div className="grid grid-cols-5 gap-1.5 mt-2">{survey.scale.labels.map((label, valueIndex) => <button type="button" key={label} onClick={() => setAnswers(previous => ({ ...previous, [key]: valueIndex + 1 }))} className={`min-h-10 rounded-lg border px-1 text-[11px] transition-colors ${answers[key] === valueIndex + 1 ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-cyan-50'}`} title={label}>{valueIndex + 1}</button>)}</div><p className="text-[11px] text-slate-400 mt-1">{survey.scale.labels.join(' · ')}</p></div>; })}</fieldset>)}</div>{survey.extra?.filter(extra => extra.type === 'text').map(extra => <label key={extra.id} className="block mt-4 text-sm font-medium text-slate-700">{extra.text}<textarea value={extras[extra.id] || ''} onChange={event => setExtras(previous => ({ ...previous, [extra.id]: event.target.value }))} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" /></label>)}{riskFound && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><div className="flex items-center gap-2 font-bold"><AlertTriangle className="w-5 h-5" /> نحتاج إلى دعمك</div><p className="mt-2 leading-7">ظهر في النص ما قد يشير إلى حاجة عاجلة للدعم. لم يتم إرسال النص. تواصل مباشرة مع الموجه الطلابي أو قنوات الدعم المعتمدة في المدرسة.</p></div>}{message && !riskFound && <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />{message}</div>}<button onClick={submit} disabled={submitting || Boolean(message && message.startsWith('تم تسجيل'))} className="w-full mt-6 rounded-lg bg-cyan-700 py-3 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-50">{submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إرسال الإجابة المجهولة'}</button></div></div></section>;
}
