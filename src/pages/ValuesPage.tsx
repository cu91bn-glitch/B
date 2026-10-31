import { useState } from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import { valuesMatrix } from '@/data';

/** مصفوفة القيم: مرجع للقيم ومؤشراتها السلوكية وأساليب تقويمها والبرامج المقترحة */
export function ValuesPage() {
  const [open, setOpen] = useState<number | null>(valuesMatrix[0]?.id ?? null);
  return (
    <div className="px-4 sm:px-6 lg:px-10 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      {valuesMatrix.map(v => {
        const isOpen = open === v.id;
        return (
          <div key={v.id} className={`rounded-2xl border bg-white shadow-sm transition-all ${isOpen ? 'border-brand-200 shadow-md' : 'border-slate-200'}`}>
            <button onClick={() => setOpen(isOpen ? null : v.id)} className="w-full flex items-center gap-3 p-4 text-right">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-leaf-500 text-white flex items-center justify-center shrink-0"><Heart className="w-5 h-5" /></div>
              <div className="flex-1">
                <p className="font-extrabold text-brand-900">{v.value}</p>
                <p className="text-sm text-slate-600 leading-6">{v.definition}</p>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {[['المؤشرات السلوكية', v.behavioralIndicators, 'bg-brand-50 text-brand-900'], ['أساليب التقويم', v.evaluationMethods, 'bg-leaf-50 text-leaf-800'], ['البرامج المقترحة', v.programs, 'bg-amber-50 text-amber-900']].map(([title, list, cls]) => (
                  <div key={title as string} className={`rounded-xl p-3 ${cls}`}>
                    <p className="font-extrabold mb-1.5">{title as string}</p>
                    <ul className="list-disc pr-4 space-y-1 leading-6">{(list as string[]).map(x => <li key={x}>{x}</li>)}</ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
