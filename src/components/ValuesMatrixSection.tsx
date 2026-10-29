import { useState } from 'react';
import { Flag, Heart, Scale, Lightbulb, Award, Clock, RefreshCw, Smile, Flame, X, Target, CheckCircle2, FileText } from 'lucide-react';
import { valuesMatrix, type ValueItem } from '@/data';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Flag, Heart, Scale, Lightbulb, Award, Clock, RefreshCw, Smile, Flame,
};

const valueIcons = ['Flag', 'Heart', 'Scale', 'Lightbulb', 'Award', 'Clock', 'RefreshCw', 'Smile', 'Flame'];

const colorMap = [
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', bar: 'bg-amber-500' },
  { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500', bar: 'bg-sky-500' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', bar: 'bg-rose-500' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', bar: 'bg-violet-500' },
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', bar: 'bg-teal-500' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', bar: 'bg-orange-500' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', bar: 'bg-cyan-500' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', bar: 'bg-indigo-500' },
];

export function ValuesMatrixSection() {
  const [selectedValue, setSelectedValue] = useState<ValueItem | null>(null);

  return (
    <section id="values" className="py-12 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-cairo">مصفوفة القيم</h2>
            <p className="text-sm text-slate-500">القيم التسع المنبثقة من إطار الموارد البشرية - التعريف والمؤشرات السلوكية وطرق التقييم والبرامج</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {valuesMatrix.map((item, i) => {
            const iconName = valueIcons[i] || 'Target';
            const Icon = iconMap[iconName] || Target;
            const color = colorMap[i % colorMap.length];
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border ${color.border} shadow-sm hover:shadow-md transition-all p-4 animate-slide-up cursor-pointer`}
                style={{ animationDelay: `${i * 40}ms` }}
                onClick={() => setSelectedValue(item)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-11 h-11 rounded-xl ${color.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${color.text}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>القيمة {item.id}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 font-cairo">{item.value}</h4>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{item.definition}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{item.behavioralIndicators.length} مؤشرات سلوكية</span>
                  <span className="text-slate-400">{item.programs.length} برامج</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color.bar} rounded-full`} style={{ width: '100%' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedValue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedValue(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-l from-emerald-50 to-white">
              <h3 className="text-lg font-bold text-slate-800 font-cairo">قيمة: {selectedValue.value}</h3>
              <button onClick={() => setSelectedValue(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 flex-1 space-y-5">
              <div className="p-4 bg-emerald-50 rounded-xl">
                <p className="text-sm text-slate-700 leading-relaxed">{selectedValue.definition}</p>
              </div>

              <div>
                <h5 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  المؤشرات السلوكية
                </h5>
                <div className="space-y-2">
                  {selectedValue.behavioralIndicators.map((ind, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {ind}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <Target className="w-4 h-4 text-amber-600" />
                  طرق التقييم
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedValue.evaluationMethods.map((method, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      {method}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                  <FileText className="w-4 h-4 text-sky-600" />
                  البرامج المرتبطة
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedValue.programs.map((prog, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-sky-50 rounded-lg text-sm text-sky-800">
                      <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      {prog}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
