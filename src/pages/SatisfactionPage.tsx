import { useState } from 'react';
import QRCode from 'qrcode';
import { Send, Loader2, CheckCircle2, Copy, Download } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { Dialog } from '@/components/ui/kit';
import { SatisfactionSurveysSection } from '@/components/SatisfactionSurveysSection';
import { SURVEY_TEMPLATES, buildTemplate } from '@/lib/surveyTemplates';
import { createSurvey } from '@/lib/supabase';

/** رضا المستفيدين وقياس الأثر: نماذج جاهزة تُنشر بضغطة، مع سجل النتائج */
export function SatisfactionPage({ onManage }: { onManage: () => void }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [made, setMade] = useState<{ title: string; url: string; qr: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const publish = async (key: string) => {
    setBusy(key); setError('');
    try {
      const slug = `${key}-${Date.now().toString(36)}`;
      const s = await createSurvey({ ...buildTemplate(key), slug, status: 'published' });
      const url = `${window.location.origin}/?r=${encodeURIComponent(s.slug || slug)}`;
      setMade({ title: s.title, url, qr: await QRCode.toDataURL(url, { width: 360, margin: 1 }) });
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر النشر'); }
    finally { setBusy(''); }
  };

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-10 mt-6">
        <Panel title="نماذج جاهزة للنشر المباشر" action={<button onClick={onManage} className="text-sm font-bold text-brand-700">إدارة كل الاستبيانات</button>}>
          <p className="text-sm text-slate-600 mb-4">اضغط «نشر» ليُنشأ الاستبيان فورًا ويظهر رابطه وباركوده لإرساله. النتائج تظهر في «التحليل والتقارير».</p>
          {error && <p className="text-sm text-rose-700 mb-3">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {SURVEY_TEMPLATES.map(t => (
              <div key={t.key} className="rounded-xl border border-slate-200 p-4 flex flex-col hover:border-brand-300 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 ${t.kind === 'رضا' ? 'bg-brand-50 text-brand-800' : 'bg-leaf-50 text-leaf-700'}`}>{t.kind === 'رضا' ? 'قياس رضا' : 'قياس أثر'}</span>
                  <span className="text-[11px] font-bold text-slate-500">{t.who}</span>
                </div>
                <p className="mt-2 font-extrabold text-brand-900 leading-7">{t.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.sections} محاور · {t.items} فقرة</p>
                <button onClick={() => publish(t.key)} disabled={!!busy} className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-l from-brand-600 to-leaf-500 text-white px-3 py-2 text-sm font-bold disabled:opacity-60">
                  {busy === t.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} نشر
                </button>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <SatisfactionSurveysSection />

      <Dialog open={!!made} title="تم نشر الاستبيان" onClose={() => setMade(null)}>
        {made && (
          <div className="text-center">
            <p className="font-extrabold text-brand-900">{made.title}</p>
            <img src={made.qr} alt="باركود الاستبيان" className="mx-auto mt-3 w-56 h-56" />
            <div className="flex items-center gap-2 mt-3 bg-slate-50 border border-slate-200 rounded-xl p-2">
              <input readOnly value={made.url} dir="ltr" className="flex-1 min-w-0 bg-transparent text-xs text-slate-600 outline-none" />
              <button onClick={() => { navigator.clipboard.writeText(made.url); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-2 rounded-lg bg-white border border-slate-200 text-brand-700">{copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
            </div>
            <a href={made.qr} download="survey-qr.png" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-brand-700 text-white px-4 py-2 text-sm font-bold"><Download className="w-4 h-4" /> تنزيل الباركود</a>
          </div>
        )}
      </Dialog>
    </>
  );
}
