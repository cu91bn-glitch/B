import { useEffect, useState } from 'react';
import { Mail, Phone, School, MapPin, Briefcase, Users, CalendarRange, Edit3, Loader2, Save } from 'lucide-react';
import { Panel } from '@/components/layout/AppShell';
import { PrimaryButton, TextArea, TextField } from '@/components/ui/kit';
import { fetchProfile, saveProfile, type CounselorProfile } from '@/lib/store';

export function ProfilePage() {
  const [profile, setProfile] = useState<CounselorProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchProfile().then(setProfile); }, []);
  if (!profile) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-brand-500" /></div>;

  const set = (k: keyof CounselorProfile) => (v: string) => setProfile({ ...profile, [k]: k === 'students' ? Number(v) || 0 : v });
  const save = async () => {
    setBusy(true); setMsg('');
    try { await saveProfile(profile); setEditing(false); setMsg('تم الحفظ'); } catch (e) { setMsg(e instanceof Error ? e.message : 'تعذر الحفظ'); }
    finally { setBusy(false); }
  };

  const info: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
    { icon: School, label: 'المدرسة', value: profile.school },
    { icon: MapPin, label: 'الإدارة', value: profile.region },
    { icon: CalendarRange, label: 'العام الدراسي', value: profile.year },
    { icon: Briefcase, label: 'الخبرة', value: profile.experience },
    { icon: Users, label: 'عدد الطلاب', value: String(profile.students) },
    { icon: Mail, label: 'البريد', value: profile.email },
    { icon: Phone, label: 'الجوال', value: profile.phone },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6 space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-brand-800 via-brand-700 to-leaf-600 text-white shadow-xl shadow-brand-800/20">
        <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute left-24 -bottom-20 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
          <img src="/brand/founder.jpg" alt={profile.name} className="w-36 h-44 rounded-2xl object-cover object-top ring-4 ring-white/30 shadow-xl bg-white" />
          <div className="text-center sm:text-right">
            <p className="text-sm font-bold text-white/80">{profile.title}</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">{profile.name}</h2>
            <p className="mt-2 text-white/90 font-bold">{profile.school}</p>
            <p className="text-sm text-white/80">{profile.ministry} — {profile.region}</p>
            <p className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold">مؤسس منصة بوصلة</p>
          </div>
        </div>
      </div>

      <Panel title="بيانات الموجّه" action={!editing && <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700"><Edit3 className="w-4 h-4" /> تعديل</button>}>
        {!editing ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {info.map(i => (
                <div key={i.label} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <div className="w-9 h-9 rounded-lg bg-white text-brand-600 flex items-center justify-center shadow-sm"><i.icon className="w-[18px] h-[18px]" /></div>
                  <div className="min-w-0"><p className="text-xs font-bold text-slate-500">{i.label}</p><p className="text-sm font-bold text-slate-800 break-words" dir={i.label === 'البريد' || i.label === 'الجوال' ? 'ltr' : undefined}>{i.value || '—'}</p></div>
                </div>
              ))}
            </div>
            {profile.bio && <p className="mt-4 text-sm leading-8 text-slate-700 whitespace-pre-wrap">{profile.bio}</p>}
            {msg && <p className="mt-3 text-sm font-bold text-leaf-700">{msg}</p>}
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="الاسم" value={profile.name} onChange={set('name')} />
              <TextField label="المسمى" value={profile.title} onChange={set('title')} />
              <TextField label="المدرسة" value={profile.school} onChange={set('school')} />
              <TextField label="الإدارة التعليمية" value={profile.region} onChange={set('region')} />
              <TextField label="العام الدراسي" value={profile.year} onChange={set('year')} />
              <TextField label="الخبرة" value={profile.experience} onChange={set('experience')} />
              <TextField label="عدد الطلاب" type="number" value={profile.students} onChange={set('students')} />
              <TextField label="البريد" dir="ltr" value={profile.email} onChange={set('email')} />
              <TextField label="الجوال" dir="ltr" value={profile.phone} onChange={set('phone')} />
            </div>
            <TextArea label="نبذة" value={profile.bio} onChange={set('bio')} placeholder="نبذة مختصرة تظهر في ملف الموجّه" />
            <div className="flex gap-2">
              <PrimaryButton onClick={save} busy={busy}><Save className="w-4 h-4" /> حفظ</PrimaryButton>
              <button onClick={() => setEditing(false)} className="rounded-xl px-4 text-sm font-bold text-slate-600 hover:bg-slate-100">إلغاء</button>
            </div>
            {msg && <p className="text-sm text-rose-700">{msg}</p>}
          </div>
        )}
      </Panel>
    </div>
  );
}
