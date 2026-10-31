import { useEffect, useState } from 'react';
import {
  ClipboardList, Users2, FolderOpen, HeartPulse, ShieldAlert, Stethoscope,
  Plus, BarChart3, Upload, FileSpreadsheet, Target, Loader2, ArrowLeft, ClipboardCheck, Users, Trophy,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { INDICATOR_TEXT } from '@/lib/autoIndicators';
import { Panel, type PageId } from '@/components/layout/AppShell';
import { fetchProfile, PROGRAM_STATUS_LABELS, type ProgramStatus } from '@/lib/store';
import { FOUNDER_NAME } from '@/lib/brand';
import { toHijri, todayIso } from '@/lib/dates';

type Stats = {
  surveys: number; published: number; responses: number; evidence: number;
  openCases: number; alerts: number; consultations: number; programs: number; meetings: number; talents: number;
  coverage: Record<string, number>;
  recentPrograms: { id: string; title: string; status: string; date_hijri: string | null }[];
  recentMeetings: { id: string; topic: string; meeting_date_hijri: string; kind: string }[];
  school: string;
};

async function count(table: string, filter?: (q: any) => any): Promise<number> { // eslint-disable-line @typescript-eslint/no-explicit-any
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: c } = await q;
  return c ?? 0;
}

async function loadStats(): Promise<Stats> {
  const [programs, pm, sm, talents, recentP, recentPM, recentSM, profile] = await Promise.all([
    count('guidance_programs'), count('guidance_parent_council'), count('guidance_student_council'), count('guidance_talents'),
    supabase.from('guidance_programs').select('id, title, status, date_hijri').order('created_at', { ascending: false }).limit(4),
    supabase.from('guidance_parent_council').select('id, topic, meeting_date_hijri').order('created_at', { ascending: false }).limit(3),
    supabase.from('guidance_student_council').select('id, topic, meeting_date_hijri').order('created_at', { ascending: false }).limit(3),
    fetchProfile(),
  ]);
  const [surveys, published, responses, evidence, openCases, alerts, consultations, evRows, svRows] = await Promise.all([
    count('guidance_surveys'),
    count('guidance_surveys', q => q.eq('status', 'published')),
    count('guidance_survey_public_responses'),
    count('guidance_evidence'),
    count('guidance_case_registry', q => q.neq('status', 'closed')),
    count('guidance_early_alerts', q => q.in('status', ['new', 'in_progress'])),
    count('guidance_consultations'),
    supabase.from('guidance_evidence').select('indicator_codes'),
    supabase.from('guidance_surveys').select('indicators, status'),
  ]);
  const coverage: Record<string, number> = Object.fromEntries(Object.keys(INDICATOR_TEXT).map(c => [c, 0]));
  for (const row of (evRows.data || []) as { indicator_codes: string[] | null }[]) {
    for (const c of row.indicator_codes || []) if (c in coverage) coverage[c]++;
  }
  for (const row of (svRows.data || []) as { indicators: string[] | null; status: string }[]) {
    if (row.status !== 'published') continue;
    for (const c of row.indicators || []) if (c in coverage) coverage[c]++;
  }
  const recentMeetings = [
    ...((recentPM.data || []) as { id: string; topic: string; meeting_date_hijri: string }[]).map(m => ({ ...m, kind: 'مجلس الآباء' })),
    ...((recentSM.data || []) as { id: string; topic: string; meeting_date_hijri: string }[]).map(m => ({ ...m, kind: 'المجلس الطلابي' })),
  ].slice(0, 4);
  return {
    surveys, published, responses, evidence, openCases, alerts, consultations, coverage, programs, meetings: pm + sm, talents,
    recentPrograms: (recentP.data || []) as Stats['recentPrograms'], recentMeetings, school: profile.school,
  };
}

const REQUIRED = 3;

