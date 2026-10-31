import { useState } from 'react';
import { CalendarCheck, Search, Loader2, CheckCircle2, MessageCircleReply } from 'lucide-react';
import { bookAppointment, clinicLookup, type ClinicLookup } from '@/lib/supabase';
import { DateField } from '@/components/ui/DateField';
import { inputCls } from '@/components/ui/kit';
import { displayDate } from '@/lib/dates';

const SLOTS = ['الحصة الأولى', 'الحصة الثانية', 'الحصة الثالثة', 'الفسحة', 'الحصة الرابعة', 'الحصة الخامسة', 'الحصة السادسة'];
const APPT_STATUS: Record<string, string> = { pending: 'بانتظار تأكيد الموجّه', confirmed: 'مؤكد', done: 'تمت المقابلة', cancelled: 'ملغى' };

/** حجز موعد مع الموجّه + متابعة الرد على الاستشارة أو الموعد برمز المتابعة */
export function ClinicExtras() {
  return (
    <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Booking />
      <Lookup />
    </div>
  );
}

function Booking() {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [date, setDate] = useState('');
  const [hijri, setHijri] = useState('');
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');

  const submit = async () => {
    setError('');
    if (!date) return setError('اختر اليوم');
    if (new Date(`${date}T23:59:59`) < new Date()) return setError('اختر يومًا قادمًا');
    if (!slot) return setError('اختر الوقت');
    setBusy(true);
    try {
      setCode(await bookAppointment({ student_name: name || undefined, student_grade: grade || undefined, appointment_date: date, appointment_hijri: hijri, slot, reason: reason || undefined }));
      setName(''); setGrade(''); setDate(''); setHijri(''); setSlot(''); setReason('');
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الحجز'); } finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-amber-600" /></div>
        <div><h4 className="text-base font-extrabold text-brand-900">حجز موعد مع الموجّه الطلابي</h4><p className="text-xs text-slate-500">يصل طلبك للموجّه ويؤكده لك</p></div>
      </div>
      {code ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-10 h-10 text-leaf-600 mx-auto" />
          <p className="mt-2 font-bold text-slate-800">تم إرسال طلب الموعد</p>
          <div className="my-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 p-3">
            <p className="text-xs font-bold text-brand-800">رمز المتابعة</p>
            <p className="text-2xl font-extrabold tracking-[0.25em] text-brand-900" dir="ltr">{code}</p>
          </div>
          <p className="text-xs text-slate-500">تابع حالة الموعد بهذا الرمز من «متابعة استشارة أو موعد».</p>
          <button onClick={() => setCode('')} className="mt-3 text-sm font-bold text-brand-700">حجز موعد آخر</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-sm font-bold text-slate-700">الاسم (اختياري)<input value={name} onChange={e => setName(e.target.value)} className={inputCls} /></label>
            <label className="block text-sm font-bold text-slate-700">الصف (اختياري)<input value={grade} onChange={e => setGrade(e.target.value)} className={inputCls} /></label>
          </div>
          <DateField label="اليوم" required value={date} onChange={(g, h) => { setDate(g); setHijri(h); }} />
          <div>
            <p className="text-sm font-bold text-slate-700 mb-1.5">الوقت <span className="text-rose-600">*</span></p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {SLOTS.map(s => <button key={s} type="button" onClick={() => setSlot(s)} className={`rounded-lg py-2 text-xs font-bold border ${slot === s ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50'}`}>{s}</button>)}
            </div>
          </div>
          <label className="block text-sm font-bold text-slate-700">سبب الموعد (اختياري)<input value={reason} onChange={e => setReason(e.target.value)} className={inputCls} /></label>
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <button onClick={submit} disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-900 text-white text-sm font-bold rounded-xl hover:bg-brand-800 disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />} طلب الموعد
          </button>
        </div>
      )}
    </div>
  );
}

function Lookup() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ClinicLookup | null | undefined>(undefined);
  const check = async () => { if (code.trim().length < 6) return; setBusy(true); setResult(await clinicLookup(code)); setBusy(false); };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center"><MessageCircleReply className="w-5 h-5 text-brand-600" /></div>
        <div><h4 className="text-base font-extrabold text-brand-900">متابعة استشارة أو موعد</h4><p className="text-xs text-slate-500">اكتب رمز المتابعة الذي ظهر لك بعد الإرسال</p></div>
      </div>
      <div className="flex gap-2">
        <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} dir="ltr" placeholder="ABCD2345" className={`${inputCls} mt-0 tracking-[0.2em] text-center font-extrabold`} />
        <button onClick={check} disabled={busy} className="rounded-xl bg-brand-700 text-white px-4 text-sm font-bold flex items-center gap-1.5 disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} عرض</button>
      </div>
      {result === null && <p className="mt-4 text-sm text-rose-700">لم يُعثر على هذا الرمز. تأكد من كتابته كما ظهر لك.</p>}
      {result && result.kind === 'consultation' && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-bold text-slate-700">{result.type} · أُرسلت {new Date(result.created_at).toLocaleDateString('ar-SA')}</p>
          {result.reply ? (
            <div className="rounded-xl bg-leaf-50 border border-leaf-100 p-4">
              <p className="text-xs font-extrabold text-leaf-800 mb-1">رد الموجّه الطلابي</p>
              <p className="text-sm text-slate-800 leading-7 whitespace-pre-wrap">{result.reply}</p>
            </div>
          ) : <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-800">استشارتك قيد المراجعة، وسيظهر الرد هنا.</p>}
        </div>
      )}
      {result && result.kind === 'appointment' && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm space-y-1">
          <p><b>اليوم:</b> {displayDate(result.hijri, result.date)}</p>
          <p><b>الوقت:</b> {result.slot}</p>
          <p><b>الحالة:</b> <span className="font-extrabold text-brand-800">{APPT_STATUS[result.status] || result.status}</span></p>
          {result.note && <p><b>ملاحظة الموجّه:</b> {result.note}</p>}
        </div>
      )}
    </div>
  );
}
