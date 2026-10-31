import { useEffect, useState } from 'react';
import { BadgeCheck, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { fetchPublicEvidence, type PublicEvidence } from '@/lib/supabase';
import { INDICATOR_TEXT, PROGRAM_NAMES } from '@/lib/autoIndicators';
import { Logo } from '@/components/Logo';

/** الصفحة التي تفتح عند مسح باركود الشاهد */
export function PublicEvidencePage({ token }: { token: string }) {
  const [data, setData] = useState<PublicEvidence | null | undefined>(undefined);
  useEffect(() => { fetchPublicEvidence(token).then(setData); }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6"><Logo variant="full" size={56} withFounder /></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {data === undefined && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>}
          {data === null && (
            <div className="text-center py-10">
              <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
              <p className="mt-3 font-bold text-slate-700">الشاهد غير موجود أو أن الباركود غير صحيح</p>
            </div>
          )}
          {data && (
            <>
              <div className="flex items-center gap-2 text-leaf-700 font-extrabold"><BadgeCheck className="w-6 h-6" /> شاهد موثّق في منصة بوصلة</div>
              <h1 className="mt-3 text-xl font-extrabold text-brand-900 leading-8">{data.title}</h1>
              <p className="text-sm text-slate-600 mt-1">{PROGRAM_NAMES[data.category] || data.category} · {data.evidence_date_hijri || new Date(data.created_at).toLocaleDateString('ar-SA')}</p>
              {data.indicator_codes?.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-bold text-slate-500">مؤشرات الاعتماد المرتبطة</p>
                  {data.indicator_codes.map(c => (
                    <p key={c} className="text-sm text-slate-700"><span dir="ltr" className="inline-block min-w-[64px] font-bold text-leaf-700">{c}</span> {INDICATOR_TEXT[c] || ''}</p>
                  ))}
                </div>
              )}
              {data.url && (
                <div className="mt-5">
                  {data.file_type === 'image'
                    ? <img src={data.url} alt={data.title} className="w-full rounded-xl border border-slate-200" />
                    : <a href={data.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 text-white px-5 py-3 font-bold"><ExternalLink className="w-4 h-4" /> فتح ملف الشاهد (PDF)</a>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
