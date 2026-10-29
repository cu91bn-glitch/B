import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Sparkles, Globe, Shirt, ShieldAlert, HeartHandshake, ListChecks,
  Scale, HandHeart, ClipboardCheck, Award, CalendarDays, Smile,
  Users, GraduationCap, UserX, FileUser, FileText, Upload,
  ChevronLeft, ChevronRight, Loader2, X,
} from 'lucide-react';
import { fileModules, frequentAbsentees, topStudents, type FileModule } from '@/data';
import { EvidenceUploader } from '@/components/EvidenceUploader';
import { fetchEvidenceCount } from '@/lib/supabase';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Sparkles, Globe, Shirt, ShieldAlert, HeartHandshake, ListChecks,
  Scale, HandHeart, ClipboardCheck, Award, CalendarDays, Smile,
  Users, GraduationCap, UserX, FileUser, FileText,
};

const categoryConfig = {
  career: { label: 'التوجيه المهني', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  self_eval: { label: 'التقويم الذاتي', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  community: { label: 'المجتمع', color: 'sky', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  documents: { label: 'الوثائق', color: 'slate', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' },
};

export function FileModulesSection() {
  const [activeCategory, setActiveCategory] = useState<string>('career');
  const [selectedModule, setSelectedModule] = useState<FileModule | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadCounts = useCallback(async () => {
    const entries = await Promise.all(
      fileModules.map(async (m) => {
        try {
          const count = await fetchEvidenceCount(m.id);
          return [m.id, count] as const;
        } catch {
          return [m.id, 0] as const;
        }
      })
    );
    setCounts(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const categories = Object.keys(categoryConfig);
  const filteredModules = fileModules.filter(m => m.category === activeCategory);

  return (
    <section id="files" className="py-12 bg-slate-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-cairo">الملفات والشواهد المرتبطة</h2>
            <p className="text-sm text-slate-500">التوجيه المهني والتقويم الذاتي والمجتمع والوثائق - رفع الشواهد بالصور وPDF</p>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(cat => {
            const config = categoryConfig[cat as keyof typeof categoryConfig];
            const moduleCount = fileModules.filter(m => m.category === cat).length;
            const totalEvidence = fileModules
              .filter(m => m.category === cat)
              .reduce((sum, m) => sum + (counts[m.id] || 0), 0);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? `${config.bg} ${config.text} border ${config.border} shadow-sm`
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
                {config.label}
                <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded-full">{moduleCount}</span>
                {totalEvidence > 0 && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">{totalEvidence}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((m, i) => {
            const Icon = iconMap[m.icon] || FileText;
            const config = categoryConfig[m.category as keyof typeof categoryConfig];
            const count = counts[m.id] || 0;
            return (
              <div
                key={m.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 animate-slide-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${config.text}`} />
                  </div>
                  {count > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {count} شاهد
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1 font-cairo">{m.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{m.description}</p>
                <button
                  onClick={() => setSelectedModule(m)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  رفع وعرض الشواهد
                </button>
              </div>
            );
          })}
        </div>

        {/* Top students & absentees under community */}
        {activeCategory === 'community' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
            {/* Top students */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                </div>
                <h4 className="text-base font-bold text-slate-800 font-cairo">الطلاب المتميزون دراسياً</h4>
              </div>
              <div className="space-y-2">
                {topStudents.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-emerald-50/30 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      s.rank === 1 ? 'bg-amber-100 text-amber-700' : s.rank === 2 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'
                    }`}>
                      #{s.rank}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.grade} - {s.notes}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{s.gpa}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Frequent absentees */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <UserX className="w-5 h-5 text-orange-600" />
                </div>
                <h4 className="text-base font-bold text-slate-800 font-cairo">متكرري الغياب والأولى بالرعاية</h4>
              </div>
              <div className="space-y-2">
                {frequentAbsentees.map(a => (
                  <div key={a.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg hover:bg-orange-50/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <UserX className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-medium text-slate-800">{a.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.status === 'improved' ? 'bg-green-100 text-green-700' :
                          a.status === 'referred' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>{a.statusLabel}</span>
                      </div>
                      <p className="text-xs text-slate-400">{a.grade} - {a.absenceDays} يوم غياب</p>
                      <p className="text-xs text-slate-500 mt-1">{a.interventionPlan}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Module modal with uploader */}
        {selectedModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedModule(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-l from-emerald-50 to-white">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = iconMap[selectedModule.icon] || FileText;
                    return <Icon className="w-5 h-5 text-emerald-600" />;
                  })()}
                  <h3 className="text-lg font-bold text-slate-800 font-cairo">{selectedModule.title}</h3>
                </div>
                <button onClick={() => setSelectedModule(null)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto px-6 py-5 flex-1">
                <p className="text-sm text-slate-500 mb-4">{selectedModule.description}</p>
                <EvidenceUploader
                  module={selectedModule.id}
                  category={selectedModule.categoryLabel}
                  onCountChange={() => loadCounts()}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
