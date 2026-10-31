import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Loader2, Lock, LogOut, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

type GateState = 'loading' | 'signed-out' | 'not-staff' | 'staff';

/**
 * بوابة الدخول: لوحة الموجّه وبيانات الطلاب لا تظهر إلا لحساب مسجّل في جدول guidance_staff.
 * الحماية الفعلية في قاعدة البيانات (سياسات RLS)، وهذه الواجهة فقط تعرض شاشة الدخول.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<GateState>('loading');

  useEffect(() => {
    let active = true;
    const check = async (s: Session | null) => {
      if (!active) return;
      setSession(s);
      if (!s) { setState('signed-out'); return; }
      const { data, error } = await supabase.rpc('is_staff');
      if (!active) return;
      setState(!error && data === true ? 'staff' : 'not-staff');
    };
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event: string, s: Session | null) => { check(s); });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (state === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }
  if (state === 'signed-out') return <LoginScreen />;
  if (state === 'not-staff') {
    return (
      <Shell>
        <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
        <p className="mt-3 text-slate-700 font-bold">هذا الحساب غير مصرّح له بالدخول إلى لوحة الموجّه</p>
        <p className="mt-1 text-sm text-slate-500" dir="ltr">{session?.user.email}</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
      </Shell>
    );
  }
  return <>{children}</>;
}

export function SignOutButton({ className = '' }: { className?: string }) {
  return (
    <button
      onClick={() => supabase.auth.signOut()}
      title="تسجيل الخروج"
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 ${className}`}
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden lg:inline">خروج</span>
    </button>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-cyan-50/40 p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6"><Logo variant="full" size={64} withFounder /></div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">{children}</div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(err.message.includes('Invalid') ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'تعذر تسجيل الدخول، حاول مرة أخرى');
    setBusy(false);
  };

  return (
    <Shell>
      <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 flex items-center justify-center mx-auto"><Lock className="w-6 h-6" /></div>
      <h1 className="mt-3 text-lg font-bold text-slate-800 font-cairo">دخول الموجّه الطلابي</h1>
      <p className="text-xs text-slate-500 mt-1">لوحة المتابعة وبيانات الطلاب متاحة للموجّه فقط</p>
      <form onSubmit={submit} className="mt-5 space-y-3 text-right">
        <label className="block text-sm text-slate-700">
          البريد الإلكتروني
          <input type="email" required autoComplete="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        </label>
        <label className="block text-sm text-slate-700">
          كلمة المرور
          <input type="password" required autoComplete="current-password" dir="ltr" value={password} onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        </label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-lg bg-cyan-700 py-2.5 text-sm font-bold text-white hover:bg-cyan-800 disabled:opacity-60">
          {busy ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'دخول'}
        </button>
      </form>
      <p className="mt-4 text-[11px] text-slate-400 leading-5">الطلاب: افتحوا رابط الاستبيان أو العيادة الرقمية الذي يرسله لكم الموجّه، ولا تحتاجون إلى تسجيل دخول.</p>
    </Shell>
  );
}
