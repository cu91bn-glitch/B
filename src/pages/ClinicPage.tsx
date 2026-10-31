import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Copy, Download, Loader2, Trash2, Lock } from 'lucide-react';
import { deleteConsultation, fetchConsultations, type ConsultationRecord } from '@/lib/supabase';
import { DigitalClinic } from '@/components/DigitalClinic';
import { Panel } from '@/components/layout/AppShell';

export function ClinicPage() {
  const url = `${window.location.origin}/?clinic=1`;
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const [items, setItems] = useState<ConsultationRecord[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetchConsultations().then(setItems).catch(e => setError(e.message));
  }, []);
  useEffect(() => { QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setQr); load(); }, [url, load]);

  const remove = async (id: string) => {
    if (!confirm('حذف هذه الاستشارة نهائيًا؟')) return;
    try { await deleteConsultation(id); setItems(prev => (prev || []).filter(i => i.id !== id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحذف'); }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Panel title="رابط العيادة للطلاب">
          <div className="text-center">
            {qr && <img src={qr} alt="باركود العيادة الرقمية" className="mx-auto w-44 h-44 rounded-xl border border-slate-200 p-2 bg-white" />}
            <p className="text-sm text-slate-600 mt-3">اطبع الباركود أو شارك الرابط. الطالب يفتح العيادة بدون تسجيل دخول.</p>
            <div className="flex items-center gap-2 mt-3 bg-slate-50 border border-slate-200 rounded-xl p-2">
              <input readOnly value={url} dir="ltr" className="flex-1 min-w-0 bg-transparent text-xs text-slate-600 outline-none" />
              <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); }} className="p-2 rounded-lg bg-white border border-slate-200 text-brand-700">
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            {qr && <a href={qr} download="clinic-qr.png" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700"><Download className="w-4 h-4" /> تنزيل الباركود</a>}
          </div>
        </Panel>

        <Panel title="الاستشارات الواردة" className="lg:col-span-2">
          {error && <p className="text-sm text-rose-700 mb-3">{error}</p>}
          {!items ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
            : items.length === 0 ? <p className="text-sm text-slate-500 py-8 text-center">لا توجد استشارات بعد.</p>
            : (
              <div className="divide-y divide-slate-100 max-h-[520px] overflow-auto">
                {items.map(c => (
                  <div key={c.id} className="py-3 flex gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-brand-50 text-brand-800 px-2.5 py-0.5 font-bold">{c.consultation_type}</span>
                        <span className={`rounded-full px-2.5 py-0.5 font-bold ${c.privacy_level === 'عادية' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'}`}><Lock className="inline w-3 h-3 ml-1" />{c.privacy_level}</span>
                        <span className="text-slate-500">{new Date(c.created_at).toLocaleDateString('ar-SA')}</span>
                        {c.requester_name && <span className="text-slate-600 font-bold">{c.requester_name}</span>}
                      </div>
                      <p className="mt-1.5 text-sm text-slate-700 leading-7 whitespace-pre-wrap">{c.message}</p>
                    </div>
                    <button onClick={() => remove(c.id)} className="self-start p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="حذف"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
        </Panel>
      </div>
      <DigitalClinic />
    </div>
  );
}