export function DashboardPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { loadStats().then(setStats).catch(() => setError('تعذر تحميل الإحصاءات')); }, []);

  if (error) return <div className="px-4 sm:px-6 lg:px-10 mt-6 text-rose-700">{error}</div>;
  if (!stats) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-brand-500" /></div>;

  const codes = Object.keys(stats.coverage);
  const covered = codes.filter(c => stats.coverage[c] >= REQUIRED).length;
  const partial = codes.filter(c => stats.coverage[c] > 0 && stats.coverage[c] < REQUIRED).length;
  const pct = codes.length ? Math.round((covered / codes.length) * 100) : 0;

  const cards: { label: string; value: number; sub?: string; icon: React.ComponentType<{ className?: string }>; tone: string; page: PageId }[] = [
    { label: 'الاستبيانات', value: stats.surveys, sub: `${stats.published} منشور`, icon: ClipboardList, tone: 'from-brand-500 to-brand-700', page: 'surveys' },
    { label: 'إجابات الطلاب', value: stats.responses, icon: Users2, tone: 'from-leaf-400 to-leaf-600', page: 'analysis' },
    { label: 'الشواهد', value: stats.evidence, icon: FolderOpen, tone: 'from-brand-400 to-leaf-500', page: 'evidence' },
    { label: 'حالات مفتوحة', value: stats.openCases, icon: HeartPulse, tone: 'from-rose-400 to-rose-600', page: 'cases' },
    { label: 'إنذارات نشطة', value: stats.alerts, icon: ShieldAlert, tone: 'from-amber-400 to-amber-600', page: 'monitoring' },
    { label: 'استشارات الطلاب', value: stats.consultations, icon: Stethoscope, tone: 'from-brand-600 to-brand-900', page: 'clinic' },
    { label: 'البرامج الإرشادية', value: stats.programs, icon: ClipboardCheck, tone: 'from-leaf-500 to-brand-600', page: 'programs' },
    { label: 'اجتماعات المجالس', value: stats.meetings, icon: Users, tone: 'from-brand-400 to-brand-600', page: 'councils' },
    { label: 'المتفوقون والموهوبون', value: stats.talents, icon: Trophy, tone: 'from-amber-300 to-amber-500', page: 'students' },
  ];

  const actions: { label: string; icon: React.ComponentType<{ className?: string }>; page: PageId }[] = [
    { label: 'برنامج جديد', icon: ClipboardCheck, page: 'programs' },
    { label: 'استبيان جاهز', icon: Plus, page: 'satisfaction' },
    { label: 'تحليل وتقرير', icon: BarChart3, page: 'analysis' },
    { label: 'رفع شاهد', icon: Upload, page: 'evidence' },
    { label: 'استيراد كشف نور', icon: FileSpreadsheet, page: 'monitoring' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6 space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-brand-800 via-brand-700 to-leaf-600 text-white shadow-lg shadow-brand-800/20">
        <div className="absolute -left-10 -top-16 w-56 h-56 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4 sm:gap-5 p-5 sm:p-6">
          <img src="/brand/founder-square.jpg" alt={FOUNDER_NAME} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/25 shadow-lg" />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-white/80">مرحبًا بك</p>
            <p className="text-lg sm:text-2xl font-extrabold">{FOUNDER_NAME}</p>
            <p className="text-xs sm:text-sm text-white/85 truncate">{stats.school} · {toHijri(todayIso())}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {cards.map(c => (
          <button key={c.label} onClick={() => onNavigate(c.page)} className="group text-right bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.tone} text-white flex items-center justify-center shadow-sm`}><c.icon className="w-5 h-5" /></div>
            <p className="mt-3 text-3xl font-extrabold text-brand-900 leading-none">{c.value}</p>
            <p className="mt-1.5 text-sm font-bold text-slate-600">{c.label}</p>
            {c.sub && <p className="text-xs text-slate-500">{c.sub}</p>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Panel title="جاهزية مؤشرات الاعتماد" className="xl:col-span-2" action={<button onClick={() => onNavigate('indicators')} className="text-sm font-bold text-brand-700 inline-flex items-center gap-1">التفاصيل <ArrowLeft className="w-4 h-4" /></button>}>
          <div className="flex flex-wrap items-center gap-6 mb-5">
            <Donut pct={pct} />
            <div className="space-y-1.5 text-sm">
              <p><span className="inline-block w-3 h-3 rounded-full bg-leaf-500 ml-2" />مكتمل: <b>{covered}</b> من {codes.length}</p>
              <p><span className="inline-block w-3 h-3 rounded-full bg-amber-400 ml-2" />جزئي: <b>{partial}</b></p>
              <p><span className="inline-block w-3 h-3 rounded-full bg-slate-300 ml-2" />بدون شواهد: <b>{codes.length - covered - partial}</b></p>
              <p className="text-xs text-slate-500 pt-1">المؤشر يكتمل بـ {REQUIRED} شواهد أو استبيانات منشورة مرتبطة به.</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {codes.map(code => {
              const v = stats.coverage[code];
              const w = Math.min(100, (v / REQUIRED) * 100);
              return (
                <div key={code} className="grid grid-cols-[64px_1fr_32px] items-center gap-3">
                  <span className="text-xs font-bold text-slate-500" dir="ltr">{code}</span>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" title={INDICATOR_TEXT[code]}>
                    <div className={`h-full rounded-full ${v >= REQUIRED ? 'bg-leaf-500' : v > 0 ? 'bg-amber-400' : 'bg-slate-200'}`} style={{ width: `${Math.max(w, v ? 6 : 0)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 text-left">{v}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="إجراءات سريعة">
          <div className="grid grid-cols-2 gap-3">
            {actions.map(a => (
              <button key={a.label} onClick={() => onNavigate(a.page)} className="flex flex-col items-center justify-center gap-2 rounded-xl border border-brand-100 bg-brand-50/60 hover:bg-brand-100 py-5 text-sm font-bold text-brand-800 transition-colors">
                <a.icon className="w-6 h-6 text-brand-600" />
                {a.label}
              </button>
            ))}
          </div>
          <button onClick={() => onNavigate('indicators')} className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-leaf-500 text-white py-3 text-sm font-bold shadow-md shadow-brand-600/20">
            <Target className="w-4 h-4" /> عرض فجوات الاعتماد
          </button>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="أحدث البرامج الإرشادية" action={<button onClick={() => onNavigate('programs')} className="text-sm font-bold text-brand-700">الكل</button>}>
          {stats.recentPrograms.length === 0 ? <p className="text-sm text-slate-500 py-6 text-center">لا توجد برامج بعد — ابدأ من النماذج الجاهزة.</p> : (
            <div className="divide-y divide-slate-100">
              {stats.recentPrograms.map(p => (
                <div key={p.id} className="py-2.5 flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.status === 'completed' ? 'bg-leaf-500' : p.status === 'in_progress' ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  <span className="flex-1 text-sm font-bold text-slate-800 truncate">{p.title}</span>
                  <span className="text-xs font-bold text-slate-500">{PROGRAM_STATUS_LABELS[p.status as ProgramStatus]}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="آخر اجتماعات المجالس" action={<button onClick={() => onNavigate('councils')} className="text-sm font-bold text-brand-700">الكل</button>}>
          {stats.recentMeetings.length === 0 ? <p className="text-sm text-slate-500 py-6 text-center">لا توجد اجتماعات مسجلة بعد.</p> : (
            <div className="divide-y divide-slate-100">
              {stats.recentMeetings.map(m => (
                <div key={m.id} className="py-2.5 flex items-center gap-3">
                  <span className="text-[11px] font-bold rounded-full bg-brand-50 text-brand-800 px-2 py-0.5 whitespace-nowrap">{m.kind}</span>
                  <span className="flex-1 text-sm font-bold text-slate-800 truncate">{m.topic}</span>
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{m.meeting_date_hijri}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Donut({ pct }: { pct: number }) {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e6eef4" strokeWidth="14" />
      {pct > 0 && <circle cx="60" cy="60" r={r} fill="none" stroke="url(#dg)" strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 60 60)" />}
      <defs><linearGradient id="dg" x1="0" x2="1"><stop offset="0" stopColor="#1E88C7" /><stop offset="1" stopColor="#2e9e5b" /></linearGradient></defs>
      <text x="60" y="66" textAnchor="middle" fontSize="24" fontWeight="800" fill="#10324a">{pct}%</text>
    </svg>
  );
}
