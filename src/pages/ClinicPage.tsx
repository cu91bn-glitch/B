import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Copy, Download, Loader2, Trash2, Lock, Send, Phone, MessageSquareReply } from 'lucide-react';
import { deleteConsultation, fetchConsultations, replyConsultation, fetchAppointments, updateAppointment, deleteAppointment, type ConsultationRecord, type AppointmentRecord } from '@/lib/supabase';
import { displayDate } from '@/lib/dates';
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
                {items.map(c => <ConsultationItem key={c.id} c={c} onRemove={() => remove(c.id)} onReplied={r => setItems(prev => (prev || []).map(x => x.id === c.id ? { ...x, reply: r, status: 'replied', replied_at: new Date().toISOString() } : x))} />)}
              </div>
            )}
        </Panel>
      </div>
      <AppointmentsPanel />
      <DigitalClinic />
    </div>
  );
}

function ConsultationItem({ c, onRemove, onReplied }: { c: ConsultationRecord; onRemove: () => void; onReplied: (reply: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(c.reply || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const send = async () => {
    if (!text.trim()) return;
    setBusy(true); setErr('');
    try { await replyConsultation(c.id, text.trim()); onReplied(text.trim()); setOpen(false); } catch (e) { setErr(e instanceof Error ? e.message : 'تعذر الحفظ'); } finally { setBusy(false); }
  };
  const phone = (c.contact || '').replace(/\D/g, '').replace(/^0/, '966');
  return (
    <div className="py-3">
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-brand-50 text-brand-800 px-2.5 py-0.5 font-bold">{c.consultation_type}</span>
            <span className={`rounded-full px-2.5 py-0.5 font-bold ${c.privacy_level === 'عادية' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-700'}`}><Lock className="inline w-3 h-3 ml-1" />{c.privacy_level}</span>
            <span className={`rounded-full px-2.5 py-0.5 font-bold ${c.reply ? 'bg-leaf-50 text-leaf-700' : 'bg-amber-50 text-amber-700'}`}>{c.reply ? 'تم الرد' : 'بانتظار الرد'}</span>
            <span className="text-slate-500">{new Date(c.created_at).toLocaleDateString('ar-SA')}</span>
            {c.requester_name && <span className="text-slate-700 font-bold">{c.requester_name}</span>}
            {c.tracking_code && <span className="text-slate-400 font-bold" dir="ltr">#{c.tracking_code}</span>}
          </div>
          <p className="mt-1.5 text-sm text-slate-800 leading-7 whitespace-pre-wrap">{c.message}</p>
          {c.reply && !open && <div className="mt-2 rounded-xl bg-leaf-50 p-3 text-sm text-slate-800 leading-7 whitespace-pre-wrap"><b className="text-leaf-800">ردك: </b>{c.reply}</div>}
        </div>
        <button onClick={onRemove} className="self-start p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="حذف"><Trash2 className="w-4 h-4" /></button>
      </div>
      {open ? (
        <div className="mt-2 space-y-2">
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="اكتب ردك… يقرؤه الطالب برمز المتابعة" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm leading-7" />
          {err && <p className="text-xs text-rose-700">{err}</p>}
          <div className="flex gap-2">
            <button onClick={send} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 text-white px-4 py-2 text-sm font-bold disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} حفظ الرد</button>
            <button onClick={() => setOpen(false)} className="rounded-lg px-3 text-sm font-bold text-slate-600 hover:bg-slate-100">إلغاء</button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"><MessageSquareReply className="w-3.5 h-3.5" /> {c.reply ? 'تعديل الرد' : 'الرد على الاستشارة'}</button>
          {phone.length >= 11 && <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-leaf-700 hover:bg-leaf-50"><Phone className="w-3.5 h-3.5" /> تواصل واتساب ({c.contact})</a>}
        </div>
      )}
    </div>
  );
}

const APPT: Record<string, { label: string; cls: string }> = {
  pending: { label: 'بانتظار التأكيد', cls: 'bg-amber-50 text-amber-700' }, confirmed: { label: 'مؤكد', cls: 'bg-brand-50 text-brand-800' },
  done: { label: 'تمت المقابلة', cls: 'bg-leaf-50 text-leaf-700' }, cancelled: { label: 'ملغى', cls: 'bg-rose-50 text-rose-700' },
};

function AppointmentsPanel() {
  const [list, setList] = useState<AppointmentRecord[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { fetchAppointments().then(setList).catch(e => setErr(e.message)); }, []);
  const setStatus = async (a: AppointmentRecord, status: string) => {
    const note = status === 'cancelled' ? (prompt('سبب الإلغاء أو موعد بديل (يظهر للطالب)') || null) : a.staff_note;
    try { await updateAppointment(a.id, { status, staff_note: note }); setList(l => (l || []).map(x => x.id === a.id ? { ...x, status, staff_note: note } : x)); } catch (e) { setErr(e instanceof Error ? e.message : 'تعذر التحديث'); }
  };
  const remove = async (a: AppointmentRecord) => {
    if (!confirm('حذف الموعد؟')) return;
    try { await deleteAppointment(a.id); setList(l => (l || []).filter(x => x.id !== a.id)); } catch (e) { setErr(e instanceof Error ? e.message : 'تعذر الحذف'); }
  };
  return (
    <Panel title={`مواعيد الطلاب${list ? ` (${list.filter(a => a.status === 'pending').length} بانتظار التأكيد)` : ''}`}>
      {err && <p className="text-sm text-rose-700 mb-2">{err}</p>}
      {!list ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        : list.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">لا توجد مواعيد محجوزة.</p>
        : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-slate-500 border-b border-slate-100"><th className="text-right p-2">اليوم</th><th className="text-right p-2">الوقت</th><th className="text-right p-2">الطالب</th><th className="text-right p-2">السبب</th><th className="text-right p-2">الحالة</th><th className="p-2"></th></tr></thead>
              <tbody>
                {list.map(a => (
                  <tr key={a.id} className="border-b border-slate-50">
                    <td className="p-2 font-bold text-slate-800 whitespace-nowrap">{displayDate(a.appointment_hijri, a.appointment_date)}</td>
                    <td className="p-2 whitespace-nowrap">{a.slot}</td>
                    <td className="p-2">{a.student_name || '—'} {a.student_grade && <span className="text-xs text-slate-500">({a.student_grade})</span>}</td>
                    <td className="p-2 text-slate-600">{a.reason || '—'}</td>
                    <td className="p-2"><span className={`text-[11px] font-bold rounded-full px-2.5 py-0.5 ${APPT[a.status]?.cls}`}>{APPT[a.status]?.label}</span></td>
                    <td className="p-2 whitespace-nowrap">
                      {a.status === 'pending' && <button onClick={() => setStatus(a, 'confirmed')} className="text-xs font-bold text-brand-700 px-2">تأكيد</button>}
                      {a.status === 'confirmed' && <button onClick={() => setStatus(a, 'done')} className="text-xs font-bold text-leaf-700 px-2">تمت</button>}
                      {a.status !== 'cancelled' && a.status !== 'done' && <button onClick={() => setStatus(a, 'cancelled')} className="text-xs font-bold text-rose-600 px-2">إلغاء</button>}
                      <button onClick={() => remove(a)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="inline w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </Panel>
  );
}
