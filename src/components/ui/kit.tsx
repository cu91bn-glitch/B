import type { ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';

export const inputCls = 'mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-300';

export function TextField({ label, value, onChange, placeholder, required, type = 'text', dir }: {
  label: string; value: string | number; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string; dir?: 'ltr' | 'rtl';
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}{required && <span className="text-rose-600"> *</span>}
      <input type={type} value={value} dir={dir} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />
    </label>
  );
}

export function TextArea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <textarea value={value} rows={rows} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} leading-7`} />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function PrimaryButton({ children, onClick, busy, disabled, className = '', type = 'button' }: { children: ReactNode; onClick?: () => void; busy?: boolean; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick} disabled={busy || disabled} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-600 to-leaf-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-brand-600/20 hover:brightness-105 disabled:opacity-60 ${className}`}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{children}
    </button>
  );
}

export function GhostButton({ children, onClick, tone = 'brand', className = '' }: { children: ReactNode; onClick?: () => void; tone?: 'brand' | 'rose' | 'slate'; className?: string }) {
  const t = tone === 'rose' ? 'text-rose-600 hover:bg-rose-50' : tone === 'slate' ? 'text-slate-600 hover:bg-slate-100' : 'text-brand-700 hover:bg-brand-50';
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold ${t} ${className}`}>{children}</button>;
}

export function Dialog({ open, title, onClose, children, wide = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-extrabold text-brand-900">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ icon: Icon, text, action }: { icon: React.ComponentType<{ className?: string }>; text: string; action?: ReactNode }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-50 text-brand-400 flex items-center justify-center"><Icon className="w-7 h-7" /></div>
      <p className="mt-3 text-sm font-bold text-slate-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'leaf' | 'amber' | 'rose' | 'slate' }) {
  const t = { brand: 'bg-brand-50 text-brand-800', leaf: 'bg-leaf-50 text-leaf-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700', slate: 'bg-slate-100 text-slate-600' }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${t}`}>{children}</span>;
}

export function StatCard({ label, value, icon: Icon, tone = 'from-brand-500 to-brand-700' }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; tone?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tone} text-white flex items-center justify-center`}><Icon className="w-[18px] h-[18px]" /></div>
      <p className="mt-2.5 text-2xl font-extrabold text-brand-900 leading-none">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-600">{label}</p>
    </div>
  );
}

/** قائمة نصوص (أهداف/أنشطة) سطر لكل عنصر */
export function LinesField({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label} <span className="text-xs font-medium text-slate-500">(كل عنصر في سطر)</span>
      <textarea value={value.join('\n')} rows={4} placeholder={placeholder} onChange={e => onChange(e.target.value.split('\n'))} className={`${inputCls} leading-7`} />
    </label>
  );
}
