import { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutDashboard, ClipboardList, BarChart3, FolderOpen, ShieldAlert, HeartPulse,
  Stethoscope, Users, Target, BookOpen, Database, Menu, X, LogOut,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { FOUNDER_NAME } from '@/lib/brand';

export type PageId =
  | 'home' | 'surveys' | 'analysis' | 'evidence' | 'monitoring' | 'cases'
  | 'clinic' | 'councils' | 'indicators' | 'zad' | 'export';

type NavItem = { id: PageId; label: string; icon: React.ComponentType<{ className?: string }>; hint: string };

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: '', items: [{ id: 'home', label: 'الرئيسية', icon: LayoutDashboard, hint: 'نظرة عامة على عملك' }] },
  {
    title: 'العمل اليومي',
    items: [
      { id: 'surveys', label: 'الاستبيانات', icon: ClipboardList, hint: 'إنشاء الاستبيانات ونشرها ومشاركة الباركود' },
      { id: 'analysis', label: 'التحليل والتقارير', icon: BarChart3, hint: 'تحليل النتائج وتقارير PDF' },
      { id: 'evidence', label: 'الشواهد', icon: FolderOpen, hint: 'رفع الشواهد وحذفها وباركود التحقق' },
    ],
  },
  {
    title: 'الطلاب',
    items: [
      { id: 'monitoring', label: 'المتابعة والإنذار المبكر', icon: ShieldAlert, hint: 'استيراد كشوف نور وفرز الطلاب' },
      { id: 'cases', label: 'سجل الحالات', icon: HeartPulse, hint: 'الحالات الفردية وخطط التدخل' },
      { id: 'clinic', label: 'العيادة الرقمية', icon: Stethoscope, hint: 'استشارات الطلاب ورابط العيادة' },
    ],
  },
  {
    title: 'الاعتماد والمراجع',
    items: [
      { id: 'indicators', label: 'مؤشرات الاعتماد', icon: Target, hint: 'تغطية المؤشرات والفجوات' },
      { id: 'councils', label: 'المجالس ورضا المستفيدين', icon: Users, hint: 'مجلس الآباء واستبانات الرضا' },
      { id: 'zad', label: 'مكتبة زاد', icon: BookOpen, hint: 'الأدلة والموارد وباركوداتها' },
      { id: 'export', label: 'النسخ الاحتياطي', icon: Database, hint: 'تصدير البيانات والتقرير الختامي' },
    ],
  },
];

export const ALL_NAV: NavItem[] = NAV_GROUPS.flatMap(g => g.items);

function readHashPage(): PageId {
  const id = window.location.hash.replace(/^#\/?/, '') as PageId;
  return ALL_NAV.some(n => n.id === id) ? id : 'home';
}

export function useHashPage(): [PageId, (p: PageId) => void] {
  const [page, setPage] = useState<PageId>(readHashPage);
  useEffect(() => {
    const onHash = () => setPage(readHashPage());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (p: PageId) => {
    if (p !== page) window.location.hash = `/${p}`;
    window.scrollTo({ top: 0 });
  };
  return [page, go];
}

export function AppShell({ page, onNavigate, children }: { page: PageId; onNavigate: (p: PageId) => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const current = ALL_NAV.find(n => n.id === page) || ALL_NAV[0];

  const nav = (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map(group => (
        <div key={group.title || 'main'}>
          {group.title && <p className="px-3 mb-1.5 text-[11px] font-bold text-slate-400">{group.title}</p>}
          <div className="flex flex-col gap-1">
            {group.items.map(item => {
              const Icon = item.icon;
              const active = item.id === page;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setOpen(false); }}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-bold transition-all text-right ${
                    active
                      ? 'bg-gradient-to-l from-brand-600 to-leaf-500 text-white shadow-md shadow-brand-600/25'
                      : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-white' : 'text-brand-600 group-hover:text-brand-700'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="px-2 pb-5 mb-4 border-b border-slate-200/80 flex justify-center">
      <Logo variant="full" size={52} withFounder />
    </div>
  );

  const signOut = (
    <button onClick={() => supabase.auth.signOut()} className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-700">
      <LogOut className="w-[18px] h-[18px]" /> تسجيل الخروج
    </button>
  );

  return (
    <div className="min-h-screen bg-[#f3f8fb]" dir="rtl">
      {/* القائمة الجانبية - شاشات كبيرة */}
      <aside className="hidden lg:flex fixed inset-y-0 right-0 z-30 w-72 flex-col border-l border-slate-200/80 bg-white/95 backdrop-blur px-4 py-6 overflow-y-auto">
        {brand}
        {nav}
        {signOut}
      </aside>

      {/* شريط علوي - الجوال */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2.5">
        <button onClick={() => setOpen(true)} className="p-2 -mr-2 rounded-lg text-brand-800 hover:bg-brand-50" aria-label="القائمة"><Menu className="w-6 h-6" /></button>
        <div className="flex flex-col items-center leading-tight">
          <Logo variant="full" size={34} />
          <span className="text-[10px] font-bold text-brand-800">{FOUNDER_NAME}</span>
        </div>
        <span className="w-10" />
      </header>

      {/* القائمة المنبثقة - الجوال */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-[82%] max-w-xs bg-white px-4 py-5 overflow-y-auto shadow-2xl animate-slide-up">
            <button onClick={() => setOpen(false)} className="absolute left-3 top-3 p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="إغلاق"><X className="w-5 h-5" /></button>
            {brand}
            {nav}
            {signOut}
          </aside>
        </div>
      )}

      <main className="lg:mr-72 min-h-screen">
        <div className="px-4 sm:px-6 lg:px-10 pt-6 lg:pt-8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-leaf-500 text-white flex items-center justify-center shadow-md shadow-brand-500/25">
              <current.icon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-brand-900">{current.label}</h1>
              <p className="text-sm text-slate-500">{current.hint}</p>
            </div>
          </div>
        </div>
        <div className="page-body pb-16">{children}</div>
        <footer className="lg:mr-0 border-t border-slate-200 py-5 text-center text-xs text-slate-500">
          بوصلة — منصة الموجّه الطلابي · {FOUNDER_NAME}
        </footer>
      </main>
    </div>
  );
}

/** بطاقة موحدة للمحتوى داخل الصفحات */
export function Panel({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="text-base font-extrabold text-brand-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
