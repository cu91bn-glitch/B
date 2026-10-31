import { Target } from 'lucide-react';
import { INDICATOR_TEXT } from '@/lib/autoIndicators';

/** عرض مؤشرات الاعتماد التي حُددت تلقائيًا (بدون اختيار يدوي) */
export function AutoIndicators({ codes, className = '' }: { codes: string[]; className?: string }) {
  return (
    <div className={`rounded-xl bg-leaf-50/70 border border-leaf-100 p-3 ${className}`}>
      <p className="flex items-center gap-1.5 text-xs font-bold text-leaf-800 mb-1.5"><Target className="w-3.5 h-3.5" /> مؤشرات الاعتماد (تُحدد تلقائيًا)</p>
      {codes.length ? (
        <div className="flex flex-wrap gap-1">
          {codes.map(c => <span key={c} dir="ltr" title={INDICATOR_TEXT[c]} className="text-[11px] font-bold rounded-md bg-white text-leaf-700 border border-leaf-200 px-1.5 py-0.5">{c}</span>)}
        </div>
      ) : <p className="text-xs text-slate-500">لا توجد مؤشرات مرتبطة</p>}
    </div>
  );
}
