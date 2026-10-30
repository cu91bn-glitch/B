import { useEffect, useState, useCallback } from 'react';
import {
  Loader2, CheckCircle2, AlertCircle, ChevronRight, ArrowRight,
} from 'lucide-react';
import {
  fetchSurveyBySlug, submitSurveyResponse,
  type SurveyDefinition,
} from '@/lib/supabase';
import { Logo } from '@/components/Logo';

const storagePrefix = 'survey-draft-';
const riskTerms = ['انتحار', 'إيذاء النفس', 'قتل', 'اعتداء', 'تحرش', 'تهديد', 'عنف شديد'];

async function getFingerprint(): Promise<string> {
  const key = 'guidance-survey-device-token';
  let token = localStorage.getItem(key);
  if (!token) { token = crypto.randomUUID(); localStorage.setItem(key, token); }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function PublicSurveyPage({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [survey, setSurvey] = useState<SurveyDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demographics, setDemographics] = useState<Record<string, string>>({});
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [riskFound, setRiskFound] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const draftKey = `${storagePrefix}${slug}`;

  const load = useCallback(async () => {
    try {
      const data = await fetchSurveyBySlug(slug);
      if (!data) { setError('الاستبيان غير موجود أو غير منشور'); return; }
      if (data.status !== 'published') { setError('هذا الاستبيان غير متاح للإجابة حاليًا'); return; }
      setSurvey(data);
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.demographics) setDemographics(parsed.demographics);
          if (parsed.answers) setAnswers(parsed.answers);
          if (parsed.textAnswers) setTextAnswers(parsed.textAnswers);
        } catch { /* ignore */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الاستبيان');
    } finally {
      setLoading(false);
    }
  }, [slug, draftKey]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (survey) {
      localStorage.setItem(draftKey, JSON.stringify({ demographics, answers, textAnswers }));
    }
  }, [survey, draftKey, demographics, answers, textAnswers]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <div className="max-w-md text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-rose-400" />
        <p className="text-slate-700">{error}</p>
        <button onClick={onClose} className="mt-4 text-sm text-indigo-700 hover:underline">العودة</button>
      </div>
    </div>
  );
  if (!survey) return null;
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" dir="rtl">
      <div className="max-w-md text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-emerald-500" />
        <h2 className="text-lg font-bold text-slate-800 font-cairo">تم تسجيل إجابتك</h2>
        <p className="text-sm text-slate-600 mt-2 leading-7">شكرًا لمشاركتك. إجابتك مجهولة الهوية وقد سُجّلت بنجاح.</p>
        <button onClick={() => { localStorage.removeItem(draftKey); onClose(); }} className="mt-5 px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">تم</button>
      </div>
    </div>
  );

  const allItems = survey.sections.flatMap(sec => sec.items.map((item, i) => ({ key: `${sec.id}-${i}`, item })));
  const answeredCount = allItems.filter(({ key }) => answers[key] !== undefined).length;
  const progress = allItems.length > 0 ? Math.round((answeredCount / allItems.length) * 100) : 0;
  const allDemographicsFilled = survey.demographics.every(d => demographics[d.id]);
  const allAnswered = answeredCount === allItems.length;

  const submit = async () => {
    if (honeypot) return;
    if (!allDemographicsFilled || !allAnswered) { setSubmitError('يرجى إكمال جميع الحقول والإجابة عن جميع العبارات'); return; }
    const freeText = Object.values(textAnswers).join(' ').trim();
    if (riskTerms.some(term => freeText.includes(term))) { setRiskFound(true); return; }
    try {
      setSubmitting(true);
      const fp = survey.settings.one_response_per_device ? await getFingerprint() : undefined;
      await submitSurveyResponse({ survey_id: survey.id, demographics, answers, text_answers: textAnswers, response_fingerprint: fp });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'تعذر حفظ الإجابة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"><ChevronRight className="w-3.5 h-3.5" /> العودة للموقع</button>
          <Logo variant="full" size={40} />
        </div>

        {/* Progress bar */}
        <div className="sticky top-0 z-10 bg-slate-50 pt-2 pb-3">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-1 text-center">{answeredCount} من {allItems.length} ({progress}%)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h1 className="text-lg font-bold text-slate-800 font-cairo">{survey.title}</h1>
          <p className="text-sm text-slate-600 mt-2 leading-7">{survey.intro}</p>
          {survey.settings.anonymous && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
              <CheckCircle2 className="w-4 h-4" /> إجابتك مجهولة الهوية تمامًا — لا يُحفظ الاسم أو رقم الهوية أو عنوان IP.
            </div>
          )}

          {/* Honeypot */}
          <input type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

          {/* Demographics */}
          {survey.demographics.length > 0 && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {survey.demographics.map(d => (
                <label key={d.id} className="text-sm font-medium text-slate-700">{d.text}
                  <select value={demographics[d.id] || ''} onChange={e => setDemographics(prev => ({ ...prev, [d.id]: e.target.value }))} className="block mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <option value="">اختر</option>
                    {(d.options || []).map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </label>
              ))}
            </div>
          )}

          {/* Sections */}
          <div className="mt-6 space-y-4">
            {survey.sections.map(sec => (
              <fieldset key={sec.id} className="rounded-xl border border-slate-200 p-4">
                <legend className="px-2 text-sm font-bold text-slate-800">{sec.name}</legend>
                {sec.items.map((item, i) => {
                  const key = `${sec.id}-${i}`;
                  return (
                    <div key={key} className="py-3 border-b last:border-0 border-slate-100">
                      <p className="text-sm text-slate-700 leading-7">{item.text}</p>
                      <div className="grid grid-cols-5 gap-1.5 mt-2">
                        {survey.scale.labels.map((label, vi) => (
                          <button key={label} type="button" onClick={() => setAnswers(prev => ({ ...prev, [key]: vi + 1 }))}
                            className={`min-h-10 rounded-lg border px-1 text-[11px] transition-colors ${answers[key] === vi + 1 ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                            title={label}>{vi + 1}</button>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{survey.scale.labels.join(' · ')}</p>
                    </div>
                  );
                })}
              </fieldset>
            ))}
          </div>

          {/* Extra questions */}
          {survey.extra.filter(e => e.type === 'text').map(ex => (
            <label key={ex.id} className="block mt-4 text-sm font-medium text-slate-700">{ex.text}
              <textarea value={textAnswers[ex.id] || ''} onChange={e => setTextAnswers(prev => ({ ...prev, [ex.id]: e.target.value }))} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
            </label>
          ))}

          {survey.extra.filter(e => e.type === 'nps').map(ex => (
            <label key={ex.id} className="block mt-4 text-sm font-medium text-slate-700">{ex.text}
              <input type="range" min={0} max={10} value={textAnswers[ex.id] || '5'} onChange={e => setTextAnswers(prev => ({ ...prev, [ex.id]: e.target.value }))} className="mt-2 w-full" />
              <p className="text-center text-lg font-bold text-indigo-700 mt-1">{textAnswers[ex.id] || '5'}</p>
            </label>
          ))}

          {survey.extra.filter(e => e.type === 'optin_contact').map(ex => (
            <label key={ex.id} className="flex items-center gap-2 mt-4 text-sm text-slate-700">
              <input type="checkbox" checked={textAnswers[ex.id] === 'yes'} onChange={e => setTextAnswers(prev => ({ ...prev, [ex.id]: e.target.checked ? 'yes' : '' }))} />
              {ex.text}
            </label>
          ))}

          {riskFound && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <div className="flex items-center gap-2 font-bold"><AlertCircle className="w-5 h-5" /> نحتاج إلى دعمك</div>
              <p className="mt-2 leading-7">ظهر في النص ما قد يشير إلى حاجة عاجلة. لم يتم إرسال الإجابة. تواصل مباشرة مع الموجه الطلابي أو قنوات الدعم المعتمدة في المدرسة.</p>
            </div>
          )}

          {submitError && !riskFound && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{submitError}</div>
          )}

          <button onClick={submit} disabled={submitting} className="w-full mt-6 rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2"><ArrowRight className="w-4 h-4" /> إرسال الإجابة</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
