import { useState, useEffect, useCallback } from 'react';
import {
  Target, Loader2, CheckCircle2, AlertTriangle, TrendingUp,
  FileText, Award,
} from 'lucide-react';
import { fetchReadinessStats } from '@/lib/supabase';
import {
  accreditationDomains, indicatorColorMap, type AccreditationIndicator,
} from '@/data/accreditationIndicators';

interface ReadinessRow {
  indicator: AccreditationIndicator;
  count: number;
  gap: number;
  ready: boolean;
}

export function ReadinessDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await fetchReadinessStats();
      const map: Record<string, number> = {};
      for (const r of rows) map[r.code] = r.count;
      setStats(map);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows: ReadinessRow[] = accreditationDomains.flatMap(domain =>
    domain.indicators.map(ind => ({
      indicator: ind,
      count: stats[ind.code] || 0,
      gap: Math.max(0, ind.requiredEvidence - (stats[ind.code] || 0)),
      ready: (stats[ind.code] || 0) >= ind.requiredEvidence,
    }))
  );

  const totalReady = rows.filter(r => r.ready).length;
  const totalIndicators = rows.length;
  const overallPct = totalIndicators > 0 ? (totalReady / totalIndicators) * 100 : 0;
  const totalEvidence = rows.reduce((s, r) => s + r.count, 0);
  const totalGaps = rows.reduce((s, r) => s + r.gap, 0);

  return (
    <section id="readiness" className="py-12 bg-gradient-to-b from-slate-50 to-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-cairo">لوحة جاهزية الاعتماد المدرسي</h2>
            <p className="text-sm text-slate-500">ربط الشواهد بمؤشرات الاعتماد وتحليل الفجوات</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <AlertTriangle className="w-6 h-6 ml-2" />
            تعذّر تحميل بيانات الجاهزية
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Award className="w-4.5 h-4.5 text-emerald-600" />
                  </div>
                  <span className="text-xs text-slate-500">نسبة الجاهزية</span>
                </div>
                <p className="text-2xl font-bold text-emerald-600 font-cairo">{overallPct.toFixed(0)}%</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4.5 h-4.5 text-sky-600" />
                  </div>
                  <span className="text-xs text-slate-500">مؤشرات جاهزة</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 font-cairo">
                  {totalReady}<span className="text-base text-slate-400"> / {totalIndicators}</span>
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <FileText className="w-4.5 h-4.5 text-amber-600" />
                  </div>
                  <span className="text-xs text-slate-500">إجمالي الشواهد</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 font-cairo">{totalEvidence}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-rose-600" />
                  </div>
                  <span className="text-xs text-slate-500">فجوات متبقية</span>
                </div>
                <p className="text-2xl font-bold text-slate-800 font-cairo">{totalGaps}</p>
              </div>
            </div>

            <div className="space-y-5">
              {accreditationDomains.map(domain => {
                const colors = indicatorColorMap[domain.color];
                const domainRows = rows.filter(r => r.indicator.domain === domain.id);
                const domainReady = domainRows.filter(r => r.ready).length;
                return (
                  <div key={domain.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className={`px-5 py-3 ${colors.bg} ${colors.border} border-b flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-8 h-8 rounded-lg ${colors.bar} text-white text-sm font-bold flex items-center justify-center`}>
                          {domain.code}
                        </span>
                        <h3 className={`text-sm font-bold ${colors.text} font-cairo`}>{domain.title}</h3>
                      </div>
                      <span className={`text-xs ${colors.text} font-medium`}>
                        {domainReady} / {domainRows.length} جاهز
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {domainRows.map(({ indicator, count, gap, ready }) => (
                        <div key={indicator.code} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex-shrink-0">
                            {ready ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-400">{indicator.code}</span>
                              <p className="text-sm font-medium text-slate-700 truncate">{indicator.title}</p>
                            </div>
                            <p className="text-xs text-slate-400 truncate">{indicator.description}</p>
                          </div>
                          <div className="flex-shrink-0 text-left">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    ready ? 'bg-emerald-500' : 'bg-amber-400'
                                  }`}
                                  style={{ width: `${Math.min(100, (count / indicator.requiredEvidence) * 100)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold ${ready ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {count}/{indicator.requiredEvidence}
                              </span>
                              {gap > 0 && (
                                <span className="text-xs text-rose-500">فجوة {gap}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
