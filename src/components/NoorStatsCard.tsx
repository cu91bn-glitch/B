import { useEffect, useState } from 'react';
import { Database, Save, Loader2 } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { fetchProfile, saveProfile, type CounselorProfile } from '@/lib/store';

const FIELDS: [string, string][] = [
  ['totalSessions', 'إجمالي الجلسات الإرشادية'], ['individualSessions', 'جلسات فردية'], ['groupSessions', 'جلسات جماعية'],
  ['uploadedRecords', 'سجلات مرفوعة في نور'], ['coverage', 'نسبة التغطية %'],
];

/** إحصاءات نظام نور: تُدخل من واقع النظام وتظهر في التقرير الختامي */
export function NoorStatsCard() {
  const [profile, setProfile] = useState<CounselorProfile | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { fetchProfile().then(setProfile); }, []);
  if (!profile) return null;
  const noor = profile.noor || {};
  const save = async () => {
    setBusy(true); setMsg('');
    try { await saveProfile(profile); setMsg('تم الحفظ'); } catch { setMsg('تعذر الحفظ'); } finally { setBusy(false); }
  };
  return (
    <Panel title="تكامل نظام نور" action={<span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Database className="w-4 h-4" /> يظهر في التقرير الختامي</span>}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {FIELDS.map(([k, label]) => (
          <label key={k} className="block text-xs font-bold text-slate-600">{label}
            <input type="number" value={noor[k] ?? ''} onChange={e => setProfile({ ...profile, noor: { ...noor, [k]: e.target.value } })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base font-extrabold text-brand-900 text-center" />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 text-white px-4 py-2 text-sm font-bold disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ</button>
        {msg && <span className="text-sm font-bold text-leaf-700">{msg}</span>}
      </div>
    </Panel>
  );
}
