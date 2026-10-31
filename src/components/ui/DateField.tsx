import { CalendarDays } from 'lucide-react';
import { toHijri } from '@/lib/dates';

/** اختيار التاريخ الميلادي من التقويم، ويظهر الهجري الموافق تلقائيًا */
export function DateField({ label = 'التاريخ', value, onChange, required = false }: {
  label?: string;
  value: string;
  onChange: (gregorian: string, hijri: string) => void;
  required?: boolean;
}) {
  const hijri = toHijri(value);
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}{required && <span className="text-rose-600"> *</span>}
      <div className="mt-1 relative">
        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-600" />
        <input
          type="date"
          value={value}
          onChange={e => onChange(e.target.value, toHijri(e.target.value))}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
        />
      </div>
      <span className={`mt-1 block text-xs font-bold ${hijri ? 'text-leaf-700' : 'text-slate-400'}`}>
        {hijri ? `الموافق: ${hijri}` : 'اختر التاريخ الميلادي وسيظهر الهجري تلقائيًا'}
      </span>
    </label>
  );
}
